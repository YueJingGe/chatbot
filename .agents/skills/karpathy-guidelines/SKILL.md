---
name: karpathy-guidelines
description: 通用 AI 编程行为准则，用于减少 LLM 在写代码/改代码/review 代码时常见的过度设计、越界改动、隐藏假设等问题。当任务涉及"写新代码""修 bug""重构""review diff""给实现方案"等编码动作时使用，帮助在动手前显式化假设、保持最小改动、定义可验证成功标准。源自 Andrej Karpathy 对 LLM 编码陷阱的总结。
---

# Karpathy Behavioral Guidelines

通用 LLM 编程行为准则，降低常见的编码失误。与项目专属规范结合使用。

**Tradeoff**：这套准则偏向"稳"而非"快"。对显而易见的小任务，自行判断是否需要完全走一遍。

## 何时使用

当你在本项目内执行以下任一动作时，先把这份准则加载到思考中：

- 写新功能、新组件、新脚本
- 修 bug、改现有逻辑
- 重构、抽象、整理代码
- 评审 diff / 当前工作区改动（配合 `harsh-current-branch-review`）
- 给实现方案、技术选型建议

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if**: fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

## 来源

改编自 [forrestchang/andrej-karpathy-skills](https://github.com/forrestchang/andrej-karpathy-skills)，基于 Andrej Karpathy 对 LLM 编码陷阱的观察整理。原始文件为 Cursor rule 格式（`alwaysApply: true`），本仓库改为按需触发的 skill 形式使用。
