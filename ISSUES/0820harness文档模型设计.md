# 完成事项

## 构建本项目的 harness

> Harness 体系就是让"人 + AI"在同一套规则下协作

- 分层设计
  - README.md 人 项目介绍、技术栈、目录结构、开发命令
  - AGENTS.md AI + 高级用户 Map 导航、命令速查
  - CLAUDE.md Claude Code 简化入口，跳转 AGENTS.md
  - llms.txt 任何 AI 工具 llmstxt.org 标准概览
  - .agents/context 给 AI 的上下文
  - .agents/skills 给 AI 的技能
  - docs/harness 是给 AI 的编码红线、约束
  - docs/reference 是给 AI 的详细规范

- 设计 `.agents/ignore` 给 AI 的忽略
  - 让 AI 编辑器 **跳过日志、构建产物、依赖** 等，节省 **token**

- 设计 Map 导航
  - AGENTS.md 中设计 Map 导航，根据不同场景跳转到不同的上下文、技能、工作流等，按需加载，节省 **token**

- 设计同步机制
  - **postinstall** 钩子，运行 `npm install` 触发钩子，将单一的 ignore 源、skills 源分发到不同的 AI 编辑器
  - 多 agent 支持 **claude-code、cursor、codex**
  - 进行内容对比：相同则跳过，**提高性能**

- 设计插件安装提示
  - 新增 `.vscode/extensions.json` 配置
  - 新成员 `git clone` 后 **零配置** 即可获得团队统一插件（Prettier、ESLint、Stylelint）

- 设计单一事件源——全局规范
  - 各个 AI 编辑器 都会跳转到 **AGENTS.md**

  并且按照 Map 跳转到不同的上下文、技能、工作流等

- 重新定义 AI 写代码流程

```m
1. AI 收到任务（如"加一个 xxx 功能"）
   ↓
2. 按 AGENTS.md Map 跳转
   ↓
   读 .agents/skills/new-requirement/SKILL.md
   ↓
   路由：L0/L1/L2 决定是否需要写 spec
   ↓
3. AI 写代码
   ↓
   读 .agents/context/frontend-context.md（前端知识）
   读 docs/harness/frontend-rules.md（编码红线）
   读 docs/reference/react-components.md（写法参考）
   ↓
4. AI 完成
   ↓
   按 SKILL.md 的"提交前自检"清单自查
```

- 重新定义 AI 提交代码的流程
  - 通过配置 `husky/pre-commit` 在提交前触发 **ESLint、Prettier、Stylelint** 统一规范（工具稳定性 > AI）

```m
1. AI 收到"提交"指令
   ↓
2. 读 .agents/skills/git-commit/SKILL.md
   ↓
3. 跑 npm run check:all（提交前预检）
   ↓
   Prettier 检查 → ESLint 检查 → Stylelint 检查 → build（工具之行的）
   ↓
4. 全部通过后才执行 git commit
   ↓
   Conventional Commits 格式
   ↓
5. AI 修改过的 .agents/skills/ 自动通过 sync-skills 同步
```
