---
title: TanStack Router 在 TypeScript 性能方面的里程碑
published: 09/17/2024
authors:
  - Christopher Horobin
---

TanStack Router 在类型安全路由方面不断突破边界。

路由器的组件如 `<Link>` 及其钩子如 `useSearch`、`useParams`、`useRouteContext` 和 `useLoaderData`，从路由定义中推断以提供出色的类型安全。使用 TanStack Router 的应用程序通常会在其路由定义中使用带有复杂类型的外部依赖，用于 `validateSearch`、`context`、`beforeLoad` 和 `loader`。

虽然开发体验很好，但当路由定义累积成路由树并变得庞大时，编辑器体验可能会开始变慢。我们对 TanStack Router 进行了许多 TypeScript 性能改进，使得只有在推断复杂性变得非常大时才会出现问题。我们密切关注诊断信息，如实例化，并试图减少 TypeScript 对每个单独路由定义进行类型检查所需的时间。

尽管所有这些过去的努力（确实有帮助），我们不得不解决房间里的大象。TanStack Router 中实现出色编辑器体验的根本问题不一定与整体 typescript 检查时间有关。我们一直在努力解决的问题是 TypeScript 语言服务在类型检查累积的路由树时的瓶颈。对于熟悉 TypeScript 跟踪的人来说，大型 TanStack Router 应用程序的跟踪可能看起来类似于以下内容：

![显示路由树被推断的跟踪](/blog-assets/tsr-perf-milestone/tracing-slow.png)

对于不了解的人来说，你可以使用以下命令从 TypeScript 生成跟踪：

```
tsc --generatetrace trace
```

这个例子有 400 个路由定义，所有的 `validateSearch` 都使用 `zod` 并通过路由的 `context` 和 `loader` 集成 TanStack Query - 这是一个极端的例子。跟踪开始时的大块就是 TypeScript 在首次遇到 `<Link>` 组件实例时进行类型检查的内容。

语言服务器的工作原理是从头开始对文件（或文件的一个区域）进行类型检查，但仅限于该文件/区域。这意味着每当你与 `<Link>` 组件的实例交互时，语言服务都必须执行这项工作。事实证明，这就是我们在从累积的路由树推断所有必要类型时遇到的瓶颈。如前所述，路由定义本身可能包含来自外部验证库的复杂类型，这些类型也需要推断。

很早就显而易见，这显然会降低编辑器体验。

## 为语言服务分解工作

理想情况下，语言服务应该只需要根据 `<Link>` 导航 `to` 的位置从路由定义中进行推断，而不是必须遍历整个路由树。这样，语言服务就不需要忙于推断不是导航目标的路由定义的类型。

不幸的是，基于代码的路由树依赖推断来构建路由树，这会触发上面跟踪中显示的大块。然而，TanStack Router 的基于文件的路由，会在创建或修改路由时自动生成路由树。这意味着我们可以在这里进行一些探索，看看是否能获得更好的性能。

之前即使是基于文件的路由，路由树也是像下面这样创建的：

```tsx
export const routeTree = rootRoute.addChildren({
  IndexRoute,
  LayoutRoute: LayoutRoute.addChildren({
    LayoutLayout2Route: LayoutLayout2Route.addChildren({
      LayoutLayout2LayoutARoute,
      LayoutLayout2LayoutBRoute,
    }),
  }),
  PostsRoute: PostsRoute.addChildren({ PostsPostIdRoute, PostsIndexRoute }),
})
```

生成路由树是减少路由树繁琐配置但保持推断在重要位置的结果。这就是引入第一个重要变更以提高编辑器性能的地方。我们可以利用这个生成步骤来_声明路由树_，而不是推断路由树。

```tsx
export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  LayoutRoute: typeof LayoutRouteWithChildren
  PostsRoute: typeof PostsRouteWithChildren
}

const rootRouteChildren: RootRouteChildren = {
  IndexRoute: IndexRoute,
  LayoutRoute: LayoutRouteWithChildren,
  PostsRoute: PostsRouteWithChildren,
}

export const routeTree = rootRoute._addFileChildren(rootRouteChildren)
```

注意使用 `interface` 来声明组成路由树的子路由。在生成路由树时，这个过程会对所有路由及其子路由重复进行。有了这个变更，运行跟踪让我们更好地了解语言服务内部发生的事情。

