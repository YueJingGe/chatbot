import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function runHook(hook, tddStatus, ledgerStatus = 0, useSetE = true) {
  // 替换外部命令，确保测试不执行真实 Git 操作或 lint-staged 修改。
  // useSetE 默认 true：镜像 husky 包装器 .husky/_/h 的 `sh -e "$s"` 调用方式。
  const commands = `
git() {
  case "$1" in
    rev-parse) echo feature/review-tests ;;
    config) return 1 ;;
    *) return 0 ;;
  esac
}
node() {
  case "$1" in
    scripts/check-frontend-tdd.mjs) echo tdd-checked; return "$GATE_TEST_TDD_STATUS" ;;
    scripts/push-gate.mjs) echo ledger-checked; return "$GATE_TEST_LEDGER_STATUS" ;;
  esac
}
npx() { echo lint-staged-ran; return 0; }
`;
  const script = commands + readFileSync(path.join(root, hook), "utf8");
  const shellArgs = useSetE ? ["-e", "-c", script] : ["-c", script];
  return spawnSync("/bin/sh", shellArgs, {
    cwd: root,
    input: "",
    encoding: "utf8",
    env: {
      PATH: process.env.PATH,
      GATE_TEST_TDD_STATUS: String(tddStatus),
      GATE_TEST_LEDGER_STATUS: String(ledgerStatus),
    },
  });
}

test("pre-commit 的 TDD 门禁失败时停止提交", () => {
  const result = runHook(".husky/pre-commit", 1);

  assert.equal(result.status, 1);
  assert.doesNotMatch(result.stdout, /lint-staged-ran/);
});

test("pre-push 的 TDD 门禁失败时停止推送", () => {
  const result = runHook(".husky/pre-push", 1);

  assert.equal(result.status, 1);
  assert.doesNotMatch(result.stdout, /ledger-checked/);
});

test("pre-push 的严格 ledger 门禁失败时停止推送", () => {
  const result = runHook(".husky/pre-push", 0, 1);

  assert.equal(result.status, 1);
  assert.match(result.stdout, /ledger-checked/);
});

test("检查成功时 commit 和 push hooks 正常放行", () => {
  assert.equal(runHook(".husky/pre-commit", 0).status, 0);
  assert.equal(runHook(".husky/pre-push", 0).status, 0);
});

test("绕过 husky 直接以 sh 调用 hook 时仍靠显式退出码拦截", () => {
  const result = runHook(".husky/pre-commit", 1, 0, false);

  assert.equal(result.status, 1);
  assert.doesNotMatch(result.stdout, /lint-staged-ran/);
});

function runTddGate(status) {
  const directory = mkdtempSync(path.join(tmpdir(), "chatbot-gate-test-"));
  try {
    writeFileSync(
      path.join(directory, "git"),
      `#!/bin/sh
case "$1" in
  status) printf '%s\\n' "$GATE_TEST_STATUS" ;;
  rev-parse) echo feature/review-tests ;;
  *) exit 0 ;;
esac
`,
      { mode: 0o755 }
    );
    return spawnSync(process.execPath, [path.join(root, "scripts/check-frontend-tdd.mjs")], {
      cwd: root,
      encoding: "utf8",
      env: { PATH: directory, GATE_TEST_STATUS: status },
    });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

test("TDD 门禁识别首条未暂存逻辑变更并要求测试", () => {
  const result = runTddGate(" M web/src/utils/uncovered.ts");

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Missing test for web\/src\/utils\/uncovered.ts/);
});

test("TDD 门禁识别未跟踪与已暂存的逻辑文件", () => {
  for (const status of ["??", "A "]) {
    const result = runTddGate(`${status} web/src/utils/uncovered.ts`);
    assert.equal(result.status, 1);
  }
});

test("已有同目录测试的未暂存逻辑变更正常通过", () => {
  const result = runTddGate(" M web/src/utils/scroll.ts");

  assert.equal(result.status, 0);
  assert.match(result.stdout, /TDD gate passed: 1 logic file/);
});

test("已删除的逻辑文件不再被要求补测试", () => {
  for (const status of [" D", "D ", "AD"]) {
    const result = runTddGate(`${status} web/src/utils/uncovered.ts`);
    assert.equal(result.status, 0, `status "${status}" should pass`);
    assert.doesNotMatch(result.stderr, /Missing test/);
  }
});
