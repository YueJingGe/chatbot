import { useCallback, useEffect, useState } from "react";

/** 弹层消费的选区状态：选中文本、定位矩形、可见性 */
export interface TextSelectionState {
  text: string;
  rect: DOMRect | null;
  visible: boolean;
}

interface UseTextSelectionOptions {
  /** 选区起点必须落在该选择器匹配的容器内才触发显示 */
  allowedSelector?: string;
}

const HIDDEN_STATE: TextSelectionState = { text: "", rect: null, visible: false };

/**
 * 监听文档选区：mouseup 完成选择时评估有效性（非空 + 起点在允许容器内），
 * selectionchange 塌陷（点击空白等）时隐藏；hide() 供业务层主动关闭。
 */
export function useTextSelection({ allowedSelector }: UseTextSelectionOptions = {}) {
  const [state, setState] = useState<TextSelectionState>(HIDDEN_STATE);

  const evaluateSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      setState(HIDDEN_STATE);
      return;
    }
    const text = selection.toString();
    // 纯空白选区（如拖过空隙）不触发弹层
    if (!text.trim()) {
      setState(HIDDEN_STATE);
      return;
    }
    const { anchorNode } = selection;
    if (allowedSelector) {
      const anchorElement =
        anchorNode instanceof Element ? anchorNode : (anchorNode?.parentElement ?? null);
      if (!anchorElement?.closest(allowedSelector)) {
        setState(HIDDEN_STATE);
        return;
      }
    }
    setState({ text, rect: selection.getRangeAt(0).getBoundingClientRect(), visible: true });
  }, [allowedSelector]);

  const hide = useCallback(() => {
    setState(HIDDEN_STATE);
  }, []);

  useEffect(() => {
    const handleMouseUp = () => {
      evaluateSelection();
    };
    // 选区塌陷（点击空白清空选区）时收起；拖动选择中的 selectionchange 不处理，等 mouseup 统一评估
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setState(HIDDEN_STATE);
      }
    };
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [evaluateSelection]);

  return { ...state, hide };
}
