<!-- 发布 PR 模板（feature → release、release → main）-->
<!-- 使用方式：开 PR 时在 URL 加 ?template=release.md -->

## 发布版本

<!-- 例：v1.3.0 -->

## 本次发布内容

<!-- 这轮发布包含哪些 feature/fix -->

-

## Code Review 门禁

- [ ] 架构：组件位置 / 职责单一 / 分层依赖
- [ ] 规范：memo / useCallback / key 稳定 / 禁 dangerouslySetInnerHTML / 禁前端 API key
- [ ] 后端：SSE 格式 / 错误处理 / process.env / 禁硬编码 key
- [ ] 命名：符合 `docs/reference/naming.md`

## 发布自检

- [ ] CI 通过（check:all）
- [ ] 已在 develop 集成测试通过
- [ ] 版本号符合 SemVer
- [ ] 合并后打 tag，并同步回 develop

## 风险与回滚

<!-- 已知风险、回滚方案 -->
