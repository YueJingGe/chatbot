import { memo, useCallback, KeyboardEvent } from "react";
import { Button, List } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import type { Conversation } from "../types/conversation";
import styles from "./ConversationSidebar.module.less";

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeId: string;
  onNewConversation: () => void;
  onSelectConversation: (id: string) => void;
}

const ConversationSidebar = memo(
  ({
    conversations,
    activeId,
    onNewConversation,
    onSelectConversation,
  }: ConversationSidebarProps) => {
    const handleNew = useCallback(() => {
      onNewConversation();
    }, [onNewConversation]);

    const handleSelect = useCallback(
      (id: string) => {
        onSelectConversation(id);
      },
      [onSelectConversation]
    );

    const handleItemKeyDown = useCallback(
      (e: KeyboardEvent, id: string) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelectConversation(id);
        }
      },
      [onSelectConversation]
    );

    return (
      <aside className={styles.sidebar}>
        <div className={styles["sidebar__header"]}>
          <Button type="default" icon={<PlusOutlined />} onClick={handleNew} block>
            新建对话
          </Button>
        </div>

        <div className={styles["sidebar__content"]}>
          <div className={styles["sidebar__sectiontitle"]}>最近对话</div>
          <List
            size="small"
            dataSource={conversations}
            renderItem={(item: Conversation) => (
              <List.Item
                className={`${styles["sidebar__item"]} ${item.id === activeId ? styles["sidebar__item--active"] : ""}`}
                onClick={() => handleSelect(item.id)}
                onKeyDown={(e) => handleItemKeyDown(e, item.id)}
                role="button"
                tabIndex={0}
              >
                <span className={styles["sidebar__itemtext"]}>{item.title}</span>
              </List.Item>
            )}
          />
        </div>
      </aside>
    );
  }
);

ConversationSidebar.displayName = "ConversationSidebar";

export { ConversationSidebar };
