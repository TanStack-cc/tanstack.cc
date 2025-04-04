import { Outlet, createFileRoute } from '@tanstack/react-router'
import { Scarf } from '~/components/Scarf'
import { TranslateToggle } from '~/components/TranslateToggle'
import { getLibrary } from '~/libraries'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/$lang/$libraryId')({
  component: RouteForm,
  head: (ctx) => {
    const library = getLibrary(ctx.params.libraryId)

    return {
      meta: seo({
        title: library.name
          ? `${library.name} | ${library.frameworks
              .map(
                (framework) =>
                  `${framework.charAt(0).toUpperCase()}${framework.slice(
                    1
                  )} ${library.name.replace('TanStack ', '')}`
              )
              .join(', ')}`
          : '',
        description: library?.description,
        image: library?.ogImage,
      }),
    }
  },
})

export default function RouteForm() {
  const { libraryId } = Route.useParams()
  const library = getLibrary(libraryId)

  return (
    <>
      <Outlet />
      <TranslateToggle />
      {library.scarfId ? <Scarf id={library.scarfId} /> : null}
    </>
  )
}
