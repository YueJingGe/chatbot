---
name: agent-first-docs-docs-guard
description: >
  Agent-First 文档治理体系的文档守卫 Skill。为项目生成 pre-commit hook 脚本和 CI Pipeline 配置，
  确保文档与代码同步演进。包括：依赖变更时提醒更新技术栈文档、API 变更时提醒更新接口文档、
  AGENTS.md 行数检查、harness 文件 frontmatter 完整性校验、文档内部链接有效性检查。
  本 Skill 依赖 agent-first-docs Skill 已初始化完成的文档结构。
---

# 文档守卫（Docs Guard）

## 前置条件

- 项目已通过 `agent-first-docs` Skill 初始化了文档治理体系
- 项目存在 `docs/harness/`、`docs/knowledge/` 目录结构
- 项目已初始化 Git 仓库

如果前置条件不满足，提示用户先执行 `agent-first-docs` Skill 初始化。

## 核心原则

1. **提醒优先于阻断**：大部分检查只输出警告，不阻断提交；只有明确违反硬规则时才阻断
2. **零依赖**：pre-commit 脚本使用纯 Bash，CI 脚本使用 Node.js 原生模块，不引入额外依赖
3. **可配置**：所有检查项可通过环境变量或配置文件开关，适配不同团队的工作流
4. **渐进式接入**：可以只启用部分检查项，不要求一次性全部开启

---

## 产物结构

```

项目根目录/
├── scripts/
│ ├── pre-commit-docs-check.sh ← Pre-commit Hook 脚本
│ └── docs-health-check.mjs ← CI 校验脚本
├── .github/
│ └── workflows/
│ └── docs-health.yml ← GitHub Actions CI 配置（如项目使用 GitHub）
└── .docs-guard.config.json ← 可选的配置文件，控制检查项开关
```


---

## 执行流程

### Step 1：检查前置条件

确认以下文件/目录存在：
- `docs/harness/` 目录
- `docs/knowledge/` 目录
- `AGENTS.md` 文件
- `.git/` 目录（确认已初始化 Git）

任一缺失则终止并提示用户先执行 `agent-first-docs` Skill。

### Step 2：生成配置文件（可选）

如果项目根目录不存在 `.docs-guard.config.json`，生成默认配置：

```json
{
  "checks": {
    "dependencyChange": true,
    "apiChange": true,
    "agentsMdSize": true,
    "harnessFrontmatter": true,
    "internalLinks": true,
    "knowledgeFreshness": true,
    "proposedTagCount": true
  },
  "thresholds": {
    "agentsMdMaxLines": 200,
    "knowledgeMaxAgeDays": 30,
    "harnessMaxRuleLines": 15
  },
  "paths": {
    "apiPatterns": ["src/api/", "server/src/routes/", "server/src/controllers/"],
    "knowledgeDir": "docs/knowledge",
    "harnessDir": "docs/harness"
  }
}