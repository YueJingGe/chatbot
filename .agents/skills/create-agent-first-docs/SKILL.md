---
name: create-agent-first-docs
description: >
  为任意前端项目（React/Vue/Svelte/Angular/原生 JS，单体/Monorepo/微前端均可）
  初始化或增强 Agent-First 文档治理体系。扫描项目结构、技术栈和已有 Agent 文件，
  生成/合并分层文档（入口层、约束层、知识库层、协作层），并适配多种 AI 编码工具。
  零覆盖已有文件，纯增量合并，兼容 AGENTS.md、.cursorrules、docs/、skills/、context/ 等已有资源。
---

# Agent-First 前端文档治理初始化

## 适用场景

- 任意前端项目（React / Vue / Svelte / Angular / 原生 JS 均可）
- 单体项目、Monorepo、微前端子应用均可适配
- 新项目直接初始化，老项目增量增强，**不覆盖任何已有配置**

## 核心原则

1. **零覆盖**：已有的 `AGENTS.md`、`.cursorrules`、`docs/`、`skills/`、`context/` 内容全部保留，只做增量合并
2. **按需生成**：只生成项目缺失的文档模块，已有的模块跳过或增强
3. **零依赖**：扫描脚本仅使用 Node.js 原生模块（`fs`、`path`），无需额外安装任何依赖
4. **冲突优先已有**：如果通用规则和项目已有规则冲突，以项目已有规则为准
5. **只写 AI 推断不出来的内容**：技术栈、目录结构等 Agent 可自行扫描获取的信息不写，只写隐形的团队规则、架构红线、业务硬约束
6. **约束是活的**：文档体系必须支持随项目演进而更新，但更新必须遵循分级权限

## 约束分级体系

### 三个等级

| 等级        | 含义                     | 变更频率          | 修改权限                                   | 典型内容                     |
| ----------- | ------------------------ | ----------------- | ------------------------------------------ | ---------------------------- |
| `iron`      | 铁律，违反即故障         | 极低（季度/年度） | 仅人工 PR + Review                         | 架构边界、安全红线、密钥管理 |
| `living`    | 活约束，当前阶段最佳实践 | 中等（周/月）     | AI 可提议（标注 [PROPOSED]），人工审批生效 | 编码规范、组件模式、接口约定 |
| `guideline` | 参考指南，项目现状快照   | 高（随代码提交）  | AI 可自由更新                              | 技术栈详情、目录说明、数据流 |

### 默认分级策略

生成文档时，按以下策略自动分配级别：

| 文件                           | 默认级别    | 理由                                         |
| ------------------------------ | ----------- | -------------------------------------------- |
| `docs/harness/architecture.md` | `iron`      | 架构边界，变更频率极低，违反即故障           |
| `docs/harness/security.md`     | `iron`      | 安全红线，违反即故障                         |
| `docs/harness/code-style.md`   | `living`    | 编码规范会随团队习惯演进，但不宜让 AI 随意改 |
| `docs/knowledge/*` 所有文件    | `guideline` | 项目现状快照，应随代码变更同步更新           |

用户可在生成后手动调整任何文件的级别。

### Frontmatter 模板

每个 harness 文件头部必须包含以下元数据：

```yaml
---
level: iron | living | guideline
owner: "@YueJingGe"
last_reviewed: 2026-08-01
review_cycle: quarterly | monthly | per-pr
auto_enforced: false
---
```

| 字段            | 说明                                                           |
| --------------- | -------------------------------------------------------------- |
| `level`         | 约束级别：iron / living / guideline                            |
| `owner`         | 变更审批人或团队，iron 级必须指定具体人员                      |
| `last_reviewed` | 上次审查日期，ISO 格式                                         |
| `review_cycle`  | 审查周期：quarterly（铁律）/ monthly（活约束）/ per-pr（指南） |
| `auto_enforced` | 是否已有 CI/linter 自动化检查覆盖该约束                        |

## AI 修改权限矩阵

