---
name: harmony-frontend-adaptation
description: 当新增、修改或排查 Harmony PC Native、Harmony PC Web、Harmony Phone Web 的终端判断、PC/H5 分流或 Native API 能力检测与降级时使用。不要用于 HAP 安装、HDC、代理证书或单纯的实机 CDP 操作。
---

# Harmony 前端适配

围绕公共终端判断、实际分流点和 Native 能力检测定位 Harmony 兼容问题。本 Skill 编排工作流，具体规则与示例以参考指南为准。

## 开始前

1. 阅读当前目标目录适用的 `AGENTS.md`。
2. 完整阅读 [`docs/reference/harmony-pc-frontend-adaptation.md`](../../../docs/reference/harmony-pc-frontend-adaptation.md)，确认当前项目能力边界及终端、布局和 Native 检测规则。
3. 先确认用户要的是只读分析、代码修改还是实机验证；只读请求不得顺手修改代码。

## 公共入口

源码位置为 [`web/src/utils/browser.ts`](../../../web/src/utils/browser.ts)。导入路径须相对于调用文件，示例及各导出语义见指南第 1 节；不要把文档链接直接复制成业务代码的 import。

## 修改流程

### 平台或布局误判

1. 收集当前 UA、无参 `getHarmonyTerminal()` 的结果、宿主模板信号以及视口信息，按指南第 1 节区分终端识别与布局问题。
2. 检查调用方是否绕过公共方法，或根本尚未接入分流；同时检查 CSS 媒体查询。没有调用方接入时，不把工具已存在当成分流已生效。
3. 按指南第 2 节只修改已确认的分流点，保留未识别终端的原有处理；用户未要求接入时不扩展业务。

### 请求或对话返回异常

若排查中发现请求异常，先按指南第 3 节核对真实请求与 SSE 响应，再回到仓库前后端流程定位；不要把纯请求问题自动归因于 Harmony。外部项目的鉴权、埋点和 CMS 协议不属于本 Skill 的实施范围。

### Native API 异常

1. 按指南第 4 节的类型安全示例，从 `globalThis` 检查具体方法，不直接访问可能未声明的 namespace。
2. 记录问题属于 namespace 缺失、method 缺失、pending 还是 reject；pending 时结合客户端日志核查 IPC channel 与回包，不凭现象断言原因。
3. 用户要求接入 Native 调用时，确认真实接口签名，并按指南提供超时和 Web 降级；本 Skill 不负责安装或操控实机。

## 验证与交付

- 修改 `js/ts/jsx/tsx` 后，按仓库规则对触达文件执行 ESLint autofix，再运行最小单测或类型检查。
- 按指南第 6 节验证本次涉及的识别、模板信号、业务分流或 Native 降级场景；逻辑改动执行仓库 TDD，视觉或交互改动执行视觉验证。
- 区分“工具测试通过”和“业务/宿主已接入”，未实现的能力明确列出。
- 最终结论先写当前终端和直接证据，再写问题所属前端、客户端或服务端，以及最小下一步；不要只给可能性列表。
