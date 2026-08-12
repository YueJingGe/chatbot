#!/usr/bin/env bash
# pre-commit-docs-check.sh — Agent-First 文档守卫 Pre-commit Hook
#
# 在 git commit 前运行，检查文档与代码是否同步。
# 提醒优先于阻断：大部分检查只输出警告，只有明确违反硬规则时才阻断。

set -euo pipefail

# 颜色
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

# 计数器
WARNINGS=0
ERRORS=0

warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
  WARNINGS=$((WARNINGS + 1))
}

error() {
  echo -e "${RED}[ERROR]${NC} $1"
  ERRORS=$((ERRORS + 1))
}

ok() {
  echo -e "${GREEN}[OK]${NC} $1"
}

# 查找 node 命令
NODE_CMD=$(command -v node 2>/dev/null || ls /usr/local/bin/node 2>/dev/null || true)
if [ -z "$NODE_CMD" ]; then
  echo -e "${YELLOW}[WARN]${NC} node 命令未找到，跳过需要 node 的检查项"
  NODE_AVAILABLE=false
else
  NODE_AVAILABLE=true
fi

# 加载配置
CONFIG_FILE=".docs-guard.config.json"
if [ -f "$CONFIG_FILE" ] && [ "$NODE_AVAILABLE" = true ]; then
  # 使用 node 解析 JSON 配置（零依赖，项目已有 Node.js）
  CONFIG=$("$NODE_CMD" -e "
    const fs = require('fs');
    const config = JSON.parse(fs.readFileSync('$CONFIG_FILE', 'utf-8'));
    process.stdout.write(JSON.stringify(config));
  ")
else
  # 默认配置
  CONFIG='{"checks":{"dependencyChange":true,"apiChange":true,"agentsMdSize":true,"harnessFrontmatter":true,"internalLinks":true,"knowledgeFreshness":true,"proposedTagCount":true},"thresholds":{"agentsMdMaxLines":200,"knowledgeMaxAgeDays":30,"harnessMaxRuleLines":15},"paths":{"apiPatterns":["server/server.js"],"knowledgeDir":"docs/knowledge","harnessDir":"docs/harness"}}'
fi

# 读取配置项的辅助函数
check_enabled() {
  if [ "$NODE_AVAILABLE" = false ]; then
    return 0 # 默认启用
  fi
  "$NODE_CMD" -e "
    const config = JSON.parse(process.env.CONFIG);
    process.exit(config.checks.$1 === false ? 1 : 0);
  " 2>/dev/null
}

get_threshold() {
  if [ "$NODE_AVAILABLE" = false ]; then
    echo "${2:-200}"
    return
  fi
  "$NODE_CMD" -e "
    const config = JSON.parse(process.env.CONFIG);
    console.log(config.thresholds.$1);
  " 2>/dev/null
}

get_path() {
  if [ "$NODE_AVAILABLE" = false ]; then
    return
  fi
  "$NODE_CMD" -e "
    const config = JSON.parse(process.env.CONFIG);
    if (Array.isArray(config.paths.$1)) {
      config.paths.$1.forEach(p => console.log(p));
    } else {
      console.log(config.paths.$1);
    }
  " 2>/dev/null
}

export CONFIG

echo "=========================================="
echo "  Docs Guard — Pre-commit Check"
echo "=========================================="
echo ""

# 获取暂存区变更文件列表
CHANGED_FILES=$(git diff --cached --name-only --diff-filter=d 2>/dev/null || true)

if [ -z "$CHANGED_FILES" ]; then
  ok "No staged files, skipping docs check."
  exit 0
fi

# -------------------------------------------
# Check 1: AGENTS.md 行数检查
# -------------------------------------------
if check_enabled "agentsMdSize"; then
  MAX_LINES=$(get_threshold "agentsMdMaxLines" || echo "200")

  if git diff --cached --name-only | grep -q "^AGENTS\.md$"; then
    CURRENT_LINES=$(wc -l < AGENTS.md | tr -d ' ')
    if [ "$CURRENT_LINES" -gt "$MAX_LINES" ]; then
      error "AGENTS.md 有 $CURRENT_LINES 行，超过限制 $MAX_LINES 行。请将内容拆分到 docs/harness/ 或 docs/knowledge/ 中。"
    else
      ok "AGENTS.md 行数: $CURRENT_LINES/$MAX_LINES"
    fi
  fi
fi

# -------------------------------------------
# Check 2: 依赖变更检测
# -------------------------------------------
if check_enabled "dependencyChange"; then
  if echo "$CHANGED_FILES" | grep -qE "^(package\.json|package-lock\.json|server/package\.json|server/package-lock\.json|web/package\.json|web/package-lock\.json)$"; then
    # 检查 tech-stack.md 是否也一起提交
    if echo "$CHANGED_FILES" | grep -q "docs/knowledge/tech-stack\.md"; then
      ok "依赖变更后，tech-stack.md 已同步更新。"
    else
      warn "package.json/package-lock.json 已变更，请同步更新 docs/knowledge/tech-stack.md"
    fi
  fi
fi

# -------------------------------------------
# Check 3: API 变更检测
# -------------------------------------------
if check_enabled "apiChange"; then
  API_CHANGED=false
  while IFS= read -r pattern; do
    if [ -n "$pattern" ] && echo "$CHANGED_FILES" | grep -q "$pattern"; then
      API_CHANGED=true
      break
    fi
  done < <(get_path "apiPatterns")

  if [ "$API_CHANGED" = true ]; then
    warn "API 代码已变更，请确认相关文档已更新（如 docs/knowledge/data-flow.md）"
  fi
fi

# -------------------------------------------
# Check 4: Harness 文件 frontmatter 检查
# -------------------------------------------
if check_enabled "harnessFrontmatter"; then
  HARNESS_DIR=$(get_path "harnessDir" | head -1)

  while IFS= read -r file; do
    if [ -n "$file" ] && echo "$CHANGED_FILES" | grep -q "$file"; then
      # 检查 .md 文件是否有 frontmatter
      if [[ "$file" == *.md ]]; then
        FIRST_LINE=$(head -n 1 "$file" 2>/dev/null || true)
        if [ "$FIRST_LINE" != "---" ]; then
          warn "$file 缺少 frontmatter (--- 开头)"
        fi
      fi
    fi
  done < <(find "$HARNESS_DIR" -name "*.md" 2>/dev/null || true)
fi

# -------------------------------------------
# Check 5: 文档内部链接检查
# -------------------------------------------
if check_enabled "internalLinks"; then
  DOCS_CHANGED=false
  if echo "$CHANGED_FILES" | grep -qE "^docs/"; then
    DOCS_CHANGED=true
  fi

  if [ "$DOCS_CHANGED" = true ]; then
    # 提取文档中的相对路径引用，检查文件是否存在
    LINK_ERRORS=0
    while IFS= read -r doc_file; do
      # 提取反引号中的路径引用
      while IFS= read -r ref; do
        if [ -n "$ref" ] && [ ! -f "$ref" ]; then
          # 只检查相对路径（不包含 http:// 或 https://）
          if [[ ! "$ref" =~ ^http ]]; then
            # 获取文档所在目录
            doc_dir=$(dirname "$doc_file")
            if [[ "$ref" != /* ]] && [ ! -f "$doc_dir/$ref" ]; then
              # 尝试从 docs/ 根目录查找
              if [ ! -f "docs/$ref" ] && [ ! -f "$ref" ]; then
                warn "文档引用可能不存在: $ref (在 $doc_file 中)"
                LINK_ERRORS=$((LINK_ERRORS + 1))
              fi
            fi
          fi
        fi
      done < <(grep -oE '`[^`]+`' "$doc_file" 2>/dev/null | tr -d '`' || true)
    done < <(echo "$CHANGED_FILES" | grep -E "^docs/.*\.md$" || true)

    if [ "$LINK_ERRORS" -eq 0 ]; then
      ok "文档内部链接检查通过。"
    fi
  fi
fi

# -------------------------------------------
# Check 6: Knowledge 文档 freshness 检查
# -------------------------------------------
if check_enabled "knowledgeFreshness"; then
  MAX_AGE_DAYS=$(get_threshold "knowledgeMaxAgeDays" || echo "30")
  KNOWLEDGE_DIR=$(get_path "knowledgeDir" | head -1)

  CURRENT_EPOCH=$(date +%s)

  while IFS= read -r kf; do
    if [ -n "$kf" ] && [ -f "$kf" ]; then
      FILE_EPOCH=$(stat -f %m "$kf" 2>/dev/null || stat -c %Y "$kf" 2>/dev/null || echo "$CURRENT_EPOCH")
      AGE_DAYS=$(( (CURRENT_EPOCH - FILE_EPOCH) / 86400 ))

      if [ "$AGE_DAYS" -gt "$MAX_AGE_DAYS" ]; then
        warn "$kf 已 $AGE_DAYS 天未更新（阈值: $MAX_AGE_DAYS 天）"
      fi
    fi
  done < <(find "$KNOWLEDGE_DIR" -name "*.md" -not -name "index.md" 2>/dev/null || true)
fi

# -------------------------------------------
# Check 7: [PROPOSED] 标签数量检查
# -------------------------------------------
if check_enabled "proposedTagCount"; then
  PROPOSED_COUNT=$(grep -r "\[PROPOSED\]" docs/harness/ 2>/dev/null | wc -l | tr -d ' ')

  if [ "$PROPOSED_COUNT" -gt 0 ]; then
    warn "docs/harness/ 中有 $PROPOSED_COUNT 处 [PROPOSED] 标签未处理，请及时审批或移除。"
  else
    ok "无待处理的 [PROPOSED] 标签。"
  fi
fi

# -------------------------------------------
# 总结
# -------------------------------------------
echo ""
echo "=========================================="
if [ "$ERRORS" -gt 0 ]; then
  echo -e "${RED}Docs Guard: $ERRORS 错误, $WARNINGS 警告${NC}"
  echo -e "${RED}提交被阻断，请修复上述错误后重试。${NC}"
  echo "=========================================="
  exit 1
elif [ "$WARNINGS" -gt 0 ]; then
  echo -e "${YELLOW}Docs Guard: 0 错误, $WARNINGS 警告${NC}"
  echo -e "${YELLOW}提交通过，但请处理上述警告。${NC}"
  echo "=========================================="
  exit 0
else
  ok "Docs Guard: 所有检查通过 ✅"
  echo "=========================================="
  exit 0
fi