| 文档类型                               | AI 可读 | AI 可写 | 修改条件                                  |
| -------------------------------------- | ------- | ------- | ----------------------------------------- |
| `AGENTS.md` 铁律 section               | ✅      | ❌      | 永远不可改                                |
| `AGENTS.md` 活约束 section             | ✅      | ⚠️ 建议 | 可提议新增，标注 `[PROPOSED]`，等人类审批 |
| `AGENTS.md` 项目概述/命令              | ✅      | ⚠️ 建议 | 技术栈变更时可建议更新                    |
| `docs/harness/*` (iron)                | ✅      | ❌      | 永远不可改，发现不合理时向人类报告        |
| `docs/harness/*` (living)              | ✅      | ⚠️ 建议 | 可提议新增条目，标注 `[PROPOSED]`         |
| `docs/knowledge/*`                     | ✅      | ✅ 鼓励 | 修改代码后应主动同步更新对应知识文档      |
| `docs/specs/active/*`                  | ✅      | ✅ 允许 | 新需求时创建，完成时移到 completed/       |
| `docs/exec-plans/*`                    | ✅      | ✅ 允许 | 执行任务时创建，完成时移到 completed/     |
| `docs/exec-plans/tech-debt-tracker.md` | ✅      | ✅ 允许 | 发现技术债时记录                          |

## Bad Case 驱动迭代机制

### 核心流程

```
AI 犯了错误（如用了错误的命名风格、在错误的层级引入了依赖）
↓
人类思考：「如果 harness 里多写一条 XX 规则，AI 是不是就不会犯这个错」
↓
判断改哪里：
├── 全局性的架构约定 → AGENTS.md 核心硬约束 section
├── 某个模块的具体规范 → docs/harness/ 对应文件
├── 项目现状变化 → docs/knowledge/ 对应文件
└── 可自动化的检查 → scripts/ 下的 lint 脚本
↓
提交 PR，标注 [HARNESS UPDATE]
```

### [PROPOSED] 标签规范

AI 在 living 级文件中提议新增约束时，必须遵循以下格式：

```markdown
<!-- [PROPOSED] 2026-08-12 by AI Agent -->

- 所有新增的 React 组件必须使用 `React.memo` 包裹，避免不必要的重渲染
<!-- [/PROPOSED] -->
```

人类审批后，去掉 <!-- [PROPOSED] --> 和 <!-- [/PROPOSED] --> 标签，约束正式生效。

## 从软约束到硬检查的晋升路径

当同一类 Bad Case 反复出现（≥3 次），说明文档约束不够强，应升级为自动化检查：

```
Bad Case 首次出现
↓
写入 harness（living 级，软约束）
↓
同一类错误反复出现（≥3 次）
↓
编写自动化检查脚本（scripts/lint-xxx.mjs）
↓
集成到 CI Pipeline 或 Pre-commit Hook
↓
更新 harness 文件 frontmatter：auto_enforced: true
↓
从 harness 中删除该条目（已被自动化覆盖）

```

### 晋升判断标准

| 信号                      | 动作                              |
| ------------------------- | --------------------------------- |
| 同一类错误出现 1 次       | 写入 living 级 harness            |
| 同一类错误出现 2 次       | 补充 harness 条目描述，使其更精确 |
| 同一类错误出现 ≥3 次      | 编写自动化检查脚本，走晋升流程    |
| 自动化脚本稳定运行 1 个月 | 从 harness 中删除该条目           |

## 执行流程

### Step 1：运行扫描脚本

执行 `node <skill_dir>/scan.js`，获取项目当前的结构化信息。

输出内容包括：

- 包管理器、技术栈、项目类型（单体 / Monorepo）
- 已有的所有 Agent 相关文件及其内容摘要（AGENTS.md、.cursorrules、docs/、skills/、context/）
- 可用的 npm scripts、src 目录结构
- 已有 harness 文件的约束级别分布和 frontmatter 状态

### Step 2：根据扫描结果判断生成策略

| 条件                          | 策略                     |
| ----------------------------- | ------------------------ |
| 项目无任何 Agent 相关文件     | 全新生成（doc_generate） |
| 项目已有部分或全部 Agent 文件 | 增量合并（doc_merge）    |

### Step 3：处理已有 Agent 文件（增量合并模式）

#### 已有 AGENTS.md / CLAUDE.md / GEMINI.md

- 读取现有内容，**保留所有项目特有规则**（业务约定、团队规范等）
- 补充缺失的标准 section：项目概述、常用命令、核心硬约束、文档导航、Agent 工作规则
- 已有内容中已覆盖的 section **不重复添加**
- 通用约束合并到核心约束 section，不重复添加已有规则
- 确保最终文件不超过 200 行，过长的内容拆分到 `docs/harness/` 对应文件中

#### 已有 .cursorrules / .cursor/rules/\*.mdc

- **保留所有原有规则，不做任何修改**
- 把 AGENTS.md 中的核心硬约束同步到 .cursorrules 中，格式保持 Cursor 的 rule 格式
- 冲突规则以项目已有内容为准

#### 已有 .github/copilot-instructions.md

