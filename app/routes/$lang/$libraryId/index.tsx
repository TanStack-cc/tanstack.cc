import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/$lang/$libraryId/')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/$lang/$libraryId/$version',
      params: (prev) => ({
        ...prev,
        lang: params.lang,
        libraryId: params.libraryId,
        version: 'latest',
      }),
    })
  },
})
