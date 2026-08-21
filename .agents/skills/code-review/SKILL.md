---
name: code-review
description: 代码审查工作流（架构/规范/决策 review）。用户说"review"、"审查"、"检查代码"时在 IDE 内手动触发。（PR 的自动审查由 CodeRabbit 承担，不属本 skill；工具检查由 husky pre-commit 自动跑。）
---

# Code Review 工作流

## 触发

纯**按需手动**：用户在 IDE 里说 "review"、"审查"、"检查代码" → 按本 skill 审查，可直接修。

> PR（develop/release/main）的自动审查由 **CodeRabbit** 承担（配置见 `.coderabbit.yaml`），与本 skill 无关。

## 原则

- 有依据 + 明确方案 → 直接修
- 有依据 + 不明确方案 → 问用户
- 无依据发现 → 问用户（修不修 + 要不要加依据）

## 步骤

1. 按改动位置对应的规范进行检查

   - `web/src/**/*.{ts,tsx}`  
     检查：组件位置 / 状态管理 / 职责单一 / memo / useCallback / key 稳定唯一 / 禁数组索引 / 禁 dangerouslySetInnerHTML / 禁前端 API key  
     依据：`docs/harness/frontend-rules.md` + `.agents/context/project-overview.md`

   - `web/src/**/*.less`  
     检查：CSS 变量 / BEM / 禁 CSS-in-JS  
     依据：`docs/harness/frontend-rules.md`

   - `server/**/*.{js,json}`  
     检查：AbortController / SSE 事件格式 / 错误处理 / 响应头 / process.env / 禁硬编码 API key  
     依据：`docs/harness/backend-rules.md` + `.agents/context/backend-context.md`

   - 任何文件  
     检查：命名（PascalCase / kebab-case / camelCase / UPPER_SNAKE_CASE）  
     依据：`docs/reference/naming.md`

2. 输出修改内容