- 保留原有内容，同步核心硬约束到文件中

#### 已有 docs/ 目录

- **不修改 docs/ 下任何已有文件**
- 在 docs/ 下新增 `harness/`、`knowledge/`、`specs/`、`exec-plans/` 四个目录（如果不存在）
- 如果已有类似功能的目录（如 `docs/rules/`、`docs/guides/`），保留原有目录，在 `docs/harness/index.md` 中添加说明指向原有目录

#### 已有 skills/、context/ 目录

- **完全不修改**这两个目录下的任何内容
- 在 AGENTS.md 的文档导航中添加声明："项目已有的 skills/、context/ 目录内容为团队自定义资源，优先级高于本体系生成的文档"

### Step 4：生成缺失的文档结构

如果对应目录不存在，生成以下标准结构：

```

docs/
├── harness/
│ ├── index.md # 约束导航页，标注每个约束文件的加载时机和级别
│ ├── architecture.md # 架构约束（改构建/路由/状态管理时读）（level: iron）
│ ├── code-style.md # 编码红线（写新代码时读）（level: living）
│ └── security.md # 安全规则（改鉴权/数据处理时读）（level: iron）
├── knowledge/
│ ├── index.md # 知识库导航页
│ ├── tech-stack.md # 技术栈详细说明（level: guideline）
│ ├── directory-structure.md # 目录职责说明（level: guideline）
│ └── data-flow.md # 核心数据流转链路（level: guideline）
├── specs/
│ ├── active/ # 进行中的需求规格
│ │ └── .gitkeep
│ └── completed/ # 已完成的需求规格
│ └── .gitkeep
└── exec-plans/
├── active/ # 当前执行的任务计划
│ └── .gitkeep
├── completed/ # 已完成的任务计划
│ └── .gitkeep
└── tech-debt-tracker.md # 技术债记录

```

各文件内容要求：

#### docs/harness/index.md

导航页，列出所有约束文件及对应的加载时机：

| 文件            | 级别   | 加载时机                         | 核心内容                           |
| --------------- | ------ | -------------------------------- | ---------------------------------- |
| architecture.md | iron   | 改构建/路由/状态管理/Monorepo 时 | workspace 边界、构建约束、通信协议 |
| code-style.md   | living | 写新代码时                       | 命名/格式/导出/类型红线            |
| security.md     | iron   | 改鉴权/数据处理时                | 密钥管理、XSS 防护、注入防护       |

#### docs/harness/architecture.md

根据项目实际情况填写：

- Monorepo 场景：workspace 边界、跨 workspace 通信规则、禁止直接 import
- 单体场景：前后端职责划分、路由规范、状态管理选型要求
- 构建约束：构建工具锁定、端口约定

#### docs/harness/security.md

- 密钥管理红线（API Key 只允许出现在 .env 中）
- XSS 防护要求
- 用户输入清洗规则
- 依赖安全要求

#### docs/harness/code-style.md

- 格式红线（与项目已有 .cursorrules 中的规则保持一致）
- 类型约束（禁止 any）
- 错误处理规范
- 导出规范

#### docs/knowledge/tech-stack.md

- 所有依赖的版本、用途、已知限制
- LLM/第三方服务的接口模式、模型、兼容性问题

#### docs/knowledge/directory-structure.md

- 每个目录的职责说明
- 禁止随意新增顶级目录

#### docs/knowledge/data-flow.md

- 核心数据流转链路（如 SSE/GraphQL/REST 的完整链路）
- 关键节点说明和注意事项

#### docs/exec-plans/tech-debt-tracker.md

技术债记录模板，格式：

| 日期       | 描述     | 位置     | 优先级   | 状态          |
| ---------- | -------- | -------- | -------- | ------------- |
| YYYY-MM-DD | 简要描述 | 文件路径 | P0/P1/P2 | open/resolved |

### Step 5：多工具适配

| AI 工具        | 配置文件路径                               | 适配方式                                                      |
| -------------- | ------------------------------------------ | ------------------------------------------------------------- |
| Claude Code    | `CLAUDE.md`                                | 软链接指向 `AGENTS.md`（已存在且内容不同时跳过）              |
| Gemini         | `GEMINI.md`                                | 软链接指向 `AGENTS.md`（已存在且内容不同时跳过）              |
| Cursor         | `.cursorrules` 或 `.cursor/rules/core.mdc` | 已有则保留不动，仅同步核心硬约束；没有则从 AGENTS.md 提取生成 |
| GitHub Copilot | `.github/copilot-instructions.md`          | 从 AGENTS.md 提取精简版核心约束生成（已有则增量合并）         |

