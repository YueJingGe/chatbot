# CSS 写法参考

> 详细写法参考，红线看 `docs/harness/frontend-rules.md` 的 CSS 章节。

## 样式技术栈

|类型|后缀|用途|
|-|-|-|
|组件样式|`.module.less`|局部作用域，配合 Less 变量/嵌套|
|全局样式|`.css`|仅基础重置、`:root` 变量定义|

## Less 变量（Design Tokens）

定义在 `web/src/index.css` 的 `:root`：

```css
:root {
  --color-primary: #4f46e5;
  --color-bg: #ffffff;
  --color-text: #111827;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --radius-md: 8px;
}
```

组件中使用：

```less
.button {
  background: var(--color-primary);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
}
```

## BEM 命名

格式与约束见 [naming.md](naming.md) 的 BEM 三段式章节。本项目示例：

```less
.message-list {
  &__item {
    &--user {
      background: var(--color-bg);
    }
    &--assistant {
      background: var(--color-bg-alt);
    }
  }
}
```

## Less 嵌套 + 媒体查询

```less
.input-area {
  display: flex;
  gap: var(--space-sm);
  @media (max-width: 768px) {
    flex-direction: column;
  }
}
```
