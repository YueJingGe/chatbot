import { memo } from "react";

interface ScrollToBottomButtonProps {
  visible: boolean;
  onClick: () => void;
}

const ScrollToBottomButton = memo(({ visible, onClick }: ScrollToBottomButtonProps) => {
  const className = visible
    ? "scroll-to-bottom-button"
    : "scroll-to-bottom-button scroll-to-bottom-button--hidden";

  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      aria-label="回到底部"
      aria-hidden={!visible}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 5v14M19 12l-7 7-7-7" />
      </svg>
    </button>
  );
});

ScrollToBottomButton.displayName = "ScrollToBottomButton";

export default ScrollToBottomButton;
