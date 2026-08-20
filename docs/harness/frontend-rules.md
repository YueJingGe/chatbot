# 前端编码红线

> 写前端代码时必读。

## 格式

|规则|说明|
|-|-|
|缩进|2 空格，禁止 Tab|
|引号|双引号|
|分号|有分号风格|
|变量声明|禁止 `var`，用 `const`/`let`|
|import 顺序|React → 第三方库 → 组件 → 样式，组间空一行|

## 组件

|规则|说明|
|-|-|
|叶子组件必须 `React.memo`|避免无效重渲染|
|传给子组件的 callback 必须 `useCallback`|配合 memo 生效|
|禁止 JSX 中传内联对象/函数|导致 memo 失效|
|组件使用命名导出|`export { ComponentName }`，禁止匿名默认导出|
|props 必须解构|禁止 `props.xxx` 写法|

## 状态管理

|规则|说明|
|-|-|
|状态就近原则|状态放在使用它的最近公共父组件，避免不必要的 props 透传|
|复杂状态可引入状态管理库|MobX/Zustand 等，需评估必要性|
|涉及前值用函数式更新|`setX(prev => ...)`|
|异步回调用 `useRef` 保持最新值|避免闭包陷阱|

## TypeScript

|规则|说明|
|-|-|
|禁止 `any`|包括显式和隐式|
|禁止 `non-null` 断言（`!`）|除非确实必要|
|组件 props 接口以 `Props` 结尾|`MessageListProps`|

## CSS

|规则|说明|
|-|-|
|使用 CSS 变量（Design Tokens）|定义在 `:root`|
|BEM 命名，类名 kebab-case|`.block__element--modifier`|
|禁止 CSS-in-JS|styled-components/Emotion|
|禁止直接写颜色值|必须用 CSS 变量，否则改主题困难|
|禁止在 `.module.less` 写全局选择器|破坏局部作用域|

## 列表渲染

|规则|说明|
|-|-|
|必须提供稳定唯一的 `key`|禁止数组索引|

## 前端安全

|规则|说明|
|-|-|
|禁止 `dangerouslySetInnerHTML`|除非配合 DOMPurify|
|禁止在前端代码中出现 API key|前端会被打包发送到浏览器|
