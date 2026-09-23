#!/usr/bin/env node
// 校验 harness 自身一致性：
// 1. skill frontmatter 完整性
// 2. .agents/skills 与 .claude/skills 同步一致性
// 3. AGENTS.md 引用可达性

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import process from "node:process";

const repoRoot = process.cwd();
const agentsDir = resolve(repoRoot, ".agents");
const agentsSkillsDir = resolve(agentsDir, "skills");
const claudeSkillsDir = resolve(repoRoot, ".claude/skills");
const agentsMdPath = resolve(repoRoot, "AGENTS.md");

const colors = {
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  reset: "\x1b[0m",
};

const errors = [];

function pushError(code, message, hint = "") {
  errors.push({ code, message, hint });
}

function listDirectoryEntries(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => !name.startsWith("."))
    .sort();
}

function listFilesRecursively(baseDir) {
  const files = [];
  function walk(current) {
    for (const entry of readdirSync(current)) {
      const full = join(current, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) {
        walk(full);
      } else {
        files.push(relative(baseDir, full));
      }
    }
  }
  walk(baseDir);
  return files.sort();
}

function readText(filePath) {
  return readFileSync(filePath, "utf8");
}

// 1. skill frontmatter 完整性
function checkSkillFrontmatter() {
  const skills = listDirectoryEntries(agentsSkillsDir);
  for (const skillName of skills) {
    const skillDir = resolve(agentsSkillsDir, skillName);
    const stat = statSync(skillDir);
    if (!stat.isDirectory()) continue;

    const skillMdPath = resolve(skillDir, "SKILL.md");
    if (!existsSync(skillMdPath)) {
      pushError(
        "SKILL_MD_MISSING",
        `.agents/skills/${skillName}/SKILL.md 不存在`,
        "每个 skill 目录下必须包含 SKILL.md"
      );
      continue;
    }

    const content = readText(skillMdPath);
    const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!frontmatterMatch) {
      pushError(
        "FRONTMATTER_MISSING",
        `.agents/skills/${skillName}/SKILL.md 缺少 frontmatter`,
        "文件开头必须有 --- 包裹的 YAML frontmatter"
      );
      continue;
    }

    const frontmatter = frontmatterMatch[1];
    const name = frontmatter.match(/^name:\s*(.+)$/m)?.[1]?.trim();
    const description = frontmatter.match(/^description:\s*(.+)$/m)?.[1]?.trim();

    if (!name || !description) {
      pushError(
        "FRONTMATTER_INCOMPLETE",
        `.agents/skills/${skillName}/SKILL.md frontmatter 不完整`,
        "frontmatter 必须包含 name 和 description"
      );
    }

    if (name && name !== skillName) {
      pushError(
        "NAME_MISMATCH",
        `.agents/skills/${skillName}/SKILL.md frontmatter name="${name}" 与目录名不一致`,
        "name 字段应与目录名一致"
      );
    }
  }
}

// 2. .agents/skills 与 .claude/skills 同步一致性
function checkSyncConsistency() {
  const sourceSkills = listDirectoryEntries(agentsSkillsDir);
  const targetSkills = listDirectoryEntries(claudeSkillsDir);

  // source 中的 skill 必须在 target 中存在且内容一致
  for (const skillName of sourceSkills) {
    const sourceDir = resolve(agentsSkillsDir, skillName);
    const targetDir = resolve(claudeSkillsDir, skillName);
    if (!existsSync(sourceDir) || !statSync(sourceDir).isDirectory()) continue;

    if (!existsSync(targetDir)) {
      pushError(
        "SKILL_NOT_SYNCED",
        `.claude/skills/${skillName} 缺失，与 .agents/skills/${skillName} 不同步`,
        "运行 npm run sync:agents"
      );
      continue;
    }

    const sourceFiles = listFilesRecursively(sourceDir);
    const targetFiles = listFilesRecursively(targetDir);

    if (sourceFiles.join(",") !== targetFiles.join(",")) {
      pushError(
        "SKILL_FILE_MISMATCH",
        `.claude/skills/${skillName} 文件清单与 .agents/skills/${skillName} 不一致`,
        "运行 npm run sync:agents"
      );
      continue;
    }

    for (const file of sourceFiles) {
      const sourceFile = join(sourceDir, file);
      const targetFile = join(targetDir, file);
      if (readText(sourceFile) !== readText(targetFile)) {
        pushError(
          "SKILL_CONTENT_DRIFT",
          `.claude/skills/${skillName}/${file} 与源文件内容不一致`,
          "运行 npm run sync:agents"
        );
      }
    }
  }

  // target 中多余的 skill 视为孤儿
  for (const skillName of targetSkills) {
    const sourceDir = resolve(agentsSkillsDir, skillName);
    if (!existsSync(sourceDir)) {
      pushError(
        "ORPHAN_SKILL",
        `.claude/skills/${skillName} 在 .agents/skills 中不存在`,
        "运行 npm run sync:agents"
      );
    }
  }
}

