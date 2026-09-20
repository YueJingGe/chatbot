#!/usr/bin/env node
/* eslint-disable no-console */
import { execFileSync } from "node:child_process";
import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  openSync,
  closeSync,
  readSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ledgerDir = resolve(repoRoot, "docs/ledger");
const ledgerPath = resolve(ledgerDir, "CORE-LEDGER.md");

const corePathPatterns = [
  /^web\/src\/hooks\//,
  /^web\/src\/types\//,
  /^server\//,
  /^\.agents\//,
  /^docs\/harness\//,
];

const complexityPatterns = [
  { id: "protocol-export", pattern: /(^|\/)(protocol|protocal|index)\.tsx?$/ },
  { id: "module-registration", pattern: /(^|\/)module\.tsx?$/ },
  { id: "feature-system-init", pattern: /featureSystemInit\.tsx?$/ },
  { id: "registered-features", pattern: /registeredFeatures\.tsx?$/ },
  { id: "store-change", pattern: /store|Store/ },
  { id: "mode-change", pattern: /mode|Mode/ },
];

const colors = {
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  reset: "\x1b[0m",
};

function execGit(args) {
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
  });
}

function parseArgs(argv) {
  const options = {
    base: "",
    head: "HEAD",
    writeTemplate: false,
    strict: false,
    interactive: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--strict") {
      options.strict = true;
      continue;
    }

    if (arg === "--interactive") {
      options.interactive = true;
      continue;
    }

    if (arg === "--write-template") {
      options.writeTemplate = true;
      continue;
    }

    if (arg === "--base" || arg === "--head") {
      const value = argv[index + 1] || "";
      if (!value) {
        throw new Error(`${arg} 缺少 ref`);
      }
      options[arg === "--base" ? "base" : "head"] = value;
      index += 1;
      continue;
    }
  }

  return options;
}

function collectFiles(options) {
  const parseNulPaths = (value) => value.split("\0").filter(Boolean);

  if (options.base) {
    return parseNulPaths(
      execGit(["diff", "--name-only", "--no-renames", "-z", `${options.base}..${options.head}`])
    ).sort();
  }

  const workingTreeFiles = parseNulPaths(
    execGit(["diff", "--name-only", "--no-renames", "-z", "HEAD"])
  );
  const stagedFiles = parseNulPaths(
    execGit(["diff", "--cached", "--name-only", "--no-renames", "-z", "HEAD"])
  );
  const untrackedFiles = parseNulPaths(
    execGit(["ls-files", "--others", "--exclude-standard", "-z"])
  );

  return [...new Set([...workingTreeFiles, ...stagedFiles, ...untrackedFiles])].sort();
}

function isCorePath(file) {
  return corePathPatterns.some((pattern) => pattern.test(file));
}

function detectComplexityHits(files) {
  return files.flatMap((file) =>
    complexityPatterns
      .filter((item) => item.pattern.test(file))
      .map((item) => ({ file, type: item.id }))
  );
}

function isStrictMode(options) {
  if (options.strict) {
    return true;
  }
  if (process.env.CHATBOT_PUSH_STRICT === "1") {
    return true;
  }
  try {
    const configValue = execGit(["config", "--local", "chatbot.pushStrict"]).trim();
    return configValue === "1" || configValue === "true";
  } catch {
    return false;
  }
}

function isStrictModeConfigured() {
  if (process.env.CHATBOT_PUSH_STRICT !== undefined) {
    return true;
  }
  try {
    execGit(["config", "--local", "chatbot.pushStrict"]);
    return true;
  } catch {
    return false;
  }
}

function setStrictConfig(value) {
  execGit(["config", "--local", "chatbot.pushStrict", value]);
}

function promptFromTty(question) {
  if (!process.stdout.isTTY) {
    return "";
  }
  let fd;
  try {
    fd = openSync("/dev/tty", "rs");
  } catch {
    return "";
  }
  try {
    process.stdout.write(question);
    const buffer = Buffer.alloc(1024);
    const bytesRead = readSync(fd, buffer, 0, 1024);
    return buffer.toString("utf8", 0, bytesRead).trim();
  } finally {
    closeSync(fd);
  }
}

function shouldSkip() {
  return process.env.CHATBOT_LEDGER_SKIP === "1";
}

function resolveBaseRef(options) {
  if (options.base) {
    return options.base;
  }
  if (process.env.CHATBOT_LEDGER_BASE_REF) {
    return process.env.CHATBOT_LEDGER_BASE_REF;
  }
  try {
    const configValue = execGit(["config", "--local", "chatbot.ledgerBaseRef"]).trim();
    return configValue || "";
  } catch {
    return "";
  }
}

