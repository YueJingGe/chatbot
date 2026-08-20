#!/usr/bin/env node

/**
 * 同步 .agents/ignore 到各 AI 工具的 ignore 文件
 *
 * 单一事实源：.agents/ignore
 * 目标文件：
 *   - .cursorignore (Cursor)
 *   - .claudeignore (Claude Code)
 *
 * 用法：
 *   node scripts/sync-ignore.js
 *   npm run sync:ignore
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 项目根目录
const ROOT = path.resolve(__dirname, "..");

// 单一事实源
const SOURCE_FILE = path.join(ROOT, ".agents/ignore");

// 目标文件配置
const TARGETS = [
  {
    file: ".cursorignore",
    header: `# Cursor Ignore File
# Auto-generated from .agents/ignore
# DO NOT EDIT MANUALLY - changes will be overwritten
# Source: .agents/ignore
# Sync: npm run sync:ignore
`,
  },
  {
    file: ".claudeignore",
    header: `# Claude Code Ignore File
# Auto-generated from .agents/ignore
# DO NOT EDIT MANUALLY - changes will be overwritten
# Source: .agents/ignore
# Sync: npm run sync:ignore
`,
  },
];

/**
 * 读取 .agents/ignore 内容
 */
function readSourceIgnore() {
  if (!fs.existsSync(SOURCE_FILE)) {
    console.error(`❌ Source file not found: ${SOURCE_FILE}`);
    process.exit(1);
  }

  const content = fs.readFileSync(SOURCE_FILE, "utf-8");

  // 过滤掉注释和空行，保留实际的 ignore 规则
  const lines = content.split("\n");
  const rules = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // 跳过空行和纯注释行
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    rules.push(trimmed);
  }

  return rules;
}

/**
 * 同步到目标文件
 */
function syncToTarget(target, rules) {
  const targetPath = path.join(ROOT, target.file);

  // 生成内容
  const content = target.header + "\n" + rules.join("\n") + "\n";

  // 内容对比：相同则跳过
  const existingContent = fs.existsSync(targetPath) ? fs.readFileSync(targetPath, "utf-8") : "";

  if (existingContent === content) {
    console.log(`⏭️  ${target.file} is already up-to-date`);
    return;
  }

  // 写入文件
  fs.writeFileSync(targetPath, content, "utf-8");
  console.log(`✅ Synced to ${target.file}`);
}

/**
 * 主函数
 */
function main() {
  console.log("🔄 Syncing .agents/ignore to AI tool ignore files...\n");

  // 读取源文件
  const rules = readSourceIgnore();
  console.log(`📖 Read ${rules.length} rules from .agents/ignore\n`);

  // 同步到每个目标
  for (const target of TARGETS) {
    syncToTarget(target, rules);
  }

  console.log("\n✨ Sync complete!");
}

// 执行
main();
