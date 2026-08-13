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

## 常用命令

- 安装依赖：`npm install`
- 本地开发：`npm run dev`（并发启动前后端）
- 仅后端：`npm run dev:server`（端口 3000）
- 仅前端：`npm run dev:web`（端口 5173）
- 构建产物：`npm run build`（输出到 `web/dist/`）

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

1. **先读后做**：任务开始前必须读本文件。修改代码前，必须根据“文档导航”表格读取对应级别的 harness 约束（尤其是 iron 和 living 级别）。
2. **不确定就问**：禁止捏造接口字段、环境变量名、权限码、业务规则
3. **改完必验**：代码修改后执行 `npm run build`
4. **新需求先规划**：在 `docs/specs/active/` 创建 spec 文档对齐验收标准。spec 确认后，必须在 `docs/exec-plans/active/` 生成执行计划（包含任务分解、依赖关系、验证方式），按步骤编码并在计划中打勾
5. **犯错即补规则**：Agent 犯了某类错误后，修复代码，并将对应约束补充到 `docs/harness/code-style.md` 或 `docs/harness/bad-cases.md` 中，必须标注 [PROPOSED] 标签等待人类审批
6. **文档同步义务**：
   - 升级依赖版本后 → 更新 `docs/knowledge/tech-stack.md`
   - 调整目录结构后 → 更新 `docs/knowledge/directory-structure.md`
   - 变更数据流后 → 更新 `docs/knowledge/data-flow.md`
   - 发现技术债 → 记录到 `docs/exec-plans/tech-debt-tracker.md`
7. **任务闭环与智能归档规则**：
  当用户明确回复“验收通过”、“没问题”等确认词汇，且当前代码构建无报错时：
  - **获取当前日期**：Agent 必须获取当前系统时间，格式化为 `YYYY-MM`（例如 2024-05）。
  - **检查并创建目录**：检查 `docs/specs/completed/{YYYY-MM}/` 和 `docs/exec-plans/completed/{YYYY-MM}/` 是否存在。若不存在，**必须先创建该目录**。
  - **执行移动与标记**：
    - 将 Spec 文档移至 `specs/completed/{YYYY-MM}/`。
    - 将 Exec-plan 文档移至 `exec-plans/completed/{YYYY-MM}/`。
    - **关键动作**：在移动前，必须将文档内的验收标准 `- [ ]` 批量替换为 `- [x]`，表示已验证通过。
  - **汇报**：回复“文档已归档至 {YYYY-MM} 目录，任务闭环。”
8. **技术债自动记录规则**：
  - **主动识别**：当 Agent 在代码中使用了临时方案（如 `TODO`, `FIXME`, `any` 类型, 硬编码配置）时，必须在生成代码后，自动向 `docs/exec-plans/tech-debt-tracker.md` 追加一行记录。
  - **状态更新**：当 Agent 修复了某个已知问题时，必须找到对应的记录，将状态从 `open` 修改为 `resolved`，并填入解决日期。
  - **优先级定义**：
    - P0: 导致系统崩溃或严重安全漏洞。
    - P1: 严重影响性能或后续扩展性。
    - P2: 代码风格不统一或非关键逻辑的临时方案。
---

> **最后更新**：本文档随项目架构演进同步更新。
