# Core Change Ledger

> 记录核心模块变更的决策理由。当改动涉及 `web/src/hooks/`、`web/src/types/`、`server/`、`.agents/**` 或 `docs/harness/**` 时，请在本文件追加条目。
>
> 填写原则：诚实、简洁、面向 review。不需要每个字段都写，但 `Why the change is unavoidable` 必须回答。

## 条目模板

```markdown
### YYYY-MM-DD | scope | 简短描述

- Added: 新增了什么
- Reused: 复用了什么现有逻辑/组件/类型
- Removed: 删除了什么
- Consolidated: 合并/折叠了什么重复代码
- Why the change is unavoidable: 为什么必须做这个改动，不做的代价是什么
- Smaller-diff alternative considered: 是否考虑过更小的改动方案，为什么被否决
```

## 变更记录