![显示路由树被声明的跟踪](/blog-assets/tsr-perf-milestone/tracing-declare-route-tree.png)

这仍然很慢，我们还没有完全达到目标，但有一些变化 - _跟踪不同了_。整个路由树的类型推断仍在发生，但现在是在_其他地方_进行的。在处理我们的类型时，发现它发生在一个名为 `ParseRoute` 的类型中。

```tsx
export type ParseRoute<TRouteTree, TAcc = TRouteTree> = TRouteTree extends {
  types: { children: infer TChildren }
}
  ? unknown extends TChildren
    ? TAcc
    : TChildren extends ReadonlyArray<any>
    ? ParseRoute<TChildren[number], TAcc | TChildren[number]>
    : ParseRoute<TChildren[keyof TChildren], TAcc | TChildren[keyof TChildren]>
  : TAcc
```

这个类型遍历路由树以创建所有路由的联合。这个联合反过来用于创建从 `id` -> `Route`、`from` -> `Route` 和 `to` -> `Route` 的类型映射。这个映射的一个例子存在于映射类型中。

```tsx
export type RoutesByPath<TRouteTree extends AnyRoute> = {
  [K in ParseRoute<TRouteTree> as K['fullPath']]: K
}
```

这里的重要认识是，当使用基于文件的路由时，我们可以通过在生成路由树时自己输出该映射类型来完全跳过 `ParseRoute` 类型。相反，我们可以生成以下内容：

```tsx
export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/posts': typeof PostsRouteWithChildren
  '/posts/$postId': typeof PostsPostIdRoute
  '/posts/': typeof PostsIndexRoute
  '/layout-a': typeof LayoutLayout2LayoutARoute
  '/layout-b': typeof LayoutLayout2LayoutBRoute
}

export interface FileRoutesByTo {
  '/': typeof IndexRoute
  '/posts/$postId': typeof PostsPostIdRoute
  '/posts': typeof PostsIndexRoute
  '/layout-a': typeof LayoutLayout2LayoutARoute
  '/layout-b': typeof LayoutLayout2LayoutBRoute
}

export interface FileRoutesById {
  __root__: typeof rootRoute
  '/': typeof IndexRoute
  '/_layout': typeof LayoutRouteWithChildren
  '/posts': typeof PostsRouteWithChildren
  '/_layout/_layout-2': typeof LayoutLayout2RouteWithChildren
  '/posts/$postId': typeof PostsPostIdRoute
  '/posts/': typeof PostsIndexRoute
  '/_layout/_layout-2/layout-a': typeof LayoutLayout2LayoutARoute
  '/_layout/_layout-2/layout-b': typeof LayoutLayout2LayoutBRoute
}

export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths:
    | '/'
    | '/posts'
    | '/posts/$postId'
    | '/posts/'
    | '/layout-a'
    | '/layout-b'
  fileRoutesByTo: FileRoutesByTo
  to: '/' | '/posts/$postId' | '/posts' | '/layout-a' | '/layout-b'
  id:
    | '__root__'
    | '/'
    | '/_layout'
    | '/posts'
    | '/_layout/_layout-2'
    | '/posts/$postId'
    | '/posts/'
    | '/_layout/_layout-2/layout-a'
    | '/_layout/_layout-2/layout-b'
  fileRoutesById: FileRoutesById
}

export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  LayoutRoute: typeof LayoutRouteWithChildren
  PostsRoute: typeof PostsRouteWithChildren
}

const rootRouteChildren: RootRouteChildren = {
  IndexRoute: IndexRoute,
  LayoutRoute: LayoutRouteWithChildren,
  PostsRoute: PostsRouteWithChildren,
}

export const routeTree = rootRoute
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()
```

除了声明子路由外，我们还声明了将路径映射到路由的接口。

这个变更以及其他类型级别的变更（仅在未注册这些类型时才有条件地使用 `ParseRoute`）导致了一个跟踪，这正是我们一直以来的目标 🥳

![路由树声明被更快地推断的跟踪](/blog-assets/tsr-perf-milestone/tracing-faster.png)

第一个引用 `<Link>` 的文件不再触发整个路由树的推断，这显著提高了感知到的语言服务速度。

通过这样做，TypeScript 将根据 `<Link>` 引用的特定路由推断所需的类型。当所有路由都被链接时，这可能不会转化为整体更好的 TypeScript 类型检查时间，但对于文件/区域中的语言服务来说，这是显著的速度提升。

