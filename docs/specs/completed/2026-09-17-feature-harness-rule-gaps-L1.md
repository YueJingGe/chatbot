# Harness 规则缺口补全（L1 简化）

> 启动 2026-09-17 | 路由依据：影响 3 个文件 / 约 8 行

## 背景

对 AGENTS.md 做逐层规则覆盖核对（定位 → 导航 → 执行 → 修改 → 工具 → 红线），6 层中 5 层已覆盖，识别出 3 个缺口：

1. **安全红线缺位**：`server/.env` 存有真实 Key，现有防线只有机制层（`.gitignore` / `.agents/ignore`）与工具专属层（`CLAUDE.md`），全工具共享入口无行为约束。
2. **受管知识面边界未声明**：`ISSUES/`、`总结/`、`docs/**/completed/` 可能被当作现行规则引用。
3. **只读查询无行为约束**：Protocol 15 条全部为改动类动作触发，纯查询场景无预算约定。

另 karpathy SKILL 四节准则覆盖了"隐藏假设 / 越界改动"，缺"失败可见性"（不静默吞错误）。

## 设计决策

|决策点|选择|理由|
|-|-|-|
|段落顺序|不重排|AGENTS.md 为整文件注入、非按段读取，顺序不改变读取预算；重排属纯字面大 diff，收益无法 meta 验证，违反最小改动|
|分段归位标准|Guardrails=负面红线；Contributor Rules=结构·语义约定；Protocol=动作→路由|按性质三分；本次 3 条新增均按此标准自然落位、零歧义|
|安全条落点|并入 Guardrails，不独立成节|行数预算：55 → 58/60（条款见 harness-governance 设计约束）|
|karpathy 补充落点|Goal-Driven Execution 节|失败可见是可验证性的前提|
|行数条款弹性化|同步修订 harness-governance|硬上限语义禁止一切超出；改为"常态预算 + 超出需论证"后，既保留防膨胀意图又留出例外通道|

## 改动预览

|文件|位置|新增内容|
|-|-|-|
|`AGENTS.md`|Guardrails|不修改 `server/.env` 等环境文件；不把 secrets / API key / token 写入会提交的文件（含 `.env.example`）。|
|`AGENTS.md`|Contributor Rules|`ISSUES/`、`总结/`、`docs/**/completed/` 为历史记录，不作为现行规则依据。|
|`AGENTS.md`|Default Protocol|只读事实查询（≤3 文件 & ≤1 命令可答）：直接执行并回答，不建 Todo、不扩张阅读。|
|karpathy SKILL|Goal-Driven Execution|Failures must stay visible: never silently swallow errors (empty catch, ignored rejection, fake success).|
|`harness-governance`|设计约束|"60 行硬上限"改为"60 行为常态预算；确有必要时可适度超出，需给出必要性理由"，文件职责表口径同步|

## 验收

- [x] AGENTS.md 变更后行数 ≤60（实际 57）
- [x] `npm run check:all` 通过
- [x] `npm run sync:agents` 后各工具副本一致
- [x] meta 验证：真 prompt 场景下 3 条新规则可被触发（新会话生效）
- [x] harness-governance 新条款无歧义（能正确回答"超限如何处理"）

## 涉及

- `AGENTS.md`（3 处各 +1 行）
- `.agents/skills/karpathy-guidelines/SKILL.md`（+1 条）
- `.agents/context/harness-governance.md`（行数条款 2 处替换）

## 范围外

- 不重排段落、不改标题与既有条目
- 不改 `CLAUDE.md`（其 `.env` / lock 条款为 Claude 专属，保留）
- 不新增 ESLint autofix 类文字规则（逐条对比结论：机制层 lint-staged + check:all 已覆盖且更强）
