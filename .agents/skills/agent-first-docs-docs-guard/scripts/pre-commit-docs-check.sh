#!/usr/bin/env bash

# ==========================================
#  Docs Guard — Pre-commit Check
#  在每次 git commit 前自动拦截不合规的文档
# ==========================================

set -e

ROOT_DIR="$(git rev-parse --show-toplevel)"
IGNORE_FILE="$ROOT_DIR/.agents/ignore"
HARNESS_DIR="$ROOT_DIR/docs/harness"

# 颜色输出
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# ==========================================
#  1. 加载忽略列表
# ==========================================
declare -a EXCLUDED_FILES=()

if [[ -f "$IGNORE_FILE" ]]; then
  while IFS= read -r line || [[ -n "$line" ]]; do
    # 跳过空行和注释
    [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
    # 去除首尾空格
    line="$(echo "$line" | xargs)"
    [[ -n "$line" ]] && EXCLUDED_FILES+=("$line")
  done < "$IGNORE_FILE"
fi

# 判断文件是否被忽略
is_excluded() {
  local file="$1"
  local rel_path="${file#$ROOT_DIR/}"
  for pattern in "${EXCLUDED_FILES[@]}"; do
    if [[ "$rel_path" == "$pattern" ]] || [[ "$rel_path" == "$pattern"* ]] || [[ "$file" == *"$pattern"* ]]; then
      return 0
    fi
  done
  return 1
}

# ==========================================
#  2. 检查函数
# ==========================================
WARN_COUNT=0
ERROR_COUNT=0

warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; ((WARN_COUNT++)); }
error() { echo -e "${RED}[ERROR]${NC} $1"; ((ERROR_COUNT++)); }
info()  { echo -e "${GREEN}[INFO]${NC} $1"; }

# 检查 harness 目录下是否有未处理的 PROPOSED 标签
check_proposed_tags() {
  if [[ ! -d "$HARNESS_DIR" ]]; then
    return 0
  fi

  local proposed_files=()

  while IFS= read -r -d '' file; do
    # 忽略被排除的文件
    if is_excluded "$file"; then
      continue
    fi

    # 检查是否包含 [PROPOSED] 标签
    if grep -q '\[PROPOSED\]' "$file" 2>/dev/null; then
      local rel_path="${file#$ROOT_DIR/}"
      proposed_files+=("$rel_path")
    fi
  done < <(find "$HARNESS_DIR" -type f -name "*.md" -print0 2>/dev/null)

  if [[ ${#proposed_files[@]} -gt 0 ]]; then
    warn "docs/harness/ 中有 ${#proposed_files[@]} 处 [PROPOSED] 标签未处理："
    for f in "${proposed_files[@]}"; do
      echo "       → $f"
    done
    warn "请及时审批或移除。"
  fi
}

# 检查暂存区中 Markdown 文件的 frontmatter 是否包含 owner
check_staged_frontmatter() {
  local staged_files
  staged_files=$(git diff --cached --name-only --diff-filter=AM 2>/dev/null | grep -E '\.md$' || true)

  if [[ -z "$staged_files" ]]; then
    return 0
  fi

  for file in $staged_files; do
    local full_path="$ROOT_DIR/$file"

    # 忽略被排除的文件
    if is_excluded "$full_path"; then
      continue
    fi

    # 只检查 docs/ 下的 markdown（排除 node_modules 等）
    if [[ "$file" != docs/* ]]; then
      continue
    fi

    # 检查是否有 frontmatter（以 --- 开头）
    if head -1 "$full_path" | grep -q '^---$'; then
      # 检查 frontmatter 中是否有 owner 字段
      if ! awk '/^---/{if(++n==2)exit} n==1{if(/^owner:/)found=1} END{exit !found}' "$full_path"; then
        error "$file 缺少 frontmatter 中的 'owner:' 字段"
      fi
    fi
  done
}

# ==========================================
#  3. 执行检查
# ==========================================
echo "=========================================="
echo "  Docs Guard — Pre-commit Check"
echo "=========================================="
echo ""

check_proposed_tags
check_staged_frontmatter

echo ""

# ==========================================
#  4. 输出结果
# ==========================================
if [[ $ERROR_COUNT -gt 0 ]]; then
  echo -e "${RED}=========================================="
  echo "  ❌ 检查未通过：${ERROR_COUNT} 个错误，${WARN_COUNT} 个警告"
  echo "==========================================${NC}"
  exit 1
elif [[ $WARN_COUNT -gt 0 ]]; then
  echo -e "${YELLOW}=========================================="
  echo "  ⚠️  检查通过，但有 ${WARN_COUNT} 个警告"
  echo "==========================================${NC}"
  exit 0
else
  echo -e "${GREEN}=========================================="
  echo "  ✅ 所有文档检查通过"
  echo "==========================================${NC}"
  exit 0
fi