两者之间的差异很明显，如下面这些具有复杂推断的大型路由树所示（本例中有 400 个）：

<div style="display: flex;">
  <video src="/blog-assets/tsr-perf-milestone/language-service-slow.mp4" width="50%" height="480" autoplay muted loop></video>
  <video src="/blog-assets/tsr-perf-milestone/language-service-fast.mp4" width="50%" height="480" autoplay muted loop></video>
</div>

你可能会认为这是_作弊_，因为我们在路由树生成阶段做了很多繁重的工作。我们对此的回应是，这个用于基于文件的路由（现在也包括虚拟基于文件的路由）的生成步骤已经存在，而且每当你修改或创建新路由时都是必要的步骤。

因此，一旦创建了路由并生成了路由树，路由定义中的所有内容的推断都保持不变。这意味着你可以对 `validateSearch`、`beforeLoad`、`loader` 等进行更改，推断的类型始终会立即反映出来。

开发体验没有改变，但在编辑器中的性能感觉很棒（特别是当你处理大型路由树时）。

## 基本规则

这个变更涉及许多 TanStack Router 的导出被改进，以使消费这些生成的类型更加高效，同时在使用基于代码的路由时仍能回退到整个路由树推断。我们的代码库中仍然有一些区域依赖于完整的路由树推断。这些区域是我们版本的松散/非严格模式。

```tsx
<Link to="." search={{ page: 0 }} />
<Link to=".." search={{page: 0}} />
<Link to="/dashboard" search={prev => ({..prev, page: 0 })} />
```

上面所有三种 `<Link>` 的用法都需要推断整个路由树，因此在与它们交互时会导致更差的编辑器体验。

在前两个实例中，TanStack Router 不知道你想导航到哪个路由，因此它尽最大努力从路由树中的所有路由推断出一个非常松散的类型。上面的第三个 `<Link>` 实例在 `search` 更新器函数中使用了 `prev` 参数，但在这种情况下，TanStack Router 不知道你是从哪个 `Route` 导航 `from`，因此它需要再次通过扫描整个路由树来猜测 `prev` 的松散类型。

在你的编辑器中，`<Link>` 最高性能的用法如下：

```tsx
<Link from="/dashboard" search={{ page: 0 }} />
<Link from="/dashboard" to=".." search={{page: 0}} />
<Link from="/users" to="/dashboard" search={prev => ({...prev, page: 0 })} />
```

TanStack Router 可以在这些情况下将类型缩小到特定路由。这意味着随着应用程序的扩展，你获得更好的类型安全和更好的编辑器性能。因此，我们鼓励在这些情况下使用 `from` 和/或 `to`。需要明确的是，在第三个例子中，只有在使用 `prev` 参数时才需要使用 `from`，否则，TanStack Router 不需要推断整个路由树。

这些更松散的类型也出现在 `strict: false` 模式中。

```tsx
const search = useSearch({ strict: false })
const params = useParams({ strict: false })
const context = useRouteContext({ strict: false })
const loaderData = useLoaderData({ strict: false })
const match = useMatch({ strict: false })
```

在这种情况下，通过使用推荐的 `from` 属性可以获得更好的编辑器性能和类型安全。

```tsx
const search = useSearch({ from: '/dashboard' })
const params = useParams({ from: '/dashboard' })
const context = useRouteContext({ from: '/dashboard' })
const loaderData = useLoaderData({ from: '/dashboard' })
const match = useMatch({ from: '/dashboard' })
```

## 展望未来

展望未来，我们相信 TanStack Router 在类型安全和 TypeScript 性能之间取得了最佳平衡，而不必在基于文件（和虚拟基于文件）路由中使用的类型推断质量上做出妥协。路由定义中的所有内容都保持推断，生成的路由树中的变更只是通过在重要的地方声明必要的类型来帮助语言服务，这是你永远不会想自己编写的内容。

这种方法对语言服务来说也是可扩展的。我们能够创建数千个路由定义，只要你坚持使用 TanStack Router 的 `strict` 部分，语言服务就能保持稳定。

我们将继续改进 TanStack Router 的 TypeScript 性能，以减少整体检查时间并进一步改进语言服务性能，但仍然觉得这是一个重要的里程碑，值得分享，我们希望 TanStack Router 的用户会欣赏这一点。
