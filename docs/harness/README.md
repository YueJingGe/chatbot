# 编码红线清单

AGENTS.md 写的是全局规则，docs/harness/ 写的是这个项目中踩过坑后总结的具体红线。

比如：

- code-style.md：具体的代码风格约定（import 顺序、命名规范、注释要求）
- bad-cases.md：记录之前犯过的错误，AI 不能再犯

每次 AI 犯了一个可复现的错误，就把它加到 bad-cases.md 里，标注 [PROPOSED]，人工审批后生效。这样 AI 的错误率会逐次下降。