# Markdown 格式规范

Markdown 文件由 Prettier 自动格式化，无需手动排版。

## 格式化方式

|工具|说明|
|-|-|
|Prettier|通用格式化（段落折行、标题空行、列表缩进）|
|prettier-plugin-compact-markdown-table|表格紧凑格式（无填充空格）|

## 配置

```json
// .prettierrc
{
  "plugins": ["prettier-plugin-compact-markdown-table"],
  "tableLayout": "compact"
}
```

## 表格格式

```markdown
# 输入（有空格）

|Skill|说明|路径|
|-|-|-|
|`create-agent-first-docs`|创建 Agent 优先文档|...|

# 输出（compact 模式）

|Skill|说明|路径|
|-|-|-|
|`create-agent-first-docs`|创建 Agent 优先文档|...|
```

## 注意事项

|规则|说明|
|-|-|
|表格内容不要手动折行|Prettier 不会折行表格，保持单行即可|
|不要在行尾加空格|Prettier 会自动去掉，加了也没用|
|用 `<br>` 换行|表格内需要多行时用 `<br>`，Prettier 会保留|
