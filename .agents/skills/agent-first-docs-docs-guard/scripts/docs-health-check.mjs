#!/usr/bin/env node

/**
 * Agent-First 文档守卫 - CI 校验脚本
 * 用法：node scripts/docs-health-check.mjs
 *
 * 检查项：
 * 1. 文档内部链接有效性
 * 2. harness 文件 frontmatter 完整性
 * 3. knowledge 文档时效性
 * 4. [PROPOSED] 标签统计
 * 5. AGENTS.md 行数
 * 6. harness 条目数量
 */

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const CONFIG_PATH = path.join(ROOT, ".docs-guard.config.json");

// ========== 配置加载 ==========

function loadConfig() {
  const defaults = {
    thresholds: {
      agentsMdMaxLines: 200,
      knowledgeMaxAgeDays: 30,
      harnessMaxRuleLines: 15,
    },
    paths: {
      knowledgeDir: "docs/knowledge",
      harnessDir: "docs/harness",
    },
  };
  try {
    const userConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
    return {
      thresholds: { ...defaults.thresholds, ...userConfig.thresholds },
      paths: { ...defaults.paths, ...userConfig.paths },
    };
  } catch {
    return defaults;
  }
}

const config = loadConfig();
const errors = [];
const warnings = [];

// ========== 工具函数 ==========

function readTextSafe(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}

function safeReaddir(dirPath) {
  try {
    return fs.readdirSync(dirPath);
  } catch {
    return [];
  }
}

function getAllMdFiles(dir) {
  const result = [];
  if (!fs.existsSync(dir)) return result;

  const entries = safeReaddir(dir);
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      result.push(...getAllMdFiles(fullPath));
    } else if (entry.endsWith(".md")) {
      result.push(fullPath);
    }
  }
  return result;
}

// ========== 检查项 ==========

/**
 * 检查 1：文档内部链接有效性
 * 扫描 docs/ 和 AGENTS.md 中的相对链接，检查目标文件是否存在
 */
function checkInternalLinks() {
  const mdFiles = [...getAllMdFiles(path.join(ROOT, "docs"))];

  const agentsPath = path.join(ROOT, "AGENTS.md");
  if (fs.existsSync(agentsPath)) mdFiles.push(agentsPath);

  const linkRegex = /\[.*?\]\((\.[^)]+)\)/g;

  for (const file of mdFiles) {
    const content = readTextSafe(file);
    if (!content) continue;

    let match;
    while ((match = linkRegex.exec(content)) !== null) {
      const link = match[1].split("#")[0].split("?")[0];
      if (!link) continue;

      const targetPath = path.resolve(path.dirname(file), link);
      if (!fs.existsSync(targetPath)) {
        const relFile = path.relative(ROOT, file);
        errors.push(
          `[链接失效] ${relFile} 中的链接 "${link}" 指向不存在的文件`
        );
      }
    }
  }
}

/**
 * 检查 2：harness 文件 frontmatter 完整性
 */
function checkHarnessFrontmatter() {
  const harnessDir = path.join(ROOT, config.paths.harnessDir);
  if (!fs.existsSync(harnessDir)) return;

  const mdFiles = safeReaddir(harnessDir).filter(
    (f) => f.endsWith(".md") && f !== "index.md"
  );

  const requiredFields = ["level", "owner", "last_reviewed", "review_cycle"];
  const validLevels = ["iron", "living", "guideline"];

  for (const file of mdFiles) {
    const filePath = path.join(harnessDir, file);
    const content = readTextSafe(filePath);
    if (!content) continue;

    if (filePath.endsWith("docs/harness/index.md")) return; // 忽略索引文件

    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!fmMatch) {
      errors.push(`[Frontmatter 缺失] docs/harness/${file} 缺少 frontmatter`);
      continue;
    }

    const fm = {};
    fmMatch[1].split("\n").forEach((line) => {
      const kv = line.match(/^(\w+):\s*(.+)$/);
      if (kv) {
        fm[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, "");
      }
    });

    for (const field of requiredFields) {
      if (!fm[field]) {
        errors.push(
          `[Frontmatter 不完整] docs/harness/${file} 缺少字段: ${field}`
        );
      }
    }

    if (fm.level && !validLevels.includes(fm.level)) {
      errors.push(
        `[Frontmatter 非法值] docs/harness/${file} 的 level "${
          fm.level
        }" 不在合法范围内 (${validLevels.join("/")})`
      );
    }
  }
}

/**
 * 检查 3：knowledge 文档时效性
 */
