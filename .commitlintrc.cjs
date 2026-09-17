const fs = require("fs");
const path = require("path");

const workspaces = ["web", "server"];
const workspaceNames = workspaces
  .map((name) => {
    try {
      return require(path.resolve(__dirname, name, "package.json")).name;
    } catch {
      return null;
    }
  })
  .filter(Boolean);

/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // type 白名单：在 SKILL 基础上补充 perf/test/ci
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "docs", "style", "refactor", "perf", "test", "chore", "ci"],
    ],

    // scope：语义化命名为主，同时兼容 workspace 包名
    "scope-enum": [2, "always", ["frontend", "backend", "docs", "root", ...workspaceNames]],
    "scope-empty": [0, "never"], // docs/style/refactor/chore 等允许省略 scope

    // 主题描述：必须存在、不要句号、允许中文
    "subject-empty": [2, "never"],
    "subject-full-stop": [2, "never", "."],
    "subject-case": [0], // 关闭大小写检查，避免中文被误判

    // 长度控制
    "header-max-length": [2, "always", 120],
    "body-max-line-length": [2, "always", 200],
  },
};