### Step 6：校验产物

- 检查所有文档内部链接是否有效
- 确保 `AGENTS.md` 不超过 200 行
- 确保没有覆盖任何已有文件内容
- 输出完成报告，列出新增/修改/跳过的文件清单
- 确保所有 harness 文件都有正确的 frontmatter（level/owner/last_reviewed/review_cycle/auto_enforced）

## 入口文件（AGENTS.md）标准结构

入口文件结构固定为 5 个 section，控制在 200 行以内：

```markdown
# 项目概述

- 架构：[单体/Monorepo/微前端]
- 技术栈：[框架 + 构建工具 + 状态管理 + 样式方案]
- 包管理：[npm/pnpm/yarn]
- 核心特点：[只写 AI 推断不出来的信息]

# 常用命令

- 安装依赖：`xxx install`
- 本地开发：`npm run dev`
- 运行测试：`npm run test`
- 类型检查：`npm run typecheck`
- 代码校验：`npm run lint`
- 构建产物：`npm run build`

# 核心硬约束（TOP5）

1. [最重要的 5 条红线规则，从 harness/ 中提取]

# 文档导航

| 场景       | 级别                  | 读取文件       |
| ---------- | --------------------- | -------------- |
| [具体场景] | iron/living/guideline | [对应文件路径] |

优先级声明：

- 本文件中的规则 > docs/ 下的文档 > Agent 默认行为
- 项目已有的 skills/、context/ 目录内容为团队自定义资源，优先级高于本体系生成的文档

# 文档修改权限

- 铁律（level: iron）：禁止修改，发现铁律不合理时向人类报告
- 活约束（level: living）：可提议新增，必须标注 [PROPOSED] 标签等待审批
- 参考指南（level: guideline）：修改代码后应主动同步更新
- specs/ 和 exec-plans/：可自由创建和管理

# Agent 工作规则

1. 先读后做：任务开始前必须读本文件，修改代码前读取对应的 harness 约束
2. 不确定就问：禁止捏造接口字段、环境变量名、权限码、业务规则
3. 改完必验：代码修改后必须依次执行 lint → typecheck → test → build
4. 新需求先建 spec：在 docs/specs/active/ 创建 spec 文档对齐验收标准，再开始编码
5. 犯错即补规则：Agent 犯了某类错误后，修复并把对应约束补充到本文件或 docs/harness/ 中
6. 文档同步义务：
   - 新增组件/Hook 后 → 更新 docs/knowledge/component-patterns.md
   - 新增/变更 API 接口后 → 更新 docs/knowledge/api-conventions.md
   - 升级依赖版本后 → 更新 docs/knowledge/tech-stack.md
   - 发现技术债 → 记录到 docs/exec-plans/tech-debt-tracker.md

# 易错提示

1. 零覆盖是最高优先级红线：检测到项目已有 AGENTS.md，绝不能直接重新生成覆盖；检测到已有 skills/ 或 context/ 目录，绝不往里面写入新文件
2. 入口文件必须控制行数：AGENTS.md 控制在 200 行以内，合并已有文件后超长的，把低频内容拆分到 docs/harness/
3. 只写 AI 推断不出来的内容：不在文档中列出所有依赖包版本或完整目录树
4. doc_generate vs doc_merge 不要搞混：只要扫描结果中有任何 Agent 文件存在，就必须走增量合并
5. 冲突解决默认已有优先：项目特有规则永远优先于通用规则
6. 软链接创建前必须检查目标文件：已存在且内容不同时跳过并提示用户；Windows 环境下降级为文件复制
7. docs/ 下已有子目录要保留：项目已有 docs/rules/ 等目录时保留并在 index.md 中说明，不删除不替换
8. Monorepo 要区分 workspace：根目录文档覆盖全局规则，每个 workspace 的特殊规则在对应目录下生成补充文档
9. 约束级别不可由 AI 自行升降：AI 不能把 iron 级改为 living，也不能把 living 级改为 guideline，级别变更只能由人工操作
10. [PROPOSED] 标签必须成对出现：`<!-- [PROPOSED] -->` 和 `<!-- [/PROPOSED] -->` 必须成对，便于脚本扫描和统计
11. harness 文件条目数量控制：每个 harness 文件的约束条目控制在 10-15 条以内，超出时考虑拆分或升级为自动化检查脚本
12. AGENTS.md 核心硬约束严格 TOP 5：只放最重要的 5 条，其余放到 docs/harness/ 对应文件中
```
