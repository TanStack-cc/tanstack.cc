# Welcome to TanStack.dev!

This site is built with TanStack Router!

- [TanStack Router Docs](https://tanstack.dev/router)

It's deployed automagically with Netlify!

- [Netlify](https://netlify.com/) [![Netlify Status](https://api.netlify.com/api/v1/badges/547f5615-436d-4944-8687-2b8f86b2a562/deploy-status)](https://app.netlify.com/sites/tanstack-dev/deploys)

## Development

From your terminal:

```sh
pnpm install
pnpm dev
```

This starts your app in development mode, rebuilding assets on file changes.

## Editing and previewing the docs of TanStack projects locally

The documentations for all TanStack projects except for `React Charts` are hosted on [https://tanstack.dev](https://tanstack.dev), powered by this TanStack Router app.
In production, the markdown doc pages are fetched from the GitHub repos of the projects, but in development they are read from the local file system.

Follow these steps if you want to edit the doc pages of a project (in these steps we'll assume it's [`tanstack-dev/form`](https://github.com/tanstack-dev/form)) and preview them locally :

1. Create a new directory called `tanstack-dev`.

```sh
mkdir tanstack-dev
```

2. Enter the directory and clone this repo and the repo of the project there.

```sh
cd tanstack
git clone git@github.com:TanStack-dev/tanstack.dev.git
git clone git@github.com:TanStack-dev/form.git
```

> [!NOTE]
> Your `tanstack-dev` directory should look like this:
>
> ```
> tanstack-dev/
>    |
>    +-- form/
>    |
>    +-- tanstack.dev/
> ```

> [!WARNING]
> Make sure the name of the directory in your local file system matches the name of the project's repo. For example, `tanstack-dev/form` must be cloned into `form` (this is the default) instead of `some-other-name`, because that way, the doc pages won't be found.

3. Enter the `tanstack-dev/tanstack.dev` directory, install the dependencies and run the app in dev mode:

```sh
cd tanstack.dev
pnpm i
# The app will run on https://localhost:3000 by default
pnpm dev
```

4. Now you can visit http://localhost:3000/form/latest/docs/overview in the browser and see the changes you make in `tanstack-dev/form/docs`.

> [!NOTE]
> The updated pages need to be manually reloaded in the browser.

> [!WARNING]
> You will need to update the `docs/config.json` file (in the project's repo) if you add a new doc page!
