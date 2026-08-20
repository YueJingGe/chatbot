# AI 对话机器人

一个基于阿里云百炼 DashScope qwen-max 大模型的 AI 对话机器人项目。

采用 Monorepo、前后端分离架构，通过 npm workspaces 实现统一依赖管理，concurrently 并发启动前后端开发服务器。支持 SSE 流式传输、Function Calling 天气查询、实时日期时间感知等能力。

## 📋 目录

- [🚀 技术栈](#-技术栈)
- [📂 项目结构](#-项目结构)
- [🤖 Agent Skills](#-agent-skills)
- [📚 开发命令](#-开发命令)
- [🔧 快速开始](#-快速开始)
- [🛡️ Harness 系统](#️-harness-系统)

## 🚀 技术栈

- **语言**: TypeScript
- **框架**: React 19
- **构建工具**: Vite 7
- **样式**: CSS Modules + Less
- **后端**: Node.js + Express 5 + OpenAI SDK 6
- **LLM**: 阿里云百炼 DashScope OpenAI 兼容模式，qwen-max 模型
- **通信**: SSE（Server-Sent Events）流式传输，fetch + ReadableStream
- **工程化**: npm workspaces 单仓库 + concurrently 并发启动
- **工具调用**: OpenAI Function Calling（天气查询、实时时间）

## 📂 项目结构

```
chatbot/
├── .agents/                                  # AI 知识库（单一事实源 SSOT）
│   ├── context/                              # 项目上下文（机器友好）
│   │   ├── backend-context.md                # 后端架构、SSE、Function Calling
│   │   ├── frontend-context.md               # 前端架构、组件、状态管理
│   │   └── project-overview.md               # 项目概览、技术栈、目录结构
│   ├── ignore                                # 跨 AI agent ignore 规则
│   └── skills/                               # 任务 workflow（5 个 skill）
├── docs/                                     # harness 文档体系
│   ├── harness/                              # 编码红线（必须遵守）
│   ├── reference/                            # 详细写法参考
│   ├── specs/                                # 需求规格文档
│   └── exec-plans/                           # 执行计划
├── server/                                   # 后端：Express 服务器
│   ├── public/                               # 旧版前端（降级入口）
│   ├── server.js                             # 主服务器（OpenAI 客户端 + SSE 转发）
│   ├── weather.js                            # 天气工具实现（Open-Meteo API）
│   ├── readme.md                             # 后端说明
│   └── package.json
├── web/                                      # 前端：React 应用
│   ├── src/
│   │   ├── App.tsx                           # 主组件（状态中心 + SSE 消费）
│   │   ├── App.module.less
│   │   ├── main.tsx                          # 入口文件
│   │   ├── index.css                         # 全局重置样式
│   │   ├── vite-env.d.ts                     # Vite 类型声明
│   │   ├── assets/                           # 静态资源
│   │   └── components/                       # 叶子组件（React.memo）
│   ├── public/                               # 公共静态文件
│   ├── index.html
│   ├── vite.config.ts                        # Vite 配置 + dev proxy
│   └── package.json
├── scripts/                                  # 工具脚本
│   ├── sync-ignore.js                        # 同步 ignore → .cursorignore / .claudeignore
│   └── sync-skills.js                        # 同步 skills → 各 AI agent
├── .vscode/                                  # VS Code 配置（团队共享）
│   ├── extensions.json                       # 推荐扩展
│   └── settings.json                         # 编辑器设置
├── .husky/                                   # Git hooks
│   └── pre-commit                            # pre-commit hook（lint-staged）
├── ISSUES/                                   # 开发日志（按日期）
├── 总结/                                     # 面试/项目总结
├── image/                                    # 项目截图
├── AGENTS.md                                 # AI 规范入口
├── CLAUDE.md                                 # Claude Code 专用入口
├── README.md                                 # 项目说明（本文档）
├── llms.txt                                  # AI 工具项目概览
├── eslint.config.mjs                         # ESLint 配置
├── .prettierrc                               # Prettier 配置
├── .stylelintrc                              # Stylelint 配置
└── package.json                              # npm workspaces 根配置
```

## 🤖 Agent Skills

仓库内的 Agent Skill 统一放在 `.agents/skills/<skill-name>/` 目录里，并以 `SKILL.md` 作为唯一事实源。

当前已提供：

|Skill|说明|路径|
|-|-|-|
|`code-review`|架构/规范/决策 review|`.agents/skills/code-review/`|
|`git-commit`|Git 提交流程|`.agents/skills/git-commit/`|
|`karpathy-guidelines`|Karpathy 风格开发指南|`.agents/skills/karpathy-guidelines/`|
|`new-requirement`|新需求路由（L0/L1/L2）|`.agents/skills/new-requirement/`|
|`skill-creator`|创建和优化 Agent Skills|`.agents/skills/skill-creator/`|

## 📚 开发命令

### 基础命令

```bash
# 安装依赖（npm workspaces 自动安装 server/ 和 web/ 的子包依赖）
npm install

# 并发启动前后端（端口 5173 / 3000）
npm run dev

# 仅启动前端开发服务器（端口 5173）
npm run dev:web

# 仅启动后端服务（端口 3000）
npm run dev:server

# 构建前端生产包（输出到 web/dist/）
npm run build:web
```

### 代码质量

```bash
# Prettier 格式化
npm run format

# Prettier 检查
npm run format:check

# ESLint 自动修复
npm run lint

# ESLint 检查
npm run lint:check

# Stylelint 自动修复
npm run stylelint

# Stylelint 检查
npm run stylelint:check

# 全量检查（format + lint + stylelint + build）
npm run check:all
```

### AI Agent 同步

```bash
# 同步 ignore 规则 → .cursorignore / .claudeignore
npm run sync:ignore

# 同步 skills → .claude/skills/（多 agent 支持 --agent）
npm run sync:skills

# 同步所有（ignore + skills）
npm run sync:agents
```

### 命令速查

|命令|说明|
|-|-|
|`npm run dev`|并发启动前后端（concurrently）|
|`npm run dev:server`|仅启动后端服务（端口 3000）|
|`npm run dev:web`|仅启动前端开发服务器（端口 5173）|
|`npm run build:web`|构建前端生产包（输出到 `web/dist/`）|
|`npm run start:server`|单独启动后端服务|

## 🔧 快速开始

### 1. 环境配置

复制环境变量示例文件并填入你的 API Key：

```bash
cd server
cp .env.example .env
```

编辑 `server/.env`，填入阿里云百炼 DashScope API Key：

```
DASHSCOPE_API_KEY=your-api-key-here
DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
MODEL_NAME=qwen-max
PORT=3000
```

### 2. 安装依赖

在项目根目录执行：

```bash
npm install
```

### 3. 启动开发服务器

```bash
npm run dev
```

该命令通过 `concurrently` 并发启动：

- 后端服务：`http://localhost:3000`
- 前端开发服务器：`http://localhost:5173`（自动代理 `/api` 请求到后端）

打开浏览器访问 `http://localhost:5173` 即可开始对话。

## 🛡️ Harness 系统

本项目配备 Harness 文档系统，为 AI Agent 协作开发提供规范保障。

### 四类内容

|类型|目的|写法|文件|
|-|-|-|-|
|**AI 独占**|让 AI 不犯错|表格、精简、无废话|`AGENTS.md`、`.agents/context/`、`.agents/skills/`、`docs/harness/`|
|**人 AI 共读**|人维护、AI 也能查|详细、有例子|`README.md`、`llms.txt`、`docs/reference/`|
|**人维护**|记录需求、计划、决策|段落、可讨论|`docs/specs/`、`docs/exec-plans/`|
|**个人记录**|开发日志、面试、截图|自由格式|`ISSUES/`、`总结/`、`image/`|

**核心原则**：给 AI 读的文件每行都在消耗 token，能删就删；给人维护的文件不需要考虑 token。

---

**注意**: README 维护项目入口和仓库级约定。具体开发规范请优先查看 `AGENTS.md` 和 `docs/` 目录下的文档。
