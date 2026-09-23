# Spec: 提交机制与 Harness 自校验

> L2 完整规格 | 启动 2026-09-22 | 路由依据：影响 7 个文件、新增校验脚本约 150 行，触及提交门禁与 harness 治理区。

## 背景

提交治理的三条路径完备度不均，规范与机制之间存在重复和漂移风险：

- **人**（手动提交）：`czg` 与 commitizen 适配器已安装、`config.commitizen.path` 已配置，但没有统一的一键入口 script；且 czg 生成向导时不读取 `.commitlintrc.cjs` 的 `type-enum`（使用内置类型列表），出现"向导可选 build/revert、提交却被 commit-msg 拒绝"的选项与校验不同步缝隙。
- **机器**：commitlint、lint-staged、pre-push 门禁齐备，但缺少 harness 自身的一致性校验——`.agents/skills` 改动后忘记 `sync:agents` 无检测、skill frontmatter 缺失无检测、`AGENTS.md` 引用失联无检测。
- **规范**：`git-commit` skill 内维护了一份 type/scope 格式表，与 `.commitlintrc.cjs` 重复；`.commitlintrc.cjs` 注释中还残留"在 SKILL 基础上"的悬空引用。

本次目标：三条路径各自"执行主体内置交互与校验，规范只负责指路"——人走 czg 双入口、机器走 check-harness 自校验、规范删除重复表格改为单一来源引用。

## 设计决策

|决策点|选择|理由|
|-|-|-|
|commit 入口形态|双入口：`commit`（`git add -A` + lint-staged + czg，含 skipLintStaged 技巧）与 `cm`（先手动 add，再 czg）|全流程版省事、保守版贴合本仓库"显式路径 add"准则；两种习惯都支持|
|skipLintStaged 清理|`commit` 末尾用 `;` 串联无条件执行 `git config --unset lint.skipLintStaged`|czg 中途取消时不留残留标志，避免下次提交意外跳过 lint-staged|
|czg 与校验不同步|新增 `.czrc`，types 限定为与 `type-enum` 一致的 9 类（含中文名称）|向导选项与 commit-msg 硬校验保持同一来源；scope 选项已自动读取 `scope-enum`，无需配置|
|check-harness 检查范围（v1）|① skill frontmatter：`---` 包裹、`name`/`description` 非空、`name` 与目录名一致；② `.agents/skills` ↔ `.claude/skills` 同步一致性（缺副本/内容不一致/孤儿目录）；③ `AGENTS.md` 反引号引用可达性（白名单前缀、排除通配符与命令）|最小可用集，覆盖实际出现过的漂移类型；误报控制优先，docs/skills 全文扫描留下期|
|check-harness 接入方式|独立 `check:harness` 命令 + 并入 `check:all` 首位|纯静态读取成本 <1s；并入后本地与 CI 自动覆盖，杜绝"忘跑 sync"|
|lint-staged 缓存|eslint / stylelint 命令加 `--cache`（默认缓存位置，不加 location 管理）|staged 场景收益有限，做极简版避免配置膨胀；prettier 不启用|
|skill 瘦身方式|删除 type/scope 表格；保留格式行与示例；新增一行"type/scope 以 `.commitlintrc.cjs` 为准"；同步修正 `.commitlintrc.cjs` 悬空注释|格式规则单一来源，AI 从 commitlint 配置读取白名单|
|分支|在当前 `feature/0920-message-copy` 继续|本任务与分支上已含的 skill 优化同属提交流程主题；分支未推送、可整体收尾|

## 验收标准

- [x] `scripts/check-harness.mjs` 新增，`npm run check:harness` 通过且对当前仓库零误报；构造三类失败场景（skill 未同步 / frontmatter 缺失 / AGENTS.md 引用失联）均能拦截并输出修复提示
- [x] `npm run check:all` 输出包含 harness 检查项且全绿（本地与 CI 路径一致）
- [x] `.czrc` 存在，`npx czg` 向导的 type 选项恰为 9 类、scope 选项来自 `scope-enum`（人工验证）
- [x] `npm run commit`、`npm run cm` 两个入口可用；中断 `npx czg` 后 `git config --get lint.skipLintStaged` 无残留
- [x] `git-commit/SKILL.md` 不再包含 type/scope 表格，message 规则引用 `.commitlintrc.cjs`；`npm run sync:agents` 后 `.claude/skills/git-commit` 与源一致
- [x] `.commitlintrc.cjs` 中"在 SKILL 基础上"的悬空引用已修正
- [x] `llms.txt` 命令描述与 `check:all` 实际组成一致（含 test 与 harness）
- [x] meta-验证：新会话用真 prompt（提交类指令）确认 skill 仍能正确指路生成 message（删表未破坏流程）
- [x] `npm run sync:agents`、`npm run check:all` 通过；`docs/ledger/CORE-LEDGER.md` 已补本次条目

## 涉及模块

- 提交工具链：`package.json`（双 script、lint-staged 缓存、check:all）、`.husky/pre-commit`（skipLintStaged 判断）、`.czrc`（新增）、`.commitlintrc.cjs`（注释修正）
- Harness：`.agents/skills/git-commit/SKILL.md`（删表指路）、`scripts/check-harness.mjs`（新增）、`llms.txt`
- 需求记录：本 spec 与对应 exec-plan；`docs/ledger/CORE-LEDGER.md` 条目

## 范围外

- 不做 `docs/harness` 规则机器化（留下一期）
- 不改 AI 提交/推送交互条款（`git-commit` / `git-branch` 的行为准则保持现状）
- 不引入新依赖、不动 CI 配置、分支保护 hook、push-gate
- 所有产物（脚本注释、配置、文档）不出现外部项目的引用或借鉴字样
