---
name: eslint-autofix
description: 修改 js/jsx 文件后处理 lint 问题的标准流程。agent 修改文件后，先用 `eslint --fix` 自动修复格式类问题，再用 `read_lints` 检查并手动修复逻辑类 error。禁止 agent 用 file_replace 手动调整格式。
---

# ESLint 自动修复

## 背景

agent 通过 `file_replace` / `create_file` 修改文件时，内容**直接写入磁盘**。但 agent 生成的代码不一定符合项目的 ESLint 规则，如果不修复，git commit 时可能报错。

## 核心原则

1. **格式类 lint 问题** → agent 通过终端 `eslint --fix` 自动修复，**禁止用 `file_replace` 手动调整**
2. **逻辑类 lint error**（未使用变量等）→ agent 用 `read_lints` 发现后手动修复
3. 两步都做完后，文件在磁盘上就是干净的，用户无需手动保存来触发 IDE 的 fixAll

## 执行流程

### 1. 修改代码后，跑 `eslint --fix` 自动修复格式问题

对修改过的文件，在终端执行（从项目根目录）：

```bash
cd web && npx eslint --fix <文件路径> 2>&1 | cat
```

多个文件可以一次性传入：

```bash
cd web && npx eslint --fix <文件1> <文件2> 2>&1 | cat
```

> **注意**：`eslint --fix` 会直接修改磁盘文件。IDE 中文件会变成 dirty 状态（磁盘内容 vs buffer 不一致），这是正常的，IDE 会提示 reload。

### 2. 检查 `eslint --fix` 的输出，处理逻辑类 error

- **无 error 输出** → 格式问题已全部自动修复，完成
- **仍有 error** → 这些是 `--fix` 无法自动修复的逻辑类问题，agent 用 `read_lints` 确认后手动修复
- **warning** → 默认不处理，不要为了消 warning 做结构性改动

### 3. 手动修复逻辑类 error 后，再跑一次 `eslint --fix`

因为手动修复可能引入新的格式问题，所以修复后再跑一次确认无 error。

## 本项目 ESLint 规则说明

本项目 ESLint 配置极简（`eslint:recommended` + `react-hooks` + `react-refresh`），无 TypeScript、无 Prettier、无 `import/order` 等格式规则。`eslint --fix` 能自动修复的内容有限，主要靠手动注意以下规则：

- `no-unused-vars` — 未使用的变量/导入
- `react-hooks/exhaustive-deps` — React Hooks 依赖
- `react-hooks/rules-of-hooks` — Hooks 使用规则

## 反模式（严禁）

### ❌ 把 lint 问题甩给用户

```
# 错误：让用户手动保存文件来触发 IDE 的 fixAll
"格式类 lint error 请在 IDE 中保存文件触发自动修复"
```

### ✅ 正确做法

```
# 1. 修改代码
file_replace: 修改 App.jsx

# 2. 跑 eslint --fix 自动修复
shell: cd web && npx eslint --fix src/App.jsx 2>&1 | cat

# 3. 如有逻辑类 error，手动修复
file_replace: 删除未使用的 import

# 4. 再跑一次确认干净
shell: cd web && npx eslint --fix src/App.jsx 2>&1 | cat
# → 无 error，完成
```

## 触发时机

当 agent 修改了 `.js` / `.jsx` 文件后，应按本 skill 的流程处理 lint 问题。这是修改代码后的**标准收尾步骤**，确保文件在磁盘上符合项目 ESLint 规则，用户无需额外操作即可 git commit。