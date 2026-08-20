# 命名规范

> 需要命名参考时读此文件。

## 文件与目录

|类别|格式|示例|
|-|-|-|
|目录|kebab-case|`components/`、`exec-plans/`|
|组件文件|PascalCase.tsx|`MessageList.tsx`|
|组件样式|PascalCase.module.less|`MessageList.module.less`|
|工具文件|camelCase.js/ts|`weather.js`|
|配置文件|kebab-case|`vite.config.ts`|
|文档|kebab-case.md|`docs/harness/frontend-rules.md`|

## 代码

|类别|格式|示例|
|-|-|-|
|组件名|PascalCase|`MessageList`|
|函数/变量|camelCase|`sendMessage`、`isLoading`|
|接口/类型|PascalCase|`Message`、`MessageListProps`|
|常量|UPPER_SNAKE|`REQUEST_TIMEOUT`|
|事件处理|handleXxx|`handleKeyPress`|

### 布尔值命名

|前缀|用途|示例|
|-|-|-|
|`is`|状态判断|`isLoading`、`isTyping`|
|`has`|拥有判断|`hasMessages`、`hasError`|
|`can`|能力判断|`canSendMessage`|
|`should`|条件判断|`shouldAutoScroll`|

### 数据操作命名

|动词|用途|示例|
|-|-|-|
|`fetch`|从远程获取数据|`fetchUserInfo`|
|`load`|加载资源或初始化|`loadComponent`|
|`get`|获取已有/缓存数据|`getUserFromCache`|
|`save`|保存到服务器|`saveChatHistory`|
|`create`|创建|`createConversation`|
|`update`|更新|`updateProfile`|
|`delete/remove`|删除|`deleteMessage`|
|`toggle`|切换|`toggleSidebar`|
|`reset`|重置|`resetChatInput`|
|`clear`|清空|`clearInput`|

### UI 状态控制命名

|状态类型|命名规范|示例|
|-|-|-|
|显示/隐藏|`show/hide`|`showSidebar`、`hideTooltip`|
|打开/关闭|`open/close`|`openModal`、`closePanel`|
|展开/折叠|`expand/collapse`|`expandHistory`、`collapseMenu`|
|启用/禁用|`enable/disable`|`enableNotification`|

### 事件处理命名

|前缀|用途|示例|
|-|-|-|
|`handle`|用户交互响应|`handleSendMessage`|
|`on`|生命周期/系统事件|`onMount`、`onSessionEnd`|

### 数据验证命名

|前缀|用途|示例|
|-|-|-|
|`validate`|格式/规则检查|`validateInput`|
|`check`|状态/权限检查|`checkPermission`|
|`verify`|安全验证|`verifyToken`|

### 组件状态命名

|前缀|用途|示例|
|-|-|-|
|`active`|当前激活|`activeTab`|
|`selected`|用户选中|`selectedMessages`|
|`current`|当前处理项|`currentSession`|

### 集合数据命名

|后缀|用途|示例|
|-|-|-|
|`list`|有序列表|`messageList`|
|`items`|功能项目组|`menuItems`|
|`data`|原始数据|`responseData`|

### 错误处理命名

|后缀|用途|示例|
|-|-|-|
|`error`|一般错误|`chatError`|
|`failure`|操作失败|`handleSendFailure`|

## CSS

|类别|格式|示例|
|-|-|-|
|CSS 类|kebab-case + BEM|`.input-area`、`.send-button--loading`|
|CSS 变量|`--kebab-case`|`--color-primary`、`--space-md`|

## Git

|类别|格式|示例|
|-|-|-|
|分支|type/description|`feat/weather-api`、`fix/scroll-bug`|
|提交|type: description|`feat: 添加天气查询`、`fix: 修复滚动问题`|

### 提交类型

|类型|说明|
|-|-|
|feat|新功能|
|fix|修复 bug|
|docs|文档更新|
|style|代码格式|
|refactor|重构|
|chore|构建/依赖|

## 代码迁移命名

|后缀|用途|示例|
|-|-|-|
|`Legacy`|原样保留的旧版本|`MessageListLegacy.tsx`|
|`Next`|重构后的新版本|`MessageListNext.tsx`|

**禁止使用的后缀**：`New`（语义模糊）、`Old`（不如 `Legacy` 明确）、`Updated`（不知道更新了什么）。
