# React 组件规范

> 通用规范看外链；本项目特有约定见下。

## 通用规范外链

- [airbnb/react](https://github.com/airbnb/javascript/tree/master/react)
- [react.dev](https://react.dev)

## 本项目特有约定

|规则|说明|
|-|-|
|叶子组件必须 `React.memo`|避免无效重渲染|
|传给子组件的 callback 必须 `useCallback`|配合 memo 生效|
|禁止 JSX 中传内联对象/函数|导致 memo 失效|
|组件命名导出|`export { ComponentName }`，禁止匿名默认导出|
|props 必须解构|禁止 `props.xxx` 写法|
|涉及前值用函数式更新|`setX(prev => ...)`|
|异步回调用 `useRef` 保持最新值|避免闭包陷阱|
|列表 key 稳定唯一|禁止数组索引|
|import 顺序：React → 第三方库 → 组件 → 样式|组间空一行|
|禁止 `any` / `non-null` 断言|`!` 除非确实必要|
|组件 props 接口以 `Props` 结尾|`MessageListProps`|
