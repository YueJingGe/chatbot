# 命名规范

> 🎯 chatbot 项目命名规范指南，确保团队代码一致性和可维护性

## 📖 文档说明

本文档定义了 AI 对话机器人项目（chatbot）的命名规范，涵盖变量、函数、组件、文件、CSS 类等各个层面。

## 📋 目录

- [命名规范](#命名规范)
  - [📖 文档说明](#-文档说明)
  - [📋 目录](#-目录)
  - [变量和函数命名](#变量和函数命名)
    - [命名格式总则](#命名格式总则)
    - [布尔值命名](#布尔值命名)
    - [动作函数命名](#动作函数命名)
  - [事件处理命名](#事件处理命名)
  - [组件命名规范](#组件命名规范)
  - [文件命名规范](#文件命名规范)
    - [组件文件](#组件文件)
    - [目录结构](#目录结构)
  - [CSS 类命名规范](#css-类命名规范)
  - [后端命名规范](#后端命名规范)
  - [Git 提交命名](#git提交命名)

---

## 变量和函数命名

### 命名格式总则

| 类型      | 格式          | 示例                           |
| --------- | ------------- | ------------------------------ |
| 组件      | `PascalCase`  | `MessageList`, `InputArea`     |
| 函数/变量 | `camelCase`   | `sendMessage`, `isLoading`     |
| 接口/类型 | `PascalCase`  | `Message`, `MessageListProps`  |
| 常量      | `UPPER_SNAKE` | `REQUEST_TIMEOUT`, `PORT`      |
| 事件处理  | `handleXxx`   | `handleKeyPress`, `handleSend` |

**✅ 推荐 (Good)**

```typescript
// 语义清晰的变量名
const messagesEndRef = useRef<HTMLDivElement>(null);
const abortControllerRef = useRef<AbortController | null>(null);
const scrollToBottom = useCallback(() => {
  /* ... */
}, []);

// 接口命名
interface Message {
  id: string | number;
  role: string;
  content: string;
}

interface MessageListProps {
  messages: Message[];
}
```

**❌ 不推荐 (Bad)**

```typescript
// 缩写、无意义命名
const msg = useRef(null);
const msgList = [];
const h = (e) => {
  /* ... */
};

// 缺少类型标注
const messages = [];
```

### 布尔值命名

| 前缀     | 用途     | 代码示例                  |
| -------- | -------- | ------------------------- |
| `is`     | 状态判断 | `isLoading`, `isTyping`   |
| `has`    | 拥有判断 | `hasMessages`, `hasError` |
| `can`    | 能力判断 | `canSendMessage`          |
| `should` | 条件判断 | `shouldAutoScroll`        |

```typescript
// ✅ 正确示例
const [isLoading, setIsLoading] = useState(false);
const hasMessages = messages.length > 0;
const canSend = inputText.trim() !== "" && !isLoading;
```

### 动作函数命名

| 动词       | 用途 | 代码示例         |
| ---------- | ---- | ---------------- |
| `send`     | 发送 | `sendMessage`    |
| `clear`    | 清空 | `clearInput`     |
| `reset`    | 重置 | `resetChat`      |
| `scrollTo` | 滚动 | `scrollToBottom` |

```typescript
// ✅ 正确示例
const sendMessage = useCallback(async () => {
  const textToSend = inputTextRef.current.trim();
  if (!textToSend || isLoadingRef.current) return;
  // ...
}, []);

const clearInput = () => setInputText("");
const scrollToBottom = useCallback(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
}, []);
```

---

## 事件处理命名

所有用户交互事件处理函数统一使用 `handle` 前缀：

```typescript
// ✅ 正确示例
const handleKeyPress = useCallback(
  (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  },
  [sendMessage]
);

const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
  setInputText(e.target.value);
};
```

---

## 组件命名规范

### 组件分类

本项目为单页应用，组件分为两类：

| 组件类型 | 命名规范           | 代码示例                   | 使用场景            |
| -------- | ------------------ | -------------------------- | ------------------- |
| 主组件   | `App`              | `App.tsx`                  | 状态中心 + SSE 消费 |
| 叶子组件 | 名词（PascalCase） | `MessageList`, `InputArea` | 可复用的 UI 元素    |

```typescript
// ✅ 正确示例 - 叶子组件
const MessageList = memo(({ messages }: MessageListProps) => {
  return (
    <>
      {messages.map((message) => (
        <div key={message.id} className={`message ${message.role}-message`}>
          <div className="bubble">{message.content}</div>
        </div>
      ))}
    </>
  );
});

const InputArea = memo(
  ({
    inputText,
    setInputText,
    isLoading,
    sendMessage,
    handleKeyPress,
  }: InputAreaProps) => {
    return (
      <div className="input-area">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={isLoading}
        />
        <button onClick={sendMessage} disabled={isLoading}>
          发送
        </button>
      </div>
    );
  }
);
```

**要点**：

- 函数式组件 + `React.memo` + props 解构 + 默认导出
- 组件接口以 `Props` 结尾
- 所有叶子组件必须使用 `React.memo`

---

## 文件命名规范

### 组件文件

| 文件类型 | 命名规范         | 示例                      |
| -------- | ---------------- | ------------------------- |
| 组件文件 | `PascalCase.tsx` | `MessageList.tsx`         |
| 组件样式 | `PascalCase.css` | `MessageList.css`（按需） |
| 主组件   | `App.tsx`        | 状态中心                  |
| 主样式   | `App.css`        | 主组件样式                |
| 入口文件 | `main.tsx`       | React 入口                |
| 全局样式 | `index.css`      | 全局重置样式              |

### 目录结构

```
web/src/
├── App.tsx               # 主组件（状态中心 + SSE 消费）
├── App.css               # 主组件样式
├── main.tsx              # 入口文件
├── index.css             # 全局重置样式
├── vite-env.d.ts         # Vite 类型声明
└── components/
    ├── MessageList.tsx   # 消息列表组件
    └── InputArea.tsx     # 输入区域组件
```

---

## CSS 类命名规范

项目使用 **BEM 命名风格**（`block__element--modifier`），类名使用 **kebab-case**：

| 类型     | 格式               | 示例                             |
| -------- | ------------------ | -------------------------------- |
| Block    | `.block-name`      | `.input-area`, `.message`        |
| Element  | `.block__element`  | `.input-wrapper`, `.send-button` |
| Modifier | `.block--modifier` | `.send-button--loading`          |

**✅ 推荐 (Good)**

```css
/* Block */
.input-area {
  padding: var(--space-md) 0 var(--space-lg);
}

/* Element */
.input-wrapper {
  display: flex;
  gap: var(--space-sm);
}

/* Modifier */
.send-button--loading {
  position: relative;
}
```

**❌ 不推荐 (Bad)**

```css
/* 驼峰命名 */
.chatWindow {
}
.messageBubble {
}

/* 过度嵌套 */
.container .wrapper .btn {
}
```

### CSS 变量命名

所有设计令牌使用 CSS 变量，命名使用 kebab-case：

```css
:root {
  /* 配色 */
  --color-primary: #c2785c;
  --color-text: #1a1a1a;

  /* 间距（8px 基准） */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;

  /* 圆角 */
  --radius-sm: 6px;
  --radius-md: 12px;

  /* 过渡 */
  --transition-fast: 150ms ease-out;
}
```

---

## 后端命名规范

后端（`server/server.js`）使用 JavaScript，命名规范如下：

| 类型      | 格式          | 示例                              |
| --------- | ------------- | --------------------------------- |
| 变量/函数 | `camelCase`   | `openai`, `REQUEST_TIMEOUT`       |
| 常量      | `UPPER_SNAKE` | `PORT`, `REQUEST_TIMEOUT`         |
| 环境变量  | `UPPER_SNAKE` | `DASHSCOPE_API_KEY`, `MODEL_NAME` |

```javascript
// ✅ 正确示例
const PORT = process.env.PORT || 3000;
const REQUEST_TIMEOUT = parseInt(process.env.REQUEST_TIMEOUT, 10) || 60000;

const openai = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  baseURL: process.env.DASHSCOPE_BASE_URL,
});
```

---

## Git 提交命名

### 提交类型规范

| 类型       | 说明      | 示例                         |
| ---------- | --------- | ---------------------------- |
| `feat`     | 新功能    | `feat: 添加消息流式显示`     |
| `fix`      | 修复 bug  | `fix: 修复 SSE 连接断开问题` |
| `docs`     | 文档更新  | `docs: 更新 API 文档`        |
| `style`    | 代码格式  | `style: 统一代码缩进格式`    |
| `refactor` | 重构      | `refactor: 重构消息组件结构` |
| `test`     | 测试相关  | `test: 添加消息组件单元测试` |
| `chore`    | 构建/工具 | `chore: 升级依赖包版本`      |

### 分支命名规范

| 分支类型 | 命名格式          | 示例                     |
| -------- | ----------------- | ------------------------ |
| 功能分支 | `feat/功能描述`   | `feat/message-streaming` |
| 修复分支 | `fix/问题描述`    | `fix/sse-disconnect`     |
| 热修复   | `hotfix/紧急修复` | `hotfix/security-patch`  |
| 发布分支 | `release/版本号`  | `release/v1.0.0`         |

---

_本文档随项目演进同步更新。_
