# 参考：各规模项目的完整示例

本文档收录不同规模项目的 harness 设计示例，供 `repo-harness-design` Skill 参考。

---

## 小型项目示例（< 50 文件）

### 项目特征

- 单体项目，1 个端
- 代码文件 < 50 个
- 个人或小团队（1-3 人）

### 推荐结构

```
chatbot/
├── AGENTS.md
├── .cursorrules
├── README.md
├── package.json
├── server/
│   ├── server.js
│   └── .env
└── web/
    ├── src/
    │   ├── App.tsx
    │   └── components/
    └── package.json
```

### AGENTS.md（全部放一个文件）

小型项目不需要分层，AGENTS.md 承载所有内容：

```markdown
# AGENTS.md

## Project
AI 对话机器人，Express + React + SSE 流式传输。

## 技术栈
- 后端：Node.js + Express 5 + OpenAI SDK
- 前端：React 19 + Vite 7 + TypeScript

## 目录结构
{项目目录树}

## 命令
| 命令 | 说明 |
|---|---|
| `npm run dev` | 并发启动前后端 |
| `npm run build` | 构建前端 |
| `npm run lint` | ESLint 检查 |

## 安全红线
- 禁止硬编码密钥
- 禁止修改 `.env`
- 禁止 `dangerouslySetInnerHTML`

## 代码规范
- 组件 `PascalCase`，函数 `camelCase`
- 函数式组件 + `React.memo` + `useCallback`
- 原生 CSS + BEM 命名
```

### 不需要创建的文件

- ❌ `docs/reference/` — AGENTS.md 就是事实来源
- ❌ `.agents/context/` — 文件太少，不需要速查表
- ❌ `.agents/skills/` — 通用 Skill 够用
- ❌ `pnpm docs:check` — 手动维护

---

## 中型项目示例（50 - 500 文件）

### 项目特征

- 有分包或模块化
- 代码文件 50-500 个
- 小团队（3-10 人）

### 推荐结构

```
project/
├── AGENTS.md
├── .cursorrules
├── CLAUDE.md
├── docs/
│   └── reference/
│       ├── coding.md
│       └── naming.md
├── .agents/
│   ├── context/
│   │   └── coding-conventions.md
│   └── skills/
│       ├── eslint-autofix/
│       │   └── SKILL.md
│       ├── karpathy-guidelines/
│       │   └── SKILL.md
│       └── harsh-current-branch-review/
│           └── SKILL.md
├── src/
└── package.json
```

### AGENTS.md（只放地图）

```markdown
# AGENTS.md

## Project
{项目描述}

## Map
- `docs/reference/coding.md` — 完整编码规范
- `docs/reference/naming.md` — 完整命名规范
- `.agents/context/coding-conventions.md` — AI 速查摘要
- `.agents/skills/` — 任务工作流

## Commands
{命令列表}

## Security
{安全红线}
```

### .agents/context/coding-conventions.md（速查表）

```markdown
# 核心编码约定

本文件是 `docs/reference/coding.md` 和 `docs/reference/naming.md` 的精炼摘要，
供 AI 工具快速参考。完整规范详见原始文档。

## 命名
{表格形式，压缩到一页}

## React
{核心规则}

## CSS
{核心规则}
```

---

## 大型项目示例（500 - 5000 文件）

### 项目特征

- Monorepo，多包
- 2-5 个端
- 多团队（10+ 人）

### 推荐结构

```
project/
├── AGENTS.md
├── docs/
│   ├── index.md
│   ├── reference/
│   │   ├── architecture.md
│   │   ├── coding.md
│   │   ├── naming.md
│   │   └── css.md
│   ├── runbooks/
│   └── exec-plans/
│       ├── active/
│       └── completed/
├── .agents/
│   ├── context/
│   │   ├── architecture-overview.md
│   │   ├── coding-conventions.md
│   │   └── tech-stack.md
│   ├── skills/
│   │   ├── eslint-autofix/
│   │   ├── karpathy-guidelines/
│   │   ├── harsh-current-branch-review/
│   │   ├── performance-guard/
│   │   ├── react-render-audit/
│   │   └── release-build-chain/
│   └── workflow/
└── packages/
    ├── ui/
    ├── core/
    └── app/
```

---

## 超大型项目示例（> 5000 文件）

### 参考超大型 monorepo 的完整实现

- `docs/` 下 5 个业务桶 + 2 个自动生成控制面
- `.agents/skills/` 下 30+ 个 Skill
- 各端专属 `.agents/context/` 和 `.agents/skills/`
- `pnpm docs:check` + `pnpm docs:index` 自动化校验
