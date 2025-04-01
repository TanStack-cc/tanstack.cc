---
title: 宣布 TanStack Query v4 发布
published: 7/14/2022
authors:
  - Dominik Dorfmeister
---

我们很高兴地宣布 [TanStack Query](/query/v4)（之前称为 `react-query`）的下一个版本 🎉。
重新品牌化和重组为 monorepo 现在终于让我们能够将 `react-query` 的乐趣带给其他框架，如 `vue`、`svelte` 或 `solid`。

TanStack Query 建立在一个框架无关的核心之上，顶层有特定框架的适配器。这使我们能够在框架之间共享使 TanStack Query 出色的核心逻辑，如 QueryClient 或 Query Subscriptions，同时在适配器中也有特定框架的代码，如钩子（useQuery 和 useMutation）。

## 如何安装

```
npm i @tanstack/react-query
# 或
yarn add @tanstack/react-query
```

## 新特性

### 适当的离线支持

v4 已经将 TanStack Query 从一个数据获取库发展成为一个真正的异步状态管理器。之前关于必须有活动网络连接的所有假设现在都消失了，所以 TanStack Query _真正地_可以处理任何 Promise，无论你如何产生它。
为了实现这一点，我们引入了全新的 [Network Mode](/query/v4/docs/guides/network-mode)，帮助 TanStack Query 决定查询何时应该考虑在线状态。

### 稳定的持久化器

从 v3 开始，持久化器就作为一个实验性功能存在。它们允许你将 Query Cache 同步到外部位置（例如 localStorage）以供以后使用。在获得大量反馈后，我们重新设计并改进了 API，现在我们提供两个主要的持久化器：

- SyncStoragePersister
- AsyncStoragePersister

这些持久化器对大多数用例都工作得很好，但没有什么能阻止你编写自己的持久化器 - 只要它遵守所需的接口。

### 支持 React 18

React 18 在今年早些时候发布，v4 现在对它和它带来的新并发特性提供一流支持。为了实现这一点，内部订阅被重写以利用新的 `useSyncExternalStore` 钩子。

### 默认启用追踪查询

追踪查询是在 v3.6.0 中作为可选功能添加的性能优化。这个优化现在在 v4 中是默认行为，这应该会给你的渲染性能带来不错的提升。

### 简化的 API

随着时间的推移，我们的一些 API 变得相当复杂，以至于它们相互矛盾。一些例子包括：

- QueryKeys 在暴露时有时被转换为数组，有时不转换。
- Query Filters 不直观且互斥。
- 参数的默认值在不同方法上默认为相反的值

我们清理了许多这些不一致之处，以使开发者体验更好。v4 还提供了一个代码转换工具来帮助你进行迁移。

## 接下来是什么？

首先是清理文档。正如你可能注意到的，它们仍然非常特定于 react，并且时不时地引用 `react-query`。请在我们重组文档时耐心等待，PR 总是受欢迎的。

此外，还有更多的适配器。目前，只有 React 适配器存在，但我们渴望很快添加更多框架。
