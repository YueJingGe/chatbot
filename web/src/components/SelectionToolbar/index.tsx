import { memo, useCallback, useEffect, useRef } from "react";
import { CopyOutlined, RollbackOutlined } from "@ant-design/icons";
import { message } from "antd";

import { copyToClipboard } from "../../utils/copy";

import styles from "./index.module.less";

interface SelectionToolbarProps {
  /** 当前选中的文本 */
  text: string;
  /** 选区矩形（视口坐标），用于弹层定位 */
  rect: DOMRect | null;
  /** 是否显示弹层 */
  visible: boolean;
  /** 点击引用：把选中文本上抛给对话 */
  onQuote: (text: string) => void;
  /** 复制成功 3 秒后由组件回调关闭弹层 */
  onHide: () => void;
}

const HIDE_DELAY = 3000;
const TOOLBAR_HEIGHT = 36;
const TOOLBAR_GAP = 8;

/** 弹层默认贴选区上方，顶部空间不足时落到选区下方 */
function getToolbarPosition(rect: DOMRect | null) {
  if (!rect) {
    return { left: 0, top: 0 };
  }
  const above = rect.top - TOOLBAR_GAP - TOOLBAR_HEIGHT;
  const top = above >= TOOLBAR_GAP ? above : rect.bottom + TOOLBAR_GAP;
  return { left: rect.left, top };
}

// 按下时阻止浏览器清空选区，保证复制期间选区保持
const preserveSelection = (event: React.MouseEvent) => {
  event.preventDefault();
};

export const SelectionToolbar = memo(
  ({ text, rect, visible, onQuote, onHide }: SelectionToolbarProps) => {
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(
      () => () => {
        if (hideTimerRef.current) {
          clearTimeout(hideTimerRef.current);
        }
      },
      []
    );

    const handleQuote = useCallback(() => {
      onQuote(text);
    }, [onQuote, text]);

    const handleCopy = useCallback(async () => {
      try {
        await copyToClipboard(text);
        message.success("复制成功");
        if (hideTimerRef.current) {
          clearTimeout(hideTimerRef.current);
        }
        // 复制成功后弹层保留 3 秒再关闭
        hideTimerRef.current = setTimeout(onHide, HIDE_DELAY);
      } catch {
        message.error("复制失败");
      }
    }, [onHide, text]);

    if (!visible) {
      return null;
    }

    return (
      <div className={styles["selection-toolbar"]} style={getToolbarPosition(rect)}>
        <button
          type="button"
          aria-label="引用"
          className={styles["selection-toolbar__button"]}
          onMouseDown={preserveSelection}
          onClick={handleQuote}
        >
          <RollbackOutlined />
          引用
        </button>
        <button
          type="button"
          aria-label="复制"
          className={styles["selection-toolbar__button"]}
          onMouseDown={preserveSelection}
          onClick={handleCopy}
        >
          <CopyOutlined />
          复制
        </button>
      </div>
    );
  }
);