function ensureLedgerTemplate() {
  if (existsSync(ledgerPath)) {
    return;
  }

  mkdirSync(ledgerDir, { recursive: true });
  writeFileSync(
    ledgerPath,
    [
      "# Core Change Ledger",
      "",
      "> 记录核心模块变更的决策理由。当改动涉及 `web/src/hooks/`、`web/src/types/`、`server/`、`.agents/**` 或 `docs/harness/**` 时，请在本文件追加条目。",
      ">",
      "> 填写原则：诚实、简洁、面向 review。不需要每个字段都写，但 `Why the change is unavoidable` 必须回答。",
      "",
      "## 条目模板",
      "",
      "```markdown",
      "### YYYY-MM-DD | scope | 简短描述",
      "",
      "- Added: 新增了什么",
      "- Reused: 复用了什么现有逻辑/组件/类型",
      "- Removed: 删除了什么",
      "- Consolidated: 合并/折叠了什么重复代码",
      "- Why the change is unavoidable: 为什么必须做这个改动，不做的代价是什么",
      "- Smaller-diff alternative considered: 是否考虑过更小的改动方案，为什么被否决",
      "```",
      "",
      "## 变更记录",
      "",
    ].join("\n"),
    "utf8"
  );
}

function formatList(items, maxItems = 8) {
  const visible = items.slice(0, maxItems);
  const more = items.length > maxItems ? `  ... 等 ${items.length} 个文件` : "";
  return visible.map((item) => `    - ${item}`).join("\n") + more;
}

function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`${colors.red}[push-gate] ${error.message}${colors.reset}`);
    process.exitCode = 1;
    return;
  }

  if (shouldSkip()) {
    console.log("[push-gate] CHATBOT_LEDGER_SKIP=1，跳过 ledger 检查");
    return;
  }

  const base = resolveBaseRef(options);
  const effectiveOptions = { ...options, base };

  let files;
  try {
    files = collectFiles(effectiveOptions);
  } catch (error) {
    console.error(`${colors.red}[push-gate] 无法获取变更文件：${error.message}${colors.reset}`);
    process.exitCode = 1;
    return;
  }

  const coreFiles = files.filter(isCorePath);
  const complexityHits = detectComplexityHits(coreFiles);
  const ledgerExists = existsSync(ledgerPath);
  const strict = isStrictMode(options);

  if (options.writeTemplate && coreFiles.length > 0) {
    ensureLedgerTemplate();
    console.log(`[push-gate] 已生成 ledger 模板：${ledgerPath}`);
    console.log("          请填写后重新提交/推送。");
    return;
  }

  if (coreFiles.length === 0) {
    console.log("[push-gate] 未涉及核心路径，跳过 ledger 检查");
    return;
  }

  if (options.interactive && !isStrictModeConfigured()) {
    const answer = promptFromTty(
      `${colors.cyan}[push-gate] 检测到核心路径变更。是否启用严格模式？（y/N，后续可通过 CHATBOT_PUSH_STRICT=1 或 git config --local chatbot.pushStrict 1 启用）：${colors.reset} `
    );
    if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
      setStrictConfig("1");
      console.log("[push-gate] 已启用严格模式并写入本地 git config");
    } else {
      setStrictConfig("0");
      console.log("[push-gate] 已禁用严格模式并写入本地 git config（本次按轻量模式处理）");
    }
  }

  const issues = [];

  if (!ledgerExists) {
    issues.push({
      code: "CORE_LEDGER_MISSING",
      level: strict ? "error" : "warning",
      message: `核心路径文件变更，但 ${ledgerPath} 不存在。`,
    });
  }

  if (complexityHits.length > 0) {
    issues.push({
      code: "COMPLEXITY_LEDGER_REQUIRED",
      level: strict ? "error" : "warning",
      message: `命中复杂度敏感文件，需在 ledger 中说明变更理由。`,
    });
  }

  if (issues.length === 0) {
    console.log("[push-gate] 核心路径检查通过");
    return;
  }

  const hasError = issues.some((issue) => issue.level === "error");
  const color = hasError ? colors.red : colors.yellow;

  console.log(
    `${color}[push-gate] ${strict ? "严格模式" : "轻量模式"} 检测到核心路径变更${colors.reset}`
  );
  console.log(`${color}涉及文件：${colors.reset}`);
  console.log(formatList(coreFiles));

  if (complexityHits.length > 0) {
    console.log(`${color}复杂度敏感命中：${colors.reset}`);
    console.log(formatList(complexityHits.map((hit) => `${hit.file} (${hit.type})`)));
  }

  console.log(`${color}问题：${colors.reset}`);
  for (const issue of issues) {
    const issueColor = issue.level === "error" ? colors.red : colors.yellow;
    console.log(`  ${issueColor}${issue.code}:${colors.reset} ${issue.message}`);
  }

  console.log(`${colors.cyan}修复提示：${colors.reset}`);
  console.log(`  1. 生成模板：node scripts/push-gate.mjs --write-template`);
  console.log(`  2. 填写 ledger：${ledgerPath}`);
  console.log(`  3. 重新 add/commit/push`);
  console.log(`${colors.cyan}如需绕过（merge/rebase/integration push）：${colors.reset}`);
  console.log(`  CHATBOT_LEDGER_SKIP=1 git push`);
  console.log(`  或指定基础分支：CHATBOT_LEDGER_BASE_REF=<branch> git push`);

  if (hasError) {
    process.exitCode = 1;
  }
}

main();
