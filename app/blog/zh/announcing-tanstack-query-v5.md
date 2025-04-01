---
title: 宣布 TanStack Query v5 发布
published: 10/17/2023
authors:
  - Dominik Dorfmeister
---

大约一年前，我们宣布了 [TanStack Query v5 路线图](https://github.com/TanStack/query/discussions/4252)，从那时起整个团队一直在努力开发这个版本。所以我们非常高兴地宣布今天就是这一天：经过 91 个 alpha 版本、35 个 beta 版本和 16 个候选版本，TanStack Query [v5.0.0](https://github.com/TanStack/query/releases/tag/v5.0.0) 终于来了！🎉

v5 延续了 v4 的旅程，致力于使 TanStack Query 更小（v5 比 v4 小约 20%）、更好且更直观易用。这个版本的主要关注点之一是简化和精简我们提供的 API：

## 重大变更

作为一个重大变更，我们从代码库中移除了大多数重载，统一了使用 `useQuery` 和其他钩子的方式。这是我们想在 v4 中完成的事情，但由于 [TypeScript 的限制](https://github.com/microsoft/TypeScript/issues/43371)而无法实现。TypeScript 在 TS 4.7 中解决了这个问题，因此我们能够移除所有用于不同参数数量调用 `useQuery` 的重载。这是一个巨大的开发体验提升，因为带有重载的方法通常会有相当糟糕的 TypeScript 错误信息。

这是 v5 中最大的突破性变化，但我们认为这是值得的。API 现在更加一致 - 你总是只需要传递*一个*对象。为了减轻手动更改所有出现位置的痛苦，我们在过去几个月里试图为这个即将到来的变化做好准备。文档已经更改为使用新的 API，我们在 eslint 包中发布了一个可自动修复的 [eslint 规则](/query/v4/docs/eslint/prefer-query-object-syntax)。此外，v5 还提供了 [代码转换工具](/query/v5/docs/react/guides/migrating-to-v5#codemod) 来帮助过渡。

除此之外，我们将 `cacheTime` 重命名为 `gcTime` 以更好地反映其功能，合并了 `keepPreviousData` 和 `placeholderData`，将 `loading` 状态重命名为 `pending`，并 [移除了 `useQuery` 中的回调](https://github.com/TanStack/query/discussions/5279)。所有这些变更使 v5 成为对新手最一致和最好的版本。

要了解更多关于重大变更的信息，请查看我们的 [迁移指南](/query/v5/docs/react/guides/migrating-to-v5)。

## 新特性

当然，v5 也带来了令人惊叹的新特性 🚀：

### 简化的乐观更新

通过利用 `useMutation` 返回的 `variables`，享受全新的、简化的乐观更新方式，无需手动编写更新缓存的代码。更多详情，请查看 [乐观更新文档](/query/v5/docs/react/guides/optimistic-updates)

### 可共享的 mutation 状态

一个经常被请求的特性，如这个 [两年前的 issue](https://github.com/TanStack/query/issues/2304) 所示，终于在 v5 中实现：你现在可以通过新的 [useMutationState](/query/v5/docs/react/reference/useMutationState) 钩子访问所有 mutations 的状态，这些状态可以在组件之间共享。

### 一流的 `suspense` 支持

没错 - 用于数据获取的 `suspense` 不再是实验性的，而是完全支持的。React Query 提供了新的 `useSuspenseQuery`、`useSuspenseInfiniteQuery` 和 `useSuspenseQueries` 钩子。查看 [suspense 文档](/query/v5/docs/react/guides/suspense) 了解它们与非 suspense 版本的区别。

#### 使用 React Server Components 进行流式传输

v5 还为 nextJs 中的服务器端 suspense 提供了实验性集成，统一了两个世界的精华：[react-query-next-experimental](/query/v5/docs/react/guides/advanced-ssr#experimental-streaming-without-prefetching-in-nextjs) 适配器允许我们编写单个 `useSuspenseQuery`，它将尽可能早地开始数据获取：在服务器上，在 SSR 期间。然后它会将结果流式传输到客户端，在那里它会自动放入缓存中，为我们提供 React Query 的所有交互性和数据同步功能。

### 改进的无限查询

无限查询现在可以 [一次预取多个页面](/query/v5/docs/react/guides/prefetching)，你还可以指定缓存中存储的 [最大页面数量](/query/v5/docs/react/guides/infinite-queries#what-if-i-want-to-limit-the-number-of-pages)。

### 新的开发工具

Query 开发工具已经从头开始以框架无关的方式重写，使其可用于所有适配器。它们还进行了 UI 改造，并添加了一些新功能，如缓存内联编辑和亮色模式。

### 细粒度持久化

另一个来自 [2021 年的长期讨论](https://github.com/TanStack/query/discussions/2649) 强调了细粒度持久化和即时恢复功能的重要性（特别是对于移动开发），这是 `PersistQueryClient` 插件所不具备的。在 v5 中，我们现在有了一个新的 [experimental_createPersister](/query/v5/docs/react/plugins/createPersister) 插件，允许你单独持久化查询。

### `queryOptions` API

现在我们有了统一的方式来调用 `useQuery`（只使用一个对象作为参数），我们也可以在此基础上构建更好的抽象。新的 [queryOptions](/query/v5/docs/react/typescript#typing-query-options) 函数为我们提供了一种类型安全的方式来在 `useQuery` 和命令式方法（如 `queryClient.prefetchQuery`）之间共享查询定义。此外，它还可以使 `queryClient.getQueryData` 类型安全。

---

## 感谢

我们希望你能像我们享受构建 v5 一样享受使用它。最后我们要感谢每一个让这个版本成为可能的人。无论你是核心贡献者，实现了路线图中的问题，修复了文档中的错别字，还是对 alpha 版本提供了反馈：每一个贡献都很重要！是人们让这个库变得伟大，我们很幸运能有这样一个令人惊叹的社区。❤️
