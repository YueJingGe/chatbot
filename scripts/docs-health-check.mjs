#!/usr/bin/env node
// docs-health-check.mjs — CI 文档健康检查脚本
//
// 用于 CI Pipeline 运行，比 pre-commit hook 更全面的检查。
// 零依赖：仅使用 Node.js 原生模块 (fs, path, url)。

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// 颜色
const RED = '\x1b[0;31m';
const YELLOW = '\x1b[1;33m';
const GREEN = '\x1b[0;32m';
const NC = '\x1b[0m';

let WARNINGS = 0;
let ERRORS = 0;

function warn(msg) {
  console.log(`${YELLOW}[WARN]${NC} ${msg}`);
  WARNINGS++;
}

function error(msg) {
  console.log(`${RED}[ERROR]${NC} ${msg}`);
  ERRORS++;
}

function ok(msg) {
  console.log(`${GREEN}[OK]${NC} ${msg}`);
}

// 加载配置
function loadConfig() {
  const configPath = path.join(ROOT, '.docs-guard.config.json');
  if (fs.existsSync(configPath)) {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }
  return {
    checks: {
      dependencyChange: true,
      apiChange: true,
      agentsMdSize: true,
      harnessFrontmatter: true,
      internalLinks: true,
      knowledgeFreshness: true,
      proposedTagCount: true,
    },
    thresholds: {
      agentsMdMaxLines: 200,
      knowledgeMaxAgeDays: 30,
      harnessMaxRuleLines: 15,
    },
    paths: {
      apiPatterns: ['server/server.js'],
      knowledgeDir: 'docs/knowledge',
      harnessDir: 'docs/harness',
    },
  };
}

// 递归读取目录下所有 .md 文件
function findMarkdownFiles(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findMarkdownFiles(fullPath));
    } else if (entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  return files;
}

