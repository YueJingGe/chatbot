---
name: Git Push
description: 提交当前变更并推送到远程仓库，同时生成提交记录文档保存到 {workspace}/Documents/提交记录
---

请帮我完成以下操作：

## 1. 检查变更

运行 `git status --short` 检查当前仓库状态。

## 2. 无变更的情况

如果工作区干净（没有新增、修改、删除文件）：
- 运行 `git log --oneline -1` 获取最近一次提交信息
- 运行 `git push`
- 结束任务并报告推送结果

## 3. 有变更的情况

### 3.1 列出变更文件

运行 `git status --short`，向用户展示变更文件列表。

### 3.2 索要 commit message

**必须**向用户索要本次提交的 commit message。要求：
- 不能为空
- 建议遵循 Conventional Commits 规范（如 `feat: xxx`、`fix: xxx`）
- 如果是当前会话内的修改，可结合会话上下文帮助用户生成 message，但**必须经用户确认**

### 3.3 执行提交与推送

1. 运行 `git add -A`
2. 使用用户确认的 message 执行 `git commit -m "<message>"`
3. 运行 `git push`

### 3.4 生成提交记录文档

1. 获取当前时间，格式化为 `YYYY-MM-DD-HH-mm-ss`（示例：`2026-08-17-14-30-00`）
2. 获取作者信息：
   - `git config user.name`
   - `git config user.email`
3. 获取变更文件清单：
   - `git diff --name-only HEAD~1 HEAD`
4. 创建目录 `{workspace}/Documents/提交记录/`（如不存在）
5. 写入文件 `{workspace}/Documents/提交记录/{timestamp}.md`，内容模板如下：

```markdown
# 提交记录

- 提交时间：{YYYY-MM-DD HH:mm:ss}
- 作者：{user.name} <{user.email}>
- Commit Message：{message}
- Commit Hash：{hash}
- 分支：{branch}

## 变更文件

{文件清单，每行一个}
```

## 4. 完成汇报

任务完成后向用户汇报：
- 是否成功推送
- commit hash
- 提交记录文档的完整路径
- 变更文件数量
