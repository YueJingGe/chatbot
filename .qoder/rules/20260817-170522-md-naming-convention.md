---
name: md-naming-timestamp
description: 所有生成的 .md 文档必须使用 {yyyyMMdd}-{HHmmss}-{name} 格式命名
type: always_on
---

# MD 文档命名规范

所有生成的 `.md` 文档必须按以下格式命名：

```text
{yyyyMMdd}-{HHmmss}-{name}.md
```

## 字段说明

- `{yyyyMMdd}`：当前日期，由 4 位年份 + 2 位月份 + 2 位日期组成，例如 `20260630`。
- `{HHmmss}`：当前时间（24 小时制），由 2 位小时 + 2 位分钟 + 2 位秒组成，例如 `111604`。
- `{name}`：文档内容的关键词描述，使用中划线连接，例如 `三层测试体系方案`。

## 获取时间戳

命名时必须通过 **PowerShell** 命令获取当前时间戳：

```powershell
powershell -Command "Get-Date -Format 'yyyyMMdd-HHmmss'"
```

## 完整示例

```text
20260630-111604-三层测试体系方案.md
```

## 执行要求

1. 在创建或保存 `.md` 文件前，先运行上述 PowerShell 命令获取时间戳。
2. 将 `{name}` 替换为能概括文档核心内容的中划线连接关键词。
3. 最终文件名由时间戳、关键词和 `.md` 扩展名拼接而成。