// 从 markdown 中提取反引号内的路径引用（排除代码块）
function extractPathReferences(content) {
  const refs = [];
  const lines = content.split('\n');
  let inCodeBlock = false;

  for (const line of lines) {
    // 跳过代码块
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    // 跳过表格行
    if (line.includes('|') && (line.includes('---') || line.trim().startsWith('|'))) continue;

    // 提取行内反引号中的短路径引用（只匹配看起来像文件路径的）
    const inlineRegex = /`([^`]{1,100})`;/g;
    let match;
    while ((match = inlineRegex.exec(line)) !== null) {
      const ref = match[1];
      // 只匹配以 .md, .css, .tsx, .ts, .js 结尾的路径，或在 docs/ 下的路径
      if (/\.(md|css|tsx|ts|js)$/.test(ref) || ref.startsWith('docs/')) {
        refs.push(ref);
      }
    }
  }
  return refs;
}

// ============ Check 1: AGENTS.md 行数 ============
function checkAgentsMdSize(config) {
  if (!config.checks.agentsMdSize) return;

  const agentsPath = path.join(ROOT, 'AGENTS.md');
  if (!fs.existsSync(agentsPath)) {
    error('AGENTS.md 不存在');
    return;
  }

  const content = fs.readFileSync(agentsPath, 'utf-8');
  const lines = content.split('\n').length;
  const maxLines = config.thresholds.agentsMdMaxLines;

  if (lines > maxLines) {
    error(`AGENTS.md 有 ${lines} 行，超过限制 ${maxLines} 行。请将内容拆分到 docs/harness/ 或 docs/knowledge/ 中。`);
  } else {
    ok(`AGENTS.md 行数: ${lines}/${maxLines}`);
  }
}

// ============ Check 2: Harness 文件 frontmatter ============
function checkHarnessFrontmatter(config) {
  if (!config.checks.harnessFrontmatter) return;

  const harnessDir = path.join(ROOT, config.paths.harnessDir);
  const files = findMarkdownFiles(harnessDir);

  let hasIssue = false;
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const firstLine = content.split('\n')[0];
    if (firstLine !== '---') {
      const relPath = path.relative(ROOT, file);
      warn(`${relPath} 缺少 frontmatter (--- 开头)`);
      hasIssue = true;
    }
  }

  if (!hasIssue) {
    ok('所有 harness 文件 frontmatter 完整。');
  }
}

// ============ Check 3: 文档内部链接有效性 ============
function checkInternalLinks(config) {
  if (!config.checks.internalLinks) return;

  const docsDir = path.join(ROOT, 'docs');
  const files = findMarkdownFiles(docsDir);

  let linkErrors = 0;
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const refs = extractPathReferences(content);

    for (const ref of refs) {
      // 跳过非路径引用
      if (ref.includes('#') && !ref.includes('/')) continue;
      if (ref.includes('npm ') || ref.includes('git ') || ref.includes('import ')) continue;

      // 检查文件是否存在
      if (!fs.existsSync(path.join(ROOT, ref))) {
        const relPath = path.relative(ROOT, file);
        warn(`文档引用可能不存在: ${ref} (在 ${relPath} 中)`);
        linkErrors++;
      }
    }
  }

  if (linkErrors === 0) {
    ok('文档内部链接检查通过。');
  } else {
    warn(`共发现 ${linkErrors} 个可能失效的文档引用。`);
  }
}

// ============ Check 4: Knowledge 文档 freshness ============
function checkKnowledgeFreshness(config) {
  if (!config.checks.knowledgeFreshness) return;

  const knowledgeDir = path.join(ROOT, config.paths.knowledgeDir);
  const maxAgeDays = config.thresholds.knowledgeMaxAgeDays;
  const files = findMarkdownFiles(knowledgeDir);

  const now = Date.now();
  let staleCount = 0;

  for (const file of files) {
    const relPath = path.relative(ROOT, file);
    if (relPath.includes('index.md')) continue;

    const stats = fs.statSync(file);
    const mtime = stats.mtimeMs;
    const ageDays = Math.floor((now - mtime) / (1000 * 60 * 60 * 24));

    if (ageDays > maxAgeDays) {
      warn(`${relPath} 已 ${ageDays} 天未更新（阈值: ${maxAgeDays} 天）`);
      staleCount++;
    }
  }

  if (staleCount === 0) {
    ok('所有 knowledge 文档都是最新的。');
  }
}

// ============ Check 5: [PROPOSED] 标签数量 ============
function checkProposedTagCount(config) {
  if (!config.checks.proposedTagCount) return;

  const harnessDir = path.join(ROOT, config.paths.harnessDir);
  const files = findMarkdownFiles(harnessDir);

  let proposedCount = 0;
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const matches = content.match(/\[PROPOSED\]/g);
    if (matches) {
      proposedCount += matches.length;
    }
  }

  if (proposedCount > 0) {
    warn(`docs/harness/ 中有 ${proposedCount} 处 [PROPOSED] 标签未处理，请及时审批或移除。`);
  } else {
    ok('无待处理的 [PROPOSED] 标签。');
  }
}

// ============ Check 6: 必需文件存在性 ============
function checkRequiredFiles() {
  const required = [
    'AGENTS.md',
    'docs/harness/architecture.md',
    'docs/harness/code-style.md',
    'docs/harness/security.md',
    'docs/knowledge/tech-stack.md',
    'docs/knowledge/directory-structure.md',
    'docs/knowledge/data-flow.md',
  ];

  let missing = 0;
  for (const file of required) {
    const fullPath = path.join(ROOT, file);
    if (!fs.existsSync(fullPath)) {
      error(`必需文件不存在: ${file}`);
      missing++;
    }
  }

  if (missing === 0) {
    ok('所有必需文档文件存在。');
  }
}

// ============ Check 7: .env 未提交检查 ============
function checkEnvNotCommitted() {
  const envPath = path.join(ROOT, '.env');
  const gitignorePath = path.join(ROOT, '.gitignore');

  if (fs.existsSync(envPath)) {
    // 检查 .gitignore 是否排除了 .env
    if (fs.existsSync(gitignorePath)) {
      const gitignore = fs.readFileSync(gitignorePath, 'utf-8');
      if (!gitignore.includes('.env')) {
        warn('.gitignore 中没有排除 .env 文件');
      }
    }
  }
}

// ============ Main ============
function main() {
  console.log('==========================================');
  console.log('  Docs Guard — CI Health Check');
  console.log('==========================================');
  console.log('');

  const config = loadConfig();

  checkRequiredFiles();
  checkAgentsMdSize(config);
  checkHarnessFrontmatter(config);
  checkInternalLinks(config);
  checkKnowledgeFreshness(config);
  checkProposedTagCount(config);
  checkEnvNotCommitted();

  console.log('');
  console.log('==========================================');

  if (ERRORS > 0) {
    console.log(`${RED}Docs Guard: ${ERRORS} 错误, ${WARNINGS} 警告${NC}`);
    console.log(`${RED}CI 检查失败，请修复上述错误。${NC}`);
    console.log('==========================================');
    process.exit(1);
  } else if (WARNINGS > 0) {
    console.log(`${YELLOW}Docs Guard: 0 错误, ${WARNINGS} 警告${NC}`);
    console.log(`${YELLOW}检查通过，但请处理上述警告。${NC}`);
    console.log('==========================================');
    process.exit(0);
  } else {
    ok('Docs Guard: 所有检查通过 ✅');
    console.log('==========================================');
    process.exit(0);
  }
}

main();
