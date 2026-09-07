import { memo, useState, useCallback, KeyboardEvent } from "react";
import { Tooltip, Empty } from "antd";
import styles from "./QuestionHistoryPanel.module.less";

interface QuestionItem {
  id: string;
  content: string;
}

interface QuestionHistoryPanelProps {
  questions: QuestionItem[];
  onSelectQuestion: (messageId: string) => void;
}

const QuestionHistoryPanel = memo(({ questions, onSelectQuestion }: QuestionHistoryPanelProps) => {
  const [expanded, setExpanded] = useState(false);

  const handleMouseEnter = useCallback(() => {
    setExpanded(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setExpanded(false);
  }, []);

  const handleClick = useCallback(
    (id: string) => {
      onSelectQuestion(id);
    },
    [onSelectQuestion]
  );

  const handleItemKeyDown = useCallback(
    (e: KeyboardEvent, id: string) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSelectQuestion(id);
      }
    },
    [onSelectQuestion]
  );

  return (
    <div
      className={styles.panel}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {/* 初始态：右边缘小横线标记 */}
      <div className={styles["panel__trigger"]} role="button" tabIndex={0}>
        {questions.map((q) => (
          <span key={q.id} className={styles["panel__dash"]}>
            —
          </span>
        ))}
      </div>

      {/* 展开面板 */}
      {expanded && (
        <div className={styles["panel__content"]}>
          {questions.length === 0 ? (
            <Empty description="暂无提问" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            questions.map((q) => (
              <Tooltip key={q.id} title={q.content} placement="left">
                <div
                  className={styles["panel__item"]}
                  onClick={() => handleClick(q.id)}
                  onKeyDown={(e) => handleItemKeyDown(e, q.id)}
                  role="button"
                  tabIndex={0}
                >
                  {q.content}
                </div>
              </Tooltip>
            ))
          )}
        </div>
      )}
    </div>
  );
});

QuestionHistoryPanel.displayName = "QuestionHistoryPanel";

export { QuestionHistoryPanel };