// 3. AGENTS.md 引用可达性
const rootReferenceFiles = new Set([
  "AGENTS.md",
  "CLAUDE.md",
  "README.md",
  "package.json",
  "llms.txt",
  ".gitignore",
  ".commitlintrc.cjs",
  ".prettierrc",
  ".prettierignore",
  ".stylelintrc",
  ".stylelintignore",
  ".eslintrc",
  ".eslintrc.cjs",
  ".cursorignore",
  ".claudeignore",
  ".coderabbit.yaml",
]);

const knownPathPrefixes = [
  ".agents/",
  "docs/",
  "web/",
  "server/",
  "scripts/",
  ".github/",
  ".husky/",
  "ISSUES/",
  "总结/",
  ".claude/",
];

function isReferencePath(text) {
  if (!text || typeof text !== "string") return false;
  if (text.includes("*") || text.includes("\n")) return false;
  if (text.includes(" ")) return false;
  if (/^(npm|git|node|npx)\b/.test(text)) return false;
  // 排除 npm script 名（含 : 但不含 / 和 .）
  if (text.includes(":") && !text.includes("/") && !text.includes(".")) return false;
  if (rootReferenceFiles.has(text)) return true;
  return knownPathPrefixes.some((prefix) => text.startsWith(prefix));
}

function checkAgentsMdReferences() {
  if (!existsSync(agentsMdPath)) {
    pushError("AGENTS_MD_MISSING", "AGENTS.md 不存在", "");
    return;
  }

  const content = readText(agentsMdPath);
  const seen = new Set();
  const matches = content.matchAll(/`([^`]+)`/g);
  for (const match of matches) {
    const text = match[1].trim();
    if (!isReferencePath(text)) continue;
    if (seen.has(text)) continue;
    seen.add(text);

    const targetPath = resolve(repoRoot, text);
    const expectedDir = text.endsWith("/");

    if (!existsSync(targetPath)) {
      pushError(
        "AGENTS_REFERENCE_BROKEN",
        `AGENTS.md 引用的路径不存在：\`${text}\``,
        "检查反引号内路径或更新 AGENTS.md"
      );
      continue;
    }

    const stat = statSync(targetPath);
    if (expectedDir && !stat.isDirectory()) {
      pushError(
        "AGENTS_REFERENCE_NOT_DIR",
        `AGENTS.md 引用的是目录但实为文件：\`${text}\``,
        "去掉尾部 / 或修正路径"
      );
    } else if (!expectedDir && stat.isDirectory()) {
      pushError(
        "AGENTS_REFERENCE_NOT_FILE",
        `AGENTS.md 引用的是文件但实为目录：\`${text}\``,
        "添加尾部 / 或修正路径"
      );
    }
  }
}

function main() {
  checkSkillFrontmatter();
  checkSyncConsistency();
  checkAgentsMdReferences();

  if (errors.length === 0) {
    console.log(`${colors.green}[check-harness] 全部通过${colors.reset}`);
    process.exitCode = 0;
    return;
  }

  console.error(`${colors.red}[check-harness] 发现 ${errors.length} 个问题${colors.reset}`);
  for (const { code, message, hint } of errors) {
    console.error(`  ${colors.red}${code}${colors.reset}: ${message}`);
    if (hint) console.error(`      ${colors.yellow}提示${colors.reset}: ${hint}`);
  }

  console.error(`\n${colors.yellow}通用修复：${colors.reset}npm run sync:agents`);
  process.exitCode = 1;
}

main();
