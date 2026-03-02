'use client'

import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'

interface NextAuthProviderProps {
  children: ReactNode
}

export function NextAuthProvider({ children }: NextAuthProviderProps) {
  console.log('NextAuthProvider: Initializing SessionProvider')

  return (
    <SessionProvider
      basePath="/api/auth"
      refetchInterval={5 * 60}
      refetchOnWindowFocus={true}
    >
      {children}
    </SessionProvider>
  )
}