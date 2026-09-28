# Autional 平台控制台

**域名**：[platform.autional.cn](https://platform.autional.cn)
**技术栈**：Vite + React 19 + TypeScript + Tailwind CSS + Ant Design
**仓库**：[github.com/autional-cn/platform](https://github.com/autional-cn/platform)

平台级租户运营与全局配置。

## 开发

```bash
pnpm install
pnpm dev      # http://localhost:13110
pnpm build    # 构建产物：apps/platform-console/dist/
pnpm test     # Vitest 单元测试
```

## 部署

推送至 `main` 分支后由 Vercel 自动部署。