function checkKnowledgeFreshness() {
  const knowledgeDir = path.join(ROOT, config.paths.knowledgeDir);
  if (!fs.existsSync(knowledgeDir)) return;

  const maxAgeMs = config.thresholds.knowledgeMaxAgeDays * 24 * 60 * 60 * 1000;
  const now = Date.now();

  const mdFiles = getAllMdFiles(knowledgeDir).filter(
    (f) => !f.endsWith("index.md")
  );

  for (const file of mdFiles) {
    const stat = fs.statSync(file);
    const ageMs = now - stat.mtimeMs;
    if (ageMs > maxAgeMs) {
      const ageDays = Math.floor(ageMs / (24 * 60 * 60 * 1000));
      const relFile = path.relative(ROOT, file);
      warnings.push(
        `[文档过期] ${relFile} 已 ${ageDays} 天未更新（阈值: ${config.thresholds.knowledgeMaxAgeDays} 天）`
      );
    }
  }
}

/**
 * 检查 4：[PROPOSED] 标签统计
 */
function checkProposedTags() {
  const harnessDir = path.join(ROOT, config.paths.harnessDir);
  if (!fs.existsSync(harnessDir)) return;

  const mdFiles = safeReaddir(harnessDir).filter(
    (f) => f.endsWith(".md") && f.endsWith("docs/harness/index.md")
  );
  let totalProposed = 0;

  for (const file of mdFiles) {
    const content = readTextSafe(path.join(harnessDir, file));
    if (!content) continue;

    const count = (content.match(/<!--\s*\[PROPOSED\]/g) || []).length;
    if (count > 0) {
      totalProposed += count;
      warnings.push(
        `[待审批] docs/harness/${file} 有 ${count} 条 [PROPOSED] 约束等待人工审批`
      );
    }
  }

  if (totalProposed > 0) {
    console.log(`\n📋 共有 ${totalProposed} 条 [PROPOSED] 约束等待审批`);
  }
}

/**
 * 检查 5：AGENTS.md 行数
 */
function checkAgentsMdSize() {
  const agentsPath = path.join(ROOT, "AGENTS.md");
  if (!fs.existsSync(agentsPath)) return;

  const content = readTextSafe(agentsPath);
  if (!content) return;

  const lines = content.split("\n").length;
  const maxLines = config.thresholds.agentsMdMaxLines;

  if (lines > maxLines) {
    errors.push(
      `[行数超限] AGENTS.md 超过 ${maxLines} 行（当前 ${lines} 行），请拆分到 docs/harness/`
    );
  }
}

/**
 * 检查 6：harness 条目数量
 */
function checkHarnessRuleCount() {
  const harnessDir = path.join(ROOT, config.paths.harnessDir);
  if (!fs.existsSync(harnessDir)) return;

  const maxRules = config.thresholds.harnessMaxRuleLines;

  const mdFiles = safeReaddir(harnessDir).filter(
    (f) => f.endsWith(".md") && f !== "index.md"
  );

  for (const file of mdFiles) {
    const content = readTextSafe(path.join(harnessDir, file));
    if (!content) continue;

    // 去掉 frontmatter 后统计以 "- " 开头的行
    const contentWithoutFm = content.replace(/^---\n[\s\S]*?\n---\n/, "");
    const ruleLines = contentWithoutFm
      .split("\n")
      .filter((l) => /^\s*-\s+/.test(l));

    if (ruleLines.length > maxRules) {
      warnings.push(
        `[条目过多] docs/harness/${file} 约束条目超过 ${maxRules} 条（当前 ${ruleLines.length} 条），建议拆分或升级为自动化检查`
      );
    }
  }
}

// ========== 执行所有检查 ==========

checkInternalLinks();
checkHarnessFrontmatter();
checkKnowledgeFreshness();
checkProposedTags();
checkAgentsMdSize();
checkHarnessRuleCount();

// ========== 输出结果 ==========

console.log("\n========== Docs Guard 检查报告 ==========\n");

if (errors.length > 0) {
  console.log(`❌ 错误 (${errors.length}):`);
  errors.forEach((e) => console.log(`  ${e}`));
  console.log("");
}

if (warnings.length > 0) {
  console.log(`⚠️  警告 (${warnings.length}):`);
  warnings.forEach((w) => console.log(`  ${w}`));
  console.log("");
}

if (errors.length === 0 && warnings.length === 0) {
  console.log("✅ 所有检查通过，文档健康状态良好");
}

console.log("==========================================\n");

// CI 环境中，有错误则以非零退出码退出
if (errors.length > 0) {
  process.exit(1);
}
