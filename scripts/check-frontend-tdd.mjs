#!/usr/bin/env node
// 前端 TDD 门禁：检查本次 git 变更中 web/src/** 的逻辑文件是否带有同目录测试。
// 对 fix/hotfix 类提交额外检查是否包含测试文件变更，作为 Red 证据的机器兜底。

import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import process from "node:process";
import { execSync } from "node:child_process";

const repoRoot = process.cwd();
const webSrc = resolve(repoRoot, "web/src");

const colors = {
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  reset: "\x1b[0m",
};

function logError(message) {
  console.error(`${colors.red}✗${colors.reset} ${message}`);
}

function logWarn(message) {
  console.warn(`${colors.yellow}⚠${colors.reset} ${message}`);
}

function runGit(args) {
  return execSync(["git", ...args].join(" "), {
    encoding: "utf8",
    cwd: repoRoot,
    stdio: ["pipe", "pipe", "ignore"],
  })
    .trim()
    .split("\n")
    .filter(Boolean);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const baseIndex = args.indexOf("--base");
  const base = baseIndex >= 0 ? args[baseIndex + 1] : "HEAD";
  return { base };
}

function isFixLikeCommit(messages) {
  return messages.some((msg) => /^fix(\(|!|:)/i.test(msg));
}

function isFixLikeBranch() {
  try {
    const branch = runGit(["rev-parse", "--abbrev-ref", "HEAD"])[0] || "";
    return /^fix\//.test(branch) || /^hotfix\//.test(branch);
  } catch {
    return false;
  }
}

function getChangedFiles(base) {
  try {
    if (base === "HEAD") {
      // 检查工作区 + 暂存区 + 未跟踪文件（pre-commit 场景）
      const porcelain = runGit(["status", "--porcelain"]);
      return porcelain.map((line) => line.slice(3)).filter(Boolean);
    }
    // 排除已删除文件（D）：重命名/目录化后旧文件路径不应再被要求带测试
    return runGit(["diff", "--name-only", "--diff-filter=ACMRT", `${base}..HEAD`]);
  } catch {
    return [];
  }
}

function getCommitMessages(base) {
  try {
    if (base === "HEAD") {
      // 未提交变更无 commit message，返回空
      return [];
    }
    return runGit(["log", "--format=%s", `${base}..HEAD`]);
  } catch {
    return [];
  }
}

function shouldCheck(file) {
  if (!file.startsWith("web/src/")) return false;
  if (!/\.tsx?$/.test(file)) return false;
  if (/\.test\.(ts|tsx)$/.test(file)) return false;
  if (/\.d\.ts$/.test(file)) return false;

  const basename = file.split("/").pop();
  const entryFiles = ["main.tsx", "App.tsx", "vite-env.d.ts"];
  if (entryFiles.includes(basename)) return false;

  // setup / config 文件非逻辑代码，豁免
  if (file.includes("/test-utils/") && /\.setup\.ts$/.test(file)) return false;

  return true;
}

function findCorrespondingTest(sourceFile) {
  const dir = dirname(sourceFile);
  const base = sourceFile.replace(/\.tsx?$/, "");
  const candidates = [`${base}.test.ts`, `${base}.test.tsx`];
  for (const candidate of candidates) {
    if (existsSync(resolve(repoRoot, candidate))) {
      return candidate;
    }
  }
  // 组件目录 index.tsx 约定对应 index.test.tsx
  if (sourceFile.endsWith("/index.tsx")) {
    const indexTest = join(dir, "index.test.tsx");
    if (existsSync(resolve(repoRoot, indexTest))) {
      return indexTest;
    }
  }
  return null;
}

function main() {
  const { base } = parseArgs();

  const changedFiles = getChangedFiles(base);
  if (changedFiles.length === 0) {
    console.log("No changed files. Skipping TDD gate.");
    process.exit(0);
  }

  const logicFiles = changedFiles.filter(shouldCheck);
  const testFiles = changedFiles.filter((f) => /\.test\.(ts|tsx)$/.test(f));

  let failed = false;

  for (const file of logicFiles) {
    const test = findCorrespondingTest(file);
    if (!test) {
      logError(`Missing test for ${file}`);
      failed = true;
    }
  }

  if (failed) {
    console.error("\nAdd a co-located *.test.ts(x) for each changed logic file above.");
    console.error("Pure layout/style/config/type changes are exempt.");
    process.exit(1);
  }

  const messages = getCommitMessages(base);
  const isFixLike = isFixLikeBranch() || isFixLikeCommit(messages);

  if (isFixLike && logicFiles.length > 0 && testFiles.length === 0) {
    logError("Fix-like commit changes logic files but includes no test file changes.");
    console.error("Bug fixes must include a reproducing test (Red evidence).");
    process.exit(1);
  }

  if (logicFiles.length > 0) {
    console.log(
      `TDD gate passed: ${logicFiles.length} logic file(s) checked, ${testFiles.length} test file(s) present.`
    );
  } else {
    console.log("No logic files to check. Skipping TDD gate.");
  }
}

main();
