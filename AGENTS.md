# AGENTS.md — AI 对话机器人项目级 Agent 规范

> 继承并扩展 `.cursorrules` 中的基础规则（禁止 `var`、有分号、双引号、禁止 `dangerouslySetInnerHTML`、禁止硬编码密钥）。

---

## 项目概述

- **架构**：npm workspaces Monorepo（server/ 后端 + web/ 前端）
- **技术栈**：React 19 + Vite 7 + TypeScript（前端） / Express 5 + OpenAI SDK 6（后端）
- **包管理**：npm
- **通信**：SSE 流式传输（`fetch` + `ReadableStream`）
- **LLM**：阿里云百炼 DashScope OpenAI 兼容模式，qwen-max 模型
- **核心特点**：
  - 单页应用，`App.tsx` 集中管理所有状态，禁止引入状态管理库
  - OpenAI 客户端为模块级单例，复用连接
  - 所有叶子组件使用 `React.memo`，callback 使用 `useCallback`
  - 前端端口 5173，后端端口 3000，Vite dev proxy 转发到后端

---

## Git Hooks

- **Husky** 已启用，`pre-commit` hook 会自动执行 `npm run lint && npm run build`
- 提交代码前请确保 lint 和 build 通过

---

## 常用命令

- 安装依赖：`npm install`
- 本地开发：`npm run dev`（并发启动前后端）
- 仅后端：`npm run dev:server`（端口 3000）
- 仅前端：`npm run dev:web`（端口 5173）
- 代码校验：`npm run lint`
- 构建产物：`npm run build`（输出到 `web/dist/`）

---

## 核心硬约束（TOP 5）

1. **禁止硬编码密钥**：所有 API Key 必须通过 `.env` + `process.env` 读取，`.env` 禁止提交
2. **禁止跨层依赖**：前端禁止引入 express/cors/openai；后端禁止引入 react/vite
3. **禁止引入状态管理/路由/CSS-in-JS/UI 框架**：单页应用，App.tsx 集中管理状态，使用原生 CSS
4. **组件必须 memo + useCallback**：所有叶子组件 `React.memo`，传递给子组件的 callback 必须 `useCallback`
5. **禁止 `var` / `dangerouslySetInnerHTML` / `eval()` / `new Function()`**

> 完整约束详见：`docs/harness/code-style.md`、`docs/harness/security.md`、`docs/harness/architecture.md`

---

## 文档导航

| 场景 | 级别 | 读取文件 |
|------|------|----------|
| 改构建/路由/状态管理/Monorepo | iron | `docs/harness/architecture.md` |
| 写新代码 | living | `docs/harness/code-style.md` |
| 改鉴权/数据处理 | iron | `docs/harness/security.md` |
| 技术栈详情 | guideline | `docs/knowledge/tech-stack.md` |
| 目录职责 | guideline | `docs/knowledge/directory-structure.md` |
| SSE 数据流转 | guideline | `docs/knowledge/data-flow.md` |
| 编码规范（详细） | - | `docs/reference/coding.md` |
| 命名规范 | - | `docs/reference/naming.md` |

**优先级声明**：

- 本文件 > docs/ 下的文档 > Agent 默认行为
- `docs/reference/` 为团队自定义资源，优先级高于本体系生成的文档
- `.agents/skills/` 为团队自定义资源，优先级高于本体系生成的文档

---

## 文档修改权限

- **铁律（level: iron）**：禁止修改，发现铁律不合理时向人类报告
- **活约束（level: living）**：可提议新增，必须标注 `[PROPOSED]` 标签等待审批
- **参考指南（level: guideline）**：修改代码后应主动同步更新
- **specs/ 和 exec-plans/**：可自由创建和管理

---

## Agent 工作规则

1. **先读后做**：任务开始前读本文件，修改代码前读取对应的 harness 约束
2. **不确定就问**：禁止捏造接口字段、环境变量名、权限码、业务规则
3. **改完必验**：代码修改后依次执行 `npm run lint` → `npm run build`
4. **新需求先建 spec**：在 `docs/specs/active/` 创建 spec 文档对齐验收标准，再开始编码
5. **犯错即补规则**：Agent 犯了某类错误后，修复并把对应约束补充到本文件或 `docs/harness/` 中
6. **文档同步义务**：
   - 升级依赖版本后 → 更新 `docs/knowledge/tech-stack.md`
   - 调整目录结构后 → 更新 `docs/knowledge/directory-structure.md`
   - 变更数据流后 → 更新 `docs/knowledge/data-flow.md`
   - 发现技术债 → 记录到 `docs/exec-plans/tech-debt-tracker.md`

---

> **最后更新**：本文档随项目架构演进同步更新。
