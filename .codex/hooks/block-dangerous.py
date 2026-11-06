#!/usr/bin/env python3
"""PreToolUse(Bash) → 拦截递归强制删除（rm -rf 及其常见变体）。

Codex 只有 PreToolUse 返回退出码 2 才能阻断工具调用；挂在 PostToolUse 时命令已执行完毕，拦截无效。

判定方式：按 shell 分隔符切段后逐段 shlex 解析，只看「命令词」是否为 rm，避免
`git commit -m "禁止 rm -rf"` 这类文本误伤。支持的变体：-rf / -fr / -r -f /
--recursive --force / sudo rm / /bin/rm / sh -c "rm -rf ..."。

脚本自身异常一律放行（fail-open），避免解析失败后所有 Bash 命令被卡死。
"""

import json
import re
import shlex
import sys

SEGMENT_SPLIT = re.compile(r"\r?\n|\|\||&&|;|\|")
SHELLS = {"sh", "bash", "zsh", "dash", "ksh"}


def is_rm_recursive_force(argv):
    if not argv:
        return False
    head = argv[0].rsplit("/", 1)[-1]
    if head == "sudo":
        return is_rm_recursive_force(argv[1:])
    if head != "rm":
        return False

    recursive = force = False
    for token in argv[1:]:
        if token == "--recursive":
            recursive = True
        elif token == "--force":
            force = True
        elif token.startswith("--"):
            continue
        elif token.startswith("-") and len(token) > 1:
            recursive = recursive or "r" in token or "R" in token
            force = force or "f" in token
    return recursive and force


def has_dangerous_command(command):
    for segment in SEGMENT_SPLIT.split(command):
        if not segment.strip():
            continue
        try:
            argv = shlex.split(segment, posix=True)
        except ValueError:
            continue
        if is_rm_recursive_force(argv):
            return True
        head = argv[0].rsplit("/", 1)[-1] if argv else ""
        if head in SHELLS and "-c" in argv[1:]:
            index = argv.index("-c")
            if index + 1 < len(argv) and has_dangerous_command(argv[index + 1]):
                return True
    return False


def main():
    try:
        data = json.load(sys.stdin)
        command = (data.get("tool_input") or {}).get("command", "")
    except Exception:
        sys.exit(0)

    if not isinstance(command, str) or not command.strip():
        sys.exit(0)

    if has_dangerous_command(command):
        print("Blocked: 检测到递归强制删除（rm -rf 及其变体），已拦截。", file=sys.stderr)
        sys.exit(2)

    sys.exit(0)


main()
