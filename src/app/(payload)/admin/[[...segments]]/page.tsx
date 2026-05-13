import type { Metadata } from 'next'

import config from '@payload-config'
import { RootPage, generatePageMetadata } from '@payloadcms/next/views'

import { importMap } from '../importMap.js'

type PageArgs = {
  params: Promise<{ segments?: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export const generateMetadata = ({ params, searchParams }: PageArgs): Promise<Metadata> =>
  generatePageMetadata({
    config: Promise.resolve(config as any),
    params: params.then((value) => ({
      ...value,
      segments: value?.segments ?? [],
    })) as Promise<{ [key: string]: string | string[] }>,
    searchParams: searchParams.then((value) => value ?? {}) as Promise<{
      [key: string]: string | string[]
    }>,
  })

export default function PayloadAdminPage({ params, searchParams }: PageArgs) {
  return RootPage({
    config: Promise.resolve(config as any),
    params: params.then((value) => ({
      segments: value?.segments ?? [],
    })),
    searchParams: searchParams.then((value) => value ?? {}) as Promise<{
      [key: string]: string | string[]
    }>,
    importMap,
  })
}
