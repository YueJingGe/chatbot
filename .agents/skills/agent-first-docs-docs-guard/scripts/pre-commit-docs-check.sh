#!/bin/bash
# scripts/pre-commit-docs-check.sh
# Agent-First 文档守卫 - Pre-commit Hook
# 用法：在 .husky/pre-commit 或 .git/hooks/pre-commit 中调用
#   bash scripts/pre-commit-docs-check.sh
#
# 环境变量：
#   DOCS_GUARD_SKIP=1    跳过所有检查
#   DOCS_GUARD_STRICT=1  将警告升级为阻断

set -euo pipefail

# 跳过检查
if [ " $ {DOCS_GUARD_SKIP:-0}" = "1" ]; then
  exit 0
fi

# 读取配置（如果存在）
CONFIG_FILE=".docs-guard.config.json"
STRICT_MODE=" $ {DOCS_GUARD_STRICT:-0}"

AGENTS_MAX_LINES=200
if [ -f " $ CONFIG_FILE" ] && command -v node &>/dev/null; then
  AGENTS_MAX_LINES= $ (node -e "
    const c = JSON.parse(require('fs').readFileSync(' $ CONFIG_FILE','utf8'));
    console.log(c?.thresholds?.agentsMdMaxLines || 200);
  " 2>/dev/null || echo 200)
fi

ERRORS=0
WARNINGS=0

# 获取本次提交涉及的文件（仅暂存区）
CHANGED_FILES= $ (git diff --cached --name-only --diff-filter=ACMR 2>/dev/null || true)

if [ -z " $ CHANGED_FILES" ]; then
  exit 0
fi

echo "🔍 [Docs Guard] 检查文档同步状态..."

# ============================================================
# 检查 1：依赖变更 → 提醒更新 tech-stack.md
# ============================================================
if echo " $ CHANGED_FILES" | grep -qE "(^|/)package\.json $ |pnpm-lock\.yaml $ |yarn\.lock $ |package-lock\.json $ "; then
  if [ -f "docs/knowledge/tech-stack.md" ]; then
    echo "⚠️  [Docs Guard] 检测到依赖变更，请确认 docs/knowledge/tech-stack.md 是否需要同步更新"
    WARNINGS= $ ((WARNINGS + 1))
  fi
fi

# ============================================================
# 检查 2：API 层变更 → 提醒更新 api-conventions.md
# ============================================================
API_PATTERNS="src/api/|server/src/routes/|server/src/controllers/"
if [ -f " $ CONFIG_FILE" ] && command -v node &>/dev/null; then
  API_PATTERNS= $ (node -e "
    const c = JSON.parse(require('fs').readFileSync(' $ CONFIG_FILE','utf8'));
    const p = c?.paths?.apiPatterns || ['src/api/','server/src/routes/','server/src/controllers/'];
    console.log(p.join('|'));
  " 2>/dev/null || echo " $ API_PATTERNS")
fi

if echo " $ CHANGED_FILES" | grep -qE " $ API_PATTERNS"; then
  echo "⚠️  [Docs Guard] 检测到 API 层变更，请确认 docs/knowledge/ 下的接口文档是否需要同步更新"
  WARNINGS= $ ((WARNINGS + 1))
fi

# ============================================================
# 检查 3：AGENTS.md 行数检查
# ============================================================
if echo " $ CHANGED_FILES" | grep -q "^AGENTS\.md $ "; then
  if [ -f "AGENTS.md" ]; then
    LINES= $ (wc -l < AGENTS.md | tr -d ' ')
    if [ " $ LINES" -gt " $ AGENTS_MAX_LINES" ]; then
      echo "❌ [Docs Guard] AGENTS.md 超过  $ {AGENTS_MAX_LINES} 行（当前  $ {LINES} 行），请拆分到 docs/harness/"
      ERRORS= $ ((ERRORS + 1))
    fi
  fi
fi

# ============================================================
# 检查 4：harness 文件 frontmatter 检查
# ============================================================
HARNESS_CHANGES= $ (echo " $ CHANGED_FILES" | grep "^docs/harness/.*\.md $ " || true)
if [ -n " $ HARNESS_CHANGES" ]; then
  for file in  $ HARNESS_CHANGES; do
    if [ -f " $ file" ]; then
      # 检查是否有 frontmatter
      FIRST_LINE= $ (head -1 " $ file")
      if [ " $ FIRST_LINE" != "---" ]; then
        echo "❌ [Docs Guard]  $ file 缺少 frontmatter（--- 包裹的元数据头）"
        ERRORS= $ ((ERRORS + 1))
      else
        # 检查必要字段
        FM= $ (sed -n '1,/^--- $ /p' " $ file")
        for field in level owner last_reviewed review_cycle; do
          if ! echo " $ FM" | grep -q "^ $ {field}:"; then
            echo "❌ [Docs Guard]  $ file 的 frontmatter 缺少必要字段:  $ field"
            ERRORS= $ ((ERRORS + 1))
          fi
        done
      fi
    fi
  done
fi

# ============================================================
# 检查 5：harness 条目数量检查
# ============================================================
if [ -n " $ HARNESS_CHANGES" ]; then
  MAX_RULE_LINES=15
  if [ -f " $ CONFIG_FILE" ] && command -v node &>/dev/null; then
    MAX_RULE_LINES= $ (node -e "
      const c = JSON.parse(require('fs').readFileSync(' $ CONFIG_FILE','utf8'));
      console.log(c?.thresholds?.harnessMaxRuleLines || 15);
    " 2>/dev/null || echo 15)
  fi

  for file in  $ HARNESS_CHANGES; do
    if [ -f " $ file" ]; then
      # 去掉 frontmatter 后统计以 "- " 开头的行
      CONTENT= $ (sed '1,/^--- $ /{ /^--- $ /d; d }' " $ file" 2>/dev/null || cat " $ file")
      RULE_COUNT= $ (echo " $ CONTENT" | grep -cE "^\s*-\s+" || true)
      if [ " $ RULE_COUNT" -gt " $ MAX_RULE_LINES" ]; then
        echo "⚠️  [Docs Guard]  $ file 约束条目超过  $ {MAX_RULE_LINES} 条（当前  $ {RULE_COUNT} 条），建议拆分或升级为自动化检查"
        WARNINGS= $ ((WARNINGS + 1))
      fi
    fi
  done
fi

# ============================================================
# 汇总输出
# ============================================================
echo ""
if [ " $ ERRORS" -gt 0 ]; then
  echo "❌ [Docs Guard] 发现  $ {ERRORS} 个错误，提交被阻断"
  exit 1
fi

if [ " $ WARNINGS" -gt 0 ]; then
  if [ " $ STRICT_MODE" = "1" ]; then
    echo "❌ [Docs Guard] 严格模式下， $ {WARNINGS} 个警告被升级为错误，提交被阻断"
    exit 1
  else
    echo "⚠️  [Docs Guard] 发现  $ {WARNINGS} 个警告（DOCS_GUARD_STRICT=1 可升级为阻断）"
  fi
fi

if [ " $ ERRORS" -eq 0 ] && [ " $ WARNINGS" -eq 0 ]; then
  echo "✅ [Docs Guard] 文档同步检查通过"
fi

exit 0