# React 组件规范

> 通用规范看外链；本项目特有约定见下。
>
> 编码红线（必须遵守）见 [`docs/harness/frontend-rules.md`](../harness/frontend-rules.md)。

## 通用规范外链

- [airbnb/react](https://github.com/airbnb/javascript/tree/master/react)
- [react.dev](https://react.dev)

## 本项目特有约定

### 1. 组件目录与文件组织

每个组件一个独立目录，文件命名固定：

```text
components/<ComponentName>/
├── index.tsx          # 组件入口
├── index.module.less  # 组件样式（CSS Modules）
└── index.test.tsx     # 组件测试（存在时）
```

示例：

- [`web/src/components/MessageList/index.tsx`](../../web/src/components/MessageList/index.tsx)
- [`web/src/components/MessageList/index.module.less`](../../web/src/components/MessageList/index.module.less)
- [`web/src/components/MessageList/index.test.tsx`](../../web/src/components/MessageList/index.test.tsx)

### 2. 命名导出与默认导出

- **叶子组件**使用命名导出：

```tsx
export function MessageList({ messages }: MessageListProps) {
  // ...
}
```

- **根组件 `App.tsx`** 允许命名导出 + 默认导出兼容，便于 `main.tsx` 直接导入：

```tsx
export function App() {
  // ...
}

export default App;
```

> 命名导出满足 `frontend-rules.md` 的"禁止匿名默认导出"；保留 `export default App` 是为了不破坏 `main.tsx` 的现有导入方式。

### 3. Props 必须解构

禁止 `props.xxx` 写法，props 在函数参数处直接解构：

```tsx
interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  // ...
}
```

### 4. memo 与 useCallback 配合使用

叶子组件必须 `React.memo`，传给子组件的 callback 必须 `useCallback`：

```tsx
import { memo, useCallback } from "react";

export const InputArea = memo(function InputArea({ onSend }: InputAreaProps) {
  const handleClick = useCallback(() => {
    onSend();
  }, [onSend]);

  return <button onClick={handleClick}>发送</button>;
});
```

### 5. 内部辅助组件（SVG 图标等）

组件文件内可以定义纯展示型辅助函数（如 SVG 图标），它们不接收 props、不触发重渲染，**不需要**包裹 `React.memo`：

```tsx
function CopyIcon() {
  return (
    <svg aria-hidden="true" width="14" height="14">
      {/* ... */}
    </svg>
  );
}
```

> 如果辅助组件接收 props 或参与条件渲染，建议抽到独立文件并加 `memo`。

### 6. 状态归属原则

- 会话级数据 → `useConversation` hook；
- 全局 UI 状态 → `App.tsx`；
- 组件内部临时状态 → 组件自己管理；
- 状态放在使用它的最近公共父组件，避免无意义 props 透传。

示例：

|状态|位置|原因|
|:-|:-|:-|
|`messages`|`App`（通过 `useConversation`）|全局唯一，会话切换整体替换|
|`inputText` / `isLoading`|`App`|临时 UI 状态|
|`expanded`|`QuestionHistoryPanel`|仅组件内部使用|

### 7. 事件处理命名

用户交互响应统一用 `handleXxx`：

```tsx
const handleSendMessage = useCallback(() => { ... }, []);
const handleScroll = useCallback(() => { ... }, []);
```

### 8. CSS Module 使用

组件样式使用 `./index.module.less`，通过 `styles` 对象引用类名：

```tsx
import styles from "./index.module.less";

export function MessageList() {
  return <div className={styles.container}>...</div>;
}
```

```less
.container {
  padding: var(--space-md);
}
```

> 禁止在 `.module.less` 中写全局选择器；全局样式和 CSS 变量写在 `web/src/index.css`。

### 9. 测试文件同目录

组件测试与被测源码同目录，命名为 `index.test.tsx`：

```text
components/MessageList/
├── index.tsx
├── index.module.less
└── index.test.tsx
```

测试优先使用 `@testing-library/react` 的 `render` / `user-event`，面向用户行为断言，不验证 CSS Module 哈希或私有 state。

### 10. 导入顺序

组内按以下顺序，组间空一行：

1. React / 核心库
2. 第三方库
3. 项目内组件 / hooks / utils
4. 样式

```tsx
import { memo, useCallback } from "react";
import { message } from "antd";
import ReactMarkdown from "react-markdown";

import { copyToClipboard } from "../../utils/copy";
import { stripMarkdown } from "../../utils/markdown";
import styles from "./index.module.less";
```
