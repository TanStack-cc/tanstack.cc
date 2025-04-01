---
title: 为什么 TanStack Start 要放弃适配器
published: 11/22/2024
authors:
  - Tanner Linsley
---

![Nitro 头图](/blog-assets/why-tanstack-start-is-ditching-adapters/nitro.jpg)

## 要不要"适配器"？

构建一个新的前端 Javascript 框架是一项艰巨的任务，正如我在构建 TanStack Start（我的新 TanStack 驱动的全栈框架）时所学到的。有太多需要考虑的部分：

- 路由
- 服务器端渲染
- RPCs 和 APIs
- 开发工具
- **部署和托管**

最后一个，**部署和托管**尤其棘手，因为现在似乎每个云环境都有自己独特的方式来让事情"恰到好处"地工作。当面对这个 TanStack Start 的决定时，我显然知道我想要首先支持哪些主机，Vercel 就在这个列表的顶部。

我的第一反应是开始构建一个可以为每个主机提供"适配器"的系统，然后先专注于编写 Vercel 适配器。

然而，这个计划从一开始就有缺陷。很快我就意识到，我个人将负责（至少在开始时）编写大部分（如果不是全部）代码，使 TanStack Start 不仅能在 Vercel 上运行，还要在许多其他目标和平台上运行。经过一些快速研究，仅这一任务就令人望而生畏，让我质疑自己构建服务器绑定的 JS 框架的动机。

从技术上讲，仅仅通过遵守一些输出文件/目录命名约定，部署到 Vercel 的工作已经非常简单。然而，令人感到困扰的是需要支持的环境/主机数量之多。真的很多！看看 [Remix 不断增长的服务器适配器列表](https://remix.run/docs/en/main/other-api/adapter)就知道了！而且不只是 Remix 有这样的列表。大多数服务器绑定的 JS 框架都有类似的东西。我基本上是在承诺在框架的最初几个月就要编写至少 10 个适配器，而我几乎还没有涉及框架本身的令人兴奋的功能（更不用说维护和更新这些适配器的工作）。

这里的残酷现实是**没有办法绕过这个问题。**如果你的框架在提供**任何面向服务器的代码，你需要确保它可以在任何可以部署的地方完美运行。**

所以，就在我即将屈服于编写上百个适配器并在余生处理上游破坏性变更的无限悲伤时，我与我的朋友 [Ryan Carniato](https://twitter.com/ryancarniato) 讨论了 Solid JS 如何通过我们的表亲框架 [Solid Start](https://start.solidjs.com/) 来解决这个问题，他自信地说"直接使用 Vite 和 Nitro"。

## TanStack Start = Nitro + Vite + TanStack Router

[Nitro](https://nitro.unjs.io/) 是一个"用于构建带有自己观点的服务器端框架的 JavaScript 工具包"，由 [Vite](https://vite.dev/) 驱动。那么是什么让它如此特别呢？

Nitro 有很多令人惊叹的功能，使其对构建框架非常有用，但最酷的部分之一是它由 H3 和 Vite 驱动。Nitro 的标语就是"创建具有所需一切的 Web 服务器，并**将它们部署到你喜欢的任何地方**"（强调是我加的）。

简单来说，Nitro 有效地使 TanStack Start 变得"_无适配器_"。它使用 H3，这是一个维护自己的低级适配器的 HTTP 框架，这样你就可以编写一次服务器代码并在任何地方使用它（听起来很像 React！）。

通过使用 Nitro，TanStack Start 的所有适配器问题都消失了。我甚至不需要考虑它们！

事实上，部署到 Vercel 比我最初计划的还要简单：只需要将 `vercel` 目标传递给我们的 `defineConfig` 的 `server.preset` 选项，这个选项会传递给 Nitro：

```jsx
import { defineConfig } from '@tanstack/start/config'

export default defineConfig({
  server: {
    preset: 'vercel',
  },
})
```

## 它支持什么？

Nitro、H3 和 Vite **令人印象深刻，这是最起码的评价。**我们很高兴看到在第一次尝试时，大量 Vercel 功能都完美地开箱即用，包括 GitHub 集成、服务器函数、边缘函数/中间件、不可变部署、环境变量、服务器端渲染，甚至是流式传输。

这是一个庞大的列表，我们基本上通过使用 Nitro 和 Vite 就免费获得了。

## TanStack Start 即将到来！

有了解决构建和部署的问题，并内置支持将我的 GitHub 仓库直接集成到我最喜欢的托管提供商，我终于可以专注于我认为使 TanStack Start 特别的地方：

- 一个同类最佳的完全类型安全的路由器
- 用于构建服务器绑定 RPCs 的灵活原语
- 可选的服务器功能（SSR、APIs、RSCs 等）
- 与其他 TanStack 原语（如 TanStack Query）的深度集成
- 以及更多即将到来的功能！

## 更进一步

能够将这么多工作交给 Nitro 和 Vite 并获得这么多令人惊叹的功能是很棒的，但这绝对不是使用托管平台_每个_功能的 100% 完整解决方案，特别是 Vercel，我们在那里可以访问的不仅仅是部署。我们也一直在思考更多功能，比如 [边缘网络缓存](https://vercel.com/docs/edge-network/caching) 和我个人最喜欢的 [*偏差保护*](https://vercel.com/docs/deployments/skew-protection)。

例如，偏差保护（确保客户端和服务器在各自的部署中保持同步）需要的不仅仅是构建步骤。它还涉及在运行时将平台原语深度集成到框架中的能力，或者在特定情况下，能够将特定的 cookie 或头部注入到指向 Vercel 的传出 API/服务器请求中。

我很高兴地报告，TanStack Start 将提供令人惊叹的强大中间件原语（用于 API 路由和服务器函数 RPCs），这将使其成为一行代码的事情，甚至可能是自动的（希望如此）。

这种级别的开发者体验和集成让我对未来感到兴奋，我相信这就是开源的真正意义：将生态系统中强大的工具组合在一起，为开发者和用户提供令人惊叹的体验。

我想不出比 TanStack Start、Nitro、Vite 和 Vercel 更好的组合来为你提供同类最佳的 Web 应用体验。

## 60 秒内试用

TanStack Start 目前处于 Beta 阶段！点击下面的 ["Deploy"](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Ftanstack%2Frouter%2Ftree%2Fmain%2Fexamples%2Freact%2Fbasic-file-based&project-name=my-tanstack-project&repository-name=my-tanstack-project) 按钮，在约 1 分钟内创建并部署一个全新的 TanStack Start "Basic" 模板到 Vercel。

[![使用 Vercel 部署](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Ftanstack%2Frouter%2Ftree%2Fmain%2Fexamples%2Freact%2Fbasic-file-based&project-name=my-tanstack-project&repository-name=my-tanstack-project)

我们希望你喜欢我们正在构建的东西，迫不及待地想要得到你的反馈！
