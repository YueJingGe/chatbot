
# 完成事项


✅新增 create-agent-first-docs 技能

初始化一份 agent-first 文档结构


```
chatbot/
├── AGENTS.md                          ✅ 给 agent 的
├── .cursorrules                       ✅ 给 Cursor 的规则
├── .agents/
│   ├── context/                       ✅ 存放索引摘要，给智能体提供上下文
│   ├── skills/                        ✅ 技能，将固定的ops沉淀到这里
│   │   ├── karpathy-guidelines/       ✅ 通用 AI 编程行为准则，减少 LLM 过度设计
│   │   ├── skill-creator/             ✅ 创建规范的skill（智能体内置的话就不需要了）
│   │   └── create-agent-first-docs/   ✅ 初始化或增强 Agent-First 文档治理体系
│   └── ignore                         ✅ 忽略配置
├── docs/                              ✅ 文档体系（唯一事实来源）
│   ├── reference/                     ✅ 完整规范（人可以修改的）
│   │   ├── coding.md                  ✅ 编码规范
│   │   └── naming.md                  ✅ 命名规范
│   ├── harness/                       ✅ 架构、编码、安全、bad-cases降低ai的错误率
│   ├── knowledge/                     ✅ 技术栈、目录职责、数据流转
│   ├── specs/                         ✅ 需求规格（进行中、已完成）
│   └── exec-plans/                    ✅ 执行计划（进行中、已完成）
└── ISSUES/                            ✅ 问题追踪（手动记录）
```

# 待办事项

[]后续再优化文档结构及其内容