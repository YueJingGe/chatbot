#!/usr/bin/env node

/**
 * 同步 .agents/skills/ 到各 AI agent 的 skills 目录
 *
 * 单一事实源：.agents/skills/<skill-name>/
 * 目标目录（按 agent）：
 *   - claude-code → .claude/skills/<skill-name>/
 *   - cursor      → .cursor/rules/<skill-name>/（未来支持）
 *   - codex       → .codex/skills/<skill-name>/（未来支持）
 *
 * 用法：
 *   node scripts/sync-skills.js
 *   node scripts/sync-skills.js --agent claude-code
 *   node scripts/sync-skills.js -a claude-code,cursor
 *
 * 环境变量：
 *   SKILLS_TARGET_AGENTS=claude-code,cursor
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, "..");
const SKILLS_SOURCE = path.join(ROOT, ".agents/skills");

// agent → 目标目录映射
const AGENT_TARGETS = {
  "claude-code": ".claude/skills",
  cursor: ".cursor/rules",
  codex: ".codex/skills",
};

// 当前支持的 agent 列表
const SUPPORTED_AGENTS = Object.keys(AGENT_TARGETS);
const DEFAULT_AGENTS = ["claude-code"];

/**
 * 解析目标 agent 列表
 * 优先级：命令行参数 --agent > 环境变量 > 默认值
 */
function parseTargetAgents() {
  const argv = process.argv.slice(2);
  const flagIndex = argv.findIndex((arg) => arg === "--agent" || arg === "-a");
  const flagValue = flagIndex >= 0 ? argv[flagIndex + 1] : "";

  const rawValue = process.env.SKILLS_TARGET_AGENTS || flagValue || DEFAULT_AGENTS.join(",");

  return [
    ...new Set(
      rawValue
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean)
        .filter((a) => SUPPORTED_AGENTS.includes(a))
    ),
  ];
}

/**
 * 列出 skills 源目录中所有有效的 skill（必须有 SKILL.md）
 */
function listValidSkills() {
  if (!fs.existsSync(SKILLS_SOURCE)) {
    return [];
  }

  return fs
    .readdirSync(SKILLS_SOURCE, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => fs.existsSync(path.join(SKILLS_SOURCE, entry.name, "SKILL.md")))
    .map((entry) => entry.name);
}

/**
 * 递归列出目录下的所有文件（相对路径 + 内容）
 */
function listFilesRecursive(dir) {
  const result = new Map();

  function walk(currentDir, prefix) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        walk(fullPath, relPath);
      } else if (entry.isFile()) {
        result.set(relPath, fs.readFileSync(fullPath, "utf-8"));
      }
    }
  }

  walk(dir, "");
  return result;
}

/**
 * 比较两个文件 Map 是否相等
 */
function filesEqual(a, b) {
  if (a.size !== b.size) return false;
  for (const [key, value] of a) {
    if (!b.has(key) || b.get(key) !== value) return false;
  }
  return true;
}

/**
 * 同步单个 skill 到目标目录
 */
function syncSkill(skillName, targetDir) {
  const sourcePath = path.join(SKILLS_SOURCE, skillName);
  const targetPath = path.join(ROOT, targetDir, skillName);

  // 内容对比：相同则跳过
  if (fs.existsSync(targetPath)) {
    const existing = listFilesRecursive(targetPath);
    const source = listFilesRecursive(sourcePath);
    if (filesEqual(existing, source)) {
      return false; // 未变化
    }
  }

  // 删除目标目录再复制
  if (fs.existsSync(targetPath)) {
    fs.rmSync(targetPath, { recursive: true, force: true });
  }

  fs.cpSync(sourcePath, targetPath, { recursive: true });
  return true;
}

/**
 * 主函数
 */
function main() {
  console.log("🔄 Syncing .agents/skills/ to AI agent skill directories...\n");

  const skills = listValidSkills();
  if (skills.length === 0) {
    console.log("⏭️  No skills found in .agents/skills/");
    return;
  }

  const agents = parseTargetAgents();
  console.log(`📋 Found ${skills.length} skill(s), target agent(s): ${agents.join(", ")}\n`);

  for (const agent of agents) {
    const targetDir = AGENT_TARGETS[agent];
    fs.mkdirSync(path.join(ROOT, targetDir), { recursive: true });

    let syncedCount = 0;
    for (const skillName of skills) {
      const changed = syncSkill(skillName, targetDir);
      if (changed) syncedCount++;
    }

    if (syncedCount === 0) {
      console.log(`⏭️  ${targetDir} is already up-to-date (${skills.length} skills)`);
    } else {
      console.log(`✅ Synced ${syncedCount} skill(s) to ${targetDir}`);
    }
  }

  console.log("\n✨ Sync complete!");
}

main();
