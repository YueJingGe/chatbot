# 📋 代码规范

## 📖 文档说明

本文档定义了 AI 对话机器人项目（chatbot）的代码规范，旨在提高代码质量、可维护性和团队协作效率。

### 🎯 适用范围

- TypeScript 项目（前端 `web/`）
- React 19 单页应用
- Node.js + Express 5 后端（`server/`）
- SSE（Server-Sent Events）流式通信
- npm workspaces 单仓库管理

### 📋 规范等级

- **✅ 推荐 (Good)**: 建议遵循的最佳实践
- **❌ 不推荐 (Bad)**: 应该避免的写法
- **🎯**: 重点说明和核心概念
- **🚨**: 常见错误和注意事项

---

## 📚 目录

- [📋 代码规范](#-代码规范)
  - [📖 文档说明](#-文档说明)
  - [📚 目录](#-目录)
  - [🏷️ 命名规范](#️-命名规范)
    - [📁 文件和目录命名](#-文件和目录命名)
    - [变量和函数命名](#变量和函数命名)
  - [TypeScript 规范](#typescript-规范)
  - [React 组件规范](#react-组件规范)
    - [组件定义和导出](#组件定义和导出)
    - [组件状态管理](#组件状态管理)
    - [Hooks 使用规范](#hooks-使用规范)
  - [CSS 规范](#css-规范)
    - [CSS 变量（Design Tokens）](#css-变量design-tokens)
    - [BEM 命名风格](#bem-命名风格)
    - [响应式规范](#响应式规范)
  - [后端规范](#后端规范)
    - [SSE 流式响应](#sse-流式响应)
    - [环境变量管理](#环境变量管理)
  - [项目结构规范](#项目结构规范)
    - [目录组织](#目录组织)
    - [导入规范](#导入规范)
  - [安全红线](#安全红线)
  - [性能规范](#性能规范)
    - [React.memo 使用规范](#reactmemo-使用规范)
    - [useCallback 使用规范](#usecallback-使用规范)
    - [状态更新规范](#状态更新规范)
  - [注释和文档规范](#注释和文档规范)

---

## 🏷️ 命名规范

### 📁 文件和目录命名

**总体原则**: 组件文件与组件名一致（PascalCase），功能文件使用 kebab-case。

**✅ 推荐的命名规范**

```
web/src/
├── App.tsx               # 主组件
├── App.css               # 主组件样式
├── main.tsx              # 入口文件
├── index.css             # 全局重置样式
├── vite-env.d.ts         # Vite 类型声明
└── components/
    ├── MessageList.tsx   # 消息列表组件
    ├── MessageList.css   # 组件样式（按需）
    └── InputArea.tsx     # 输入区域组件
```

**❌ 不推荐 (Bad)**

```
# 组件文件使用 kebab-case
message-list.tsx

# 组件文件使用 snake_case
message_list.tsx

# 随意命名
chat.tsx
messages.tsx
```

### 变量和函数命名

| 类型       | 规范          | 示例                                  |
| ---------- | ------------- | ------------------------------------- |
| 组件       | `PascalCase`  | `MessageList`, `InputArea`            |
| 函数/变量  | `camelCase`   | `sendMessage`, `isLoading`            |
| 接口/类型  | `PascalCase`  | `Message`, `MessageListProps`         |
| 常量       | `UPPER_SNAKE` | `REQUEST_TIMEOUT`, `PORT`             |
| 事件处理   | `handleXxx`   | `handleKeyPress`, `handleSend`        |

**✅ 推荐 (Good)**

```typescript
// 语义清晰的变量名
const messagesEndRef = useRef<HTMLDivElement>(null);
const abortControllerRef = useRef<AbortController | null>(null);
const scrollToBottom = useCallback(() => { /* ... */ }, []);

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
const h = (e) => { /* ... */ };

// 缺少类型标注
const messages = [];
```

---

## TypeScript 规范

### 类型和接口命名

**✅ 推荐 (Good)**

```typescript
// 接口命名：PascalCase + Props 后缀
interface InputAreaProps {
  inputText: string;
  setInputText: (value: string) => void;
  isLoading: boolean;
  sendMessage: () => void;
  handleKeyPress: (e: KeyboardEvent<HTMLInputElement>) => void;
}

// 使用具体类型而非 any
const messagesEndRef = useRef<HTMLDivElement>(null);

// 联合类型
type MessageRole = "user" | "assistant";

// 可选属性
interface Message {
  id: string | number;
  role: string;
  content?: string;
}
```

**❌ 不推荐 (Bad)**

```typescript
// 使用 any
const data: any = await fetch("/api");

// 隐式 any
function handleSend(msg) { /* ... */ }

// 不明确的类型
type Data = any;
```

### 严格模式

- `tsconfig.json` 中启用严格模式
- 禁止隐式 `any`
- 禁止 `non-null` 断言（`!`），除非确实必要

---

## React 组件规范

### 组件定义和导出

**✅ 推荐 (Good)**

```typescript
import { memo, KeyboardEvent } from "react";

interface InputAreaProps {
  inputText: string;
  setInputText: (value: string) => void;
  isLoading: boolean;
  sendMessage: () => void;
  handleKeyPress: (e: KeyboardEvent<HTMLInputElement>) => void;
}

const InputArea = memo(({ inputText, setInputText, isLoading, sendMessage, handleKeyPress }: InputAreaProps) => {
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
});

export default InputArea;
```

**要点**：
- 函数式组件 + `React.memo` + props 解构 + 默认导出
- 组件接口以 `Props` 结尾
- 所有叶子组件必须使用 `React.memo`

**❌ 不推荐 (Bad)**

```typescript
// 不使用 memo
const InputArea = ({ inputText }) => {
  return <input value={inputText} />;
};
export { InputArea }; // 命名导出

// 不写类型
const InputArea = (props) => {
  return <input value={props.inputText} />;
};
```

### 组件状态管理

**✅ 推荐 (Good)**

```typescript
// 状态集中在 App.tsx 中管理
function App() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, role: "assistant", content: "你好！我是你的AI助手。" },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 使用 ref 保持最新值
  const messagesRef = useRef(messages);
  const inputTextRef = useRef(inputText);
  const isLoadingRef = useRef(isLoading);

  useEffect(() => {
    messagesRef.current = messages;
    inputTextRef.current = inputText;
    isLoadingRef.current = isLoading;
  }, [messages, inputText, isLoading]);

  // ...
}
```

**🎯 核心原则**

1. 单页应用，`App.tsx` 集中管理所有状态
2. 不使用 Redux、Zustand、MobX 等状态管理库
3. 使用 `ref` 保持最新状态值，避免闭包陷阱
4. 通过 props 向下传递状态和回调

### Hooks 使用规范

**✅ 推荐 (Good)**

```typescript
// useCallback 包裹回调函数
const sendMessage = useCallback(async () => {
  const textToSend = inputTextRef.current.trim();
  if (!textToSend || isLoadingRef.current) return;
  // ...
}, []);

const handleKeyPress = useCallback(
  (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  },
  [sendMessage]
);

// 函数式更新
setMessages((prev) => [...prev, newUserMessage]);

// ref 保持最新值
const messagesRef = useRef(messages);
useEffect(() => {
  messagesRef.current = messages;
}, [messages]);
```

**❌ 不推荐 (Bad)**

```typescript
// 不使用 useCallback，导致子组件 React.memo 失效
const sendMessage = async () => { /* ... */ };

// 直接读取状态（闭包陷阱）
const sendMessage = async () => {
  if (isLoading) return; // 可能读到旧值
};

// 不使用函数式更新
setMessages([...messages, newUserMessage]); // messages 可能是旧值
```

---

## CSS 规范

### CSS 变量（Design Tokens）

**✅ 推荐 (Good)**

```css
:root {
  /* 配色 */
  --color-primary: #C2785C;
  --color-primary-hover: #A8634A;
  --color-bg: #F5F5F5;
  --color-text: #1A1A1A;
  --color-text-secondary: #666666;
  --color-text-muted: #999999;

  /* 间距（8px 基准） */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;

  /* 圆角 */
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-full: 50%;

  /* 过渡 */
  --transition-fast: 150ms ease-out;
  --transition-normal: 250ms ease-out;

  /* 阴影 */
  --shadow-card: 0 2px 20px rgba(0, 0, 0, 0.06);
}
```

**🎯 核心原则**

1. 所有颜色、间距、圆角、过渡等使用 CSS 变量
2. 变量定义在 `:root` 中
3. 间距以 8px 为基准（4/8/16/24/32）
4. 不使用 CSS-in-JS（styled-components、Emotion 等）

### BEM 命名风格

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

/* Element Modifier */
.send-button--loading {
  position: relative;
}
```

**❌ 不推荐 (Bad)**

```css
/* 语义不清晰 */
.container .wrapper .btn { }

/* 过度嵌套 */
.app > main > .input > .btn { }
```

### 响应式规范

**✅ 推荐 (Good)**

```css
/* 移动端优先，使用 max-width 断点 */
@media (max-width: 900px) {
  /* 平板 */
  .container {
    width: 100%;
    max-width: 820px;
  }
}

@media (max-width: 480px) {
  /* 手机 */
  .container {
    height: 100vh;
    border-radius: 0;
  }
}

/* 尊重用户减弱动效偏好 */
@media (prefers-reduced-motion: reduce) {
  .message {
    animation: none;
  }
}
```

---

## 后端规范

### SSE 流式响应

**✅ 推荐 (Good)**

```javascript
app.post("/api/chat", async (req, res) => {
  // 1. 设置流式响应头
  res.setHeader("Content-Type", "text/event-stream;charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    // 2. 发起流式请求（带超时控制）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const stream = await openai.chat.completions.create({
      model: process.env.MODEL_NAME,
      messages: userMessages,
      stream: true,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // 3. 流式返回数据给前端
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        res.write(`data: ${JSON.stringify({ chunk: content })}\n\n`);
      }
    }
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    } else {
      res.write(`data: ${JSON.stringify({ error: "处理中断" })}\n\n`);
      res.end();
    }
  }
});
```

**🎯 核心原则**

1. 使用 `text/event-stream` 内容类型
2. 使用 `for await...of` 消费流
3. 必须设置超时控制（`AbortController`）
4. 必须处理 headersSent 状态
5. 流结束发送 `[DONE]` 标志

### OpenAI 客户端单例

**✅ 推荐 (Good)**

```javascript
// 模块级单例，复用连接
const openai = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  baseURL: process.env.DASHSCOPE_BASE_URL,
});
```

**❌ 不推荐 (Bad)**

```javascript
// 每次请求创建新实例
app.post("/api/chat", async (req, res) => {
  const openai = new OpenAI({ /* ... */ }); // 浪费连接
});
```

### 环境变量管理

**✅ 推荐 (Good)**

```javascript
require("dotenv").config();

// 校验必需的环境变量
const requiredEnv = ["DASHSCOPE_API_KEY", "DASHSCOPE_BASE_URL", "MODEL_NAME"];
const missingEnv = requiredEnv.filter((name) => !process.env[name]);
if (missingEnv.length > 0) {
  console.error(`缺少必需的环境变量: ${missingEnv.join(", ")}`);
  process.exit(1);
}

// 使用环境变量
const openai = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  baseURL: process.env.DASHSCOPE_BASE_URL,
});
```

**❌ 不推荐 (Bad)**

```javascript
// 硬编码密钥
const openai = new OpenAI({
  apiKey: "sk-xxxxxxxx", // 绝对禁止
});
```

---

## 项目结构规范

### 目录组织

```
chatbot/
├── AGENTS.md              # Agent 规范
├── package.json           # npm workspaces 根配置
├── server/                # 后端（Express, 端口 3000）
│   ├── .env               # API 密钥（gitignored）
│   ├── .env.example
│   ├── package.json
│   └── server.js          # 主服务器
└── web/                   # 前端（React + Vite, 端口 5173）
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── index.html
    ├── eslint.config.ts
    └── src/
        ├── App.tsx        # 主组件（状态中心 + SSE 消费）
        ├── App.css
        ├── main.tsx       # 入口文件
        ├── index.css      # 全局重置样式
        ├── vite-env.d.ts
        └── components/
            ├── MessageList.tsx
            └── InputArea.tsx
```

### 导入规范

**✅ 推荐 (Good)**

```typescript
// React 导入
import { memo, useState, useCallback, KeyboardEvent } from "react";

// 组件导入
import MessageList from "./components/MessageList";
import InputArea from "./components/InputArea";

// 样式导入
import "./App.css";
```

**❌ 不推荐 (Bad)**

```typescript
// 混乱的导入顺序
import "./App.css";
import MessageList from "./components/MessageList";
import { memo } from "react";

// 通配符导入
import * as Components from "./components";
```

---

## 安全红线

以下规则为绝对禁止，无任何例外：

| 红线                          | 说明                                                                  |
| ----------------------------- | --------------------------------------------------------------------- |
| 硬编码密钥/Token              | 所有 API Key 必须通过 `.env` + `process.env` 读取                     |
| `dangerouslySetInnerHTML`     | 禁止使用，除非配合 `DOMPurify` 消毒                                   |
| `eval()` / `new Function()`   | 禁止动态执行代码                                                      |
| `var` 声明                    | 禁止使用 `var`，统一使用 `const` / `let`                              |
| 提交 `.env` 文件              | `.env` 包含敏感凭证，禁止提交到版本控制                               |

---

## 性能规范

### React.memo 使用规范

**✅ 推荐 (Good)**

```typescript
// 所有叶子组件使用 React.memo
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
```

**🎯 核心原则**

1. 所有叶子组件必须使用 `React.memo`
2. 配合 `useCallback` 避免无效重渲染
3. 列表渲染必须提供稳定唯一的 `key`，禁止使用数组索引

### useCallback 使用规范

**✅ 推荐 (Good)**

```typescript
// 传递给子组件的 callback 必须使用 useCallback
const handleKeyPress = useCallback(
  (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  },
  [sendMessage]
);
```

**❌ 不推荐 (Bad)**

```typescript
// 不使用 useCallback，子组件 React.memo 失效
const handleKeyPress = (e) => {
  if (e.key === "Enter") sendMessage();
};
```

### 状态更新规范

**✅ 推荐 (Good)**

```typescript
// 涉及前值时使用函数式更新
setMessages((prev) => [...prev, newUserMessage]);

// 使用 ref 保持最新值
const messagesRef = useRef(messages);
useEffect(() => {
  messagesRef.current = messages;
}, [messages]);
```

**❌ 不推荐 (Bad)**

```typescript
// 直接引用状态（闭包陷阱）
setMessages([...messages, newUserMessage]);

// 在异步回调中直接读取状态
const sendMessage = async () => {
  if (isLoading) return; // 可能读到旧值
};
```

### 禁止在 JSX 中传递内联对象

**✅ 推荐 (Good)**

```typescript
// 回调使用 useCallback
const handleSend = useCallback(() => { /* ... */ }, []);

<InputArea sendMessage={handleSend} />
```

**❌ 不推荐 (Bad)**

```typescript
// 内联对象导致 React.memo 失效
<InputArea sendMessage={() => { /* ... */ }} />
```

---

## 注释和文档规范

### 代码注释

**✅ 推荐 (Good)**

```typescript
/**
 * 消息接口
 */
interface Message {
  id: string | number;
  role: string;
  content: string;
}

// 使用 ref 保持最新值，避免闭包陷阱
const messagesRef = useRef(messages);

// 设置流式响应头
res.setHeader("Content-Type", "text/event-stream;charset=utf-8");
```

**❌ 不推荐 (Bad)**

```typescript
// 无用的注释
// 获取消息
const messages = await fetchMessages();

// 过时的注释
// 这个函数用于登录（实际是发送消息）
async function sendMessage(message: string) { /* ... */ }
```

---

## ESLint 配置规范

本项目使用 ESLint 9 Flat Config 格式：

```typescript
import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";

export default [
  { ignores: ["dist", ".history"] },
  js.configs.recommended,
  tsPlugin.configs.recommended,
  reactHooks.configs.recommended,
  reactRefresh.configs.vite,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 2020,
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
];
```

**🎯 核心原则**

1. 预设配置（`js.configs.recommended` 等）作为独立配置项放入顶层数组
2. 自定义规则覆盖放在单独的 config 对象中
3. 不使用 `.rules` 链式访问预设配置的规则

---

> **最后更新**：2026-08-12 | 本文档随项目架构演进同步更新。
