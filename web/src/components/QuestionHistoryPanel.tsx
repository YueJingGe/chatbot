import { memo, useState, useCallback } from "react";
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

  return (
    <div className={styles.panel} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {/* 初始态：右边缘小横线标记 */}
      <div className={styles["panel__trigger"]}>
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
                <div className={styles["panel__item"]} onClick={() => handleClick(q.id)}>
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
