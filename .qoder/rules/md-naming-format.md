---
trigger: manual
alwaysApply: false
---

# MD 文档命名规范

## 强制要求

所有 AI 生成的 `.md` 文档的文件名必须使用以下格式：

yyyyMMdd-HH:mm-{name}.md

其中：  
- **yyyyMMdd**：当前日期（4位年 + 2位月 + 2位日），如 `20260630`  
- **HH:mm**：当前时间（24小时制：2位时 + 2位分 + 2位秒），如 `11:16`  
- **{name}**：文档内容的关键词描述，使用中划线连接，如 `三层测试体系方案`

完整示例：`20260630-11:16-三层测试体系方案.md`

## 获取当前时间

命名时必须通过 **PowerShell** 命令获取当前时间戳：

```powershell
powershell -Command "Get-Date -Format 'yyyyMMddHHmm'"
```

禁止人工编写或猜测时间戳。

## 适用范围
- 所有 AI 新建的 `.md` 文档（需求分析、方案、文档、笔记等）
- 不适用于已存在的 `.md` 文档的重命名
- 不适用于代码文件（`.java`, `.ts`, `.tsx`, `.xml`, `.yml` 等）
- 不适用于 .qoder、.agents 下的文件
