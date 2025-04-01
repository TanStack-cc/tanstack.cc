---
title: 宣布 TanStack Form v1 发布
published: 03/03/2025
authors:
  - Corbin Crutchley
---

![TanStack Form v1](/blog-assets/announcing-tanstack-form-v1/form_header.png)

我们很高兴地宣布 [TanStack Form](/form/v1) 的第一个稳定版本已经发布，可以在生产环境中使用了！🥳

我们在发布时支持五个框架：React、Vue、Angular、Solid 和 Lit，以及每个特定框架的大量功能。

# 如何安装

```shell
$ npm i @tanstack/react-form
# 或
$ npm i @tanstack/vue-form
# 或
$ npm i @tanstack/angular-form
# 或
$ npm i @tanstack/solid-form
# 或
$ npm i @tanstack/lit-form
```

# 一点历史

大约两年前，[我在 BlueSky（当时是一个仅限邀请的平台）上看到 Tanner 发布的帖子，宣布他正在开发一个新项目：TanStack Form](https://bsky.app/profile/tannerlinsley.com/post/3ju5z473w5525)。

![Tanner 和我在 Bluesky 上关于 TanStack Form 的来回对话](/blog-assets/announcing-tanstack-form-v1/tanstack_form_bluesky_announce.png)

当时，我刚刚发布了一个名为 "[HouseForm](https://web.archive.org/web/20240101000000*/houseform.dev)" 的 React 替代表单库，我立即被 Tanner 的库带来的一些想法所吸引。

我很幸运能够参加 Tanner 也将参加的黑客马拉松，我们有机会花一些时间将 HouseForm 的一些 API 集成到项目中。

从那时起，Tanner 将 Form 的大部分工作交给了我和一群优秀的额外维护者。

那么，在这段时间里我们构建了什么？

# 功能特性

长期开发的一个优势是 TanStack Form 在发布时就带有大量可以从第一天就开始使用的功能。

让我们用 React 适配器作为例子来介绍_其中的一些_功能。

## 极致的类型安全

像所有 TanStack 项目一样，Form 重新定义了"类型安全"表单库的含义。

```tsx
const form = useForm({
    defaultValues: {
        name: "",
        age: 0
    }
});

// TypeScript 会正确提示 `firstName` 不是一个有效的字段
<form.Field name="firstName"/>

// TypeScript 会正确提示 `name` 的类型是 `string`，而不是 `number`
<form.Field name="name" children={field => <NumberInput value={field.state.value}/>}/>
```

我们甚至支持检查 `<form.Field>` 中返回的错误类型：

```tsx
<form.Field
  name="age"
  validators={{
    onChange: ({ value }) => (value < 12 ? { tooYoung: true } : undefined),
  }}
  children={(field) => (
    <>
      <NumberInput value={field.state.value} />
      // TypeScript 会正确提示 `errorMap.onChange` 是一个对象，而不是字符串
      <p>{field.state.meta.errorMap.onChange}</p>
    </>
  )}
/>
```

> 哦，是的，我们同时支持基于字段的验证和表单验证。可以混合搭配使用！

最棒的是什么？[你不需要传递任何 typescript 泛型就能获得这种级别的类型安全](/form/latest/docs/philosophy#generics-are-grim)。一切都从你的运行时使用中推断出来。

## Schema 验证

感谢 [Zod](http://zod.dev/)、[Valibot](https://valibot.dev) 和 [ArkType](https://arktype.io/) 的创建者的出色工作，我们开箱即支持 [Standard Schema](https://github.com/standard-schema/standard-schema)；不需要其他包。

```tsx
const userSchema = z.object({
  age: z.number().gte(13, '你必须年满 13 岁才能创建账户'),
})

function App() {
  const form = useForm({
    defaultValues: {
      age: 0,
    },
    validators: {
      onChange: userSchema,
    },
  })
  return (
    <div>
      <form.Field
        name="age"
        children={(field) => {
          return <>{/* ... */}</>
        }}
      />
    </div>
  )
}
```

## 异步验证

但这还不是全部！我们还支持使用异步函数来验证你的代码；包括内置的防抖和基于 [AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) 的取消：

```tsx
<form.Field
  name="age"
  asyncDebounceMs={500}
  validators={{
    onBlurAsync: async ({ value, signal }) => {
      const currentAge = await fetchCurrentAgeOnProfile({ signal })
      return value < currentAge ? '你只能增加年龄' : undefined
    },
  }}
/>
```

## 平台支持

正如我们从一开始就提到的，我们不仅支持多个框架；我们还支持多个运行时。无论你是使用 React Native、NativeScript，还是像 Next.js 或 [TanStack Start](/start) 这样的 SSR 解决方案，我们都能满足你的需求。

事实上，如果你使用 SSR 解决方案，我们甚至让服务器端表单验证变得轻而易举：

```typescript
// app/routes/index.tsx，但可以提取到任何其他路径
import { createServerValidate, getFormData } from '@tanstack/react-form/start'
import { yourSchemaHere } from '~/constants/forms'

const serverValidate = createServerValidate({
  ...formOpts,
  onServerValidate: yourSchemaHere,
})

export const getFormDataFromServer = createServerFn({ method: 'GET' }).handler(
  async () => {
    return getFormData()
  }
)
```

> 这个代码示例省略了一些相关代码以保持简洁。[有关我们的 SSR 集成的更多详细信息，请查看我们的文档。](/form/latest/docs/framework/react/guides/ssr)

就这样，完全相同的验证逻辑在你的前端和后端都在运行。即使用户的浏览器禁用了 JavaScript，你的表单也会显示错误！

# 展望未来

然而，我们不会止步于此 - 现在我们已经稳定，我们计划为 v1 添加新功能。这些功能包括：

- [持久化 API](https://github.com/TanStack/form/pull/561)
- [Svelte 5 适配器](https://github.com/TanStack/form/issues/516)
- [更好的提交时值转换 DX](https://github.com/TanStack/form/issues/418)
- [表单组](https://github.com/TanStack/form/issues/419)

以及更多。

# 感谢**你们**

有太多人我想感谢，一旦开始就永远说不完。相反，我会向每个我想感谢的群体致意。

- 感谢我们的贡献者：如此多的人必须聚在一起才能实现这一切。从其他 TanStack 项目的维护者给予我们指导，到临时的 PR；这一切都帮助我们跨越了终点线。

- 感谢我们的早期采用者：那些冒险尝试我们并为我们的 API 和功能提供宝贵反馈的人。
- 感谢报道我们工具的内容创作者：你们为我们的项目带来了更多关注 - 通过教育和反馈使它变得更好。
- 感谢更广泛的社区：你们使用我们工具的热情极大地推动了团队。

最后，感谢**你**花时间阅读和探索我们最新的工具。❤️ 