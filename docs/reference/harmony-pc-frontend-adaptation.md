# Harmony PC 前端适配指南（已迁移）

本指南已整合到 [前端设备与平台适配指南](./platform-frontend-adaptation.md)。Harmony 真实 UA、终端优先级、UU 浏览器与模板兜底规则见 [Harmony 专项](./platform-frontend-adaptation.md#6-harmony-专项)。

公共工具位于 [`web/src/utils/browser.ts`](../../web/src/utils/browser.ts)，对外仅提供 `detectPlatform()` / `getPlatformInfo()` 两个入口，契约见 [公共接口与输入契约](./platform-frontend-adaptation.md#2-公共接口与输入契约)。

配套 Skill 已更名为 [platform-frontend-adaptation](../../.agents/skills/platform-frontend-adaptation/SKILL.md)。本页仅保留旧路径导航，不再维护第二套适配规则。
