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

## 执行流程

### Step 1：运行扫描脚本

执行 `node <skill_dir>/scan.js`，获取项目当前的结构化信息。

输出内容包括：

- 包管理器、技术栈、项目类型（单体 / Monorepo）
- 已有的所有 Agent 相关文件及其内容摘要（AGENTS.md、.cursorrules、docs/、skills/、context/）
- 可用的 npm scripts、src 目录结构

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
│ ├── index.md # 约束导航页，标注每个约束文件的加载时机
│ ├── architecture.md # 架构约束（改构建/路由/状态管理时读）
│ ├── code-style.md # 编码红线（写新代码时读）
│ └── security.md # 安全规则（改鉴权/数据处理时读）
├── knowledge/
│ ├── index.md # 知识库导航页
│ ├── tech-stack.md # 技术栈详细说明
│ ├── directory-structure.md # 目录职责说明
│ └── data-flow.md # 核心数据流转链路
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

| 文件            | 加载时机                         | 核心内容                           |
| --------------- | -------------------------------- | ---------------------------------- |
| architecture.md | 改构建/路由/状态管理/Monorepo 时 | workspace 边界、构建约束、通信协议 |
| code-style.md   | 写新代码时                       | 命名/格式/导出/类型红线            |
| security.md     | 改鉴权/数据处理时                | 密钥管理、XSS 防护、注入防护       |

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

| 场景       | 读取文件       |
| ---------- | -------------- |
| [具体场景] | [对应文件路径] |

优先级声明：

- 本文件中的规则 > docs/ 下的文档 > Agent 默认行为
- 项目已有的 skills/、context/ 目录内容为团队自定义资源，优先级高于本体系生成的文档

# Agent 工作规则

1. 先读后做：任务开始前必须读本文件，修改代码前读取对应的 harness 约束
2. 不确定就问：禁止捏造接口字段、环境变量名、权限码、业务规则
3. 改完必验：代码修改后必须依次执行 lint → typecheck → test → build
4. 新需求先建 spec：在 docs/specs/active/ 创建 spec 文档对齐验收标准，再开始编码
5. 犯错即补规则：Agent 犯了某类错误后，修复并把对应约束补充到本文件或 docs/harness/ 中

# 易错提示

1. 零覆盖是最高优先级红线：检测到项目已有 AGENTS.md，绝不能直接重新生成覆盖；检测到已有 skills/ 或 context/ 目录，绝不往里面写入新文件
2. 入口文件必须控制行数：AGENTS.md 控制在 200 行以内，合并已有文件后超长的，把低频内容拆分到 docs/harness/
3. 只写 AI 推断不出来的内容：不在文档中列出所有依赖包版本或完整目录树
4. doc_generate vs doc_merge 不要搞混：只要扫描结果中有任何 Agent 文件存在，就必须走增量合并
5. 冲突解决默认已有优先：项目特有规则永远优先于通用规则
6. 软链接创建前必须检查目标文件：已存在且内容不同时跳过并提示用户；Windows 环境下降级为文件复制
7. docs/ 下已有子目录要保留：项目已有 docs/rules/ 等目录时保留并在 index.md 中说明，不删除不替换
8. Monorepo 要区分 workspace：根目录文档覆盖全局规则，每个 workspace 的特殊规则在对应目录下生成补充文档
```
