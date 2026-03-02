import NextAuth from 'next-auth'
import type { User } from '@/lib/types'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: string
      token: string // Backend JWT (authToken)
      isAdmin: boolean
      userData: User
      provider?: string // 'credentials' | 'google'
      isNewUser?: boolean
    }
  }

  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    role: string
    token: string
    isAdmin: boolean
    userData: User
    backendUserId?: string
    isNewUser?: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string
    token: string // Backend JWT (authToken)
    isAdmin: boolean
    userData: User
    provider?: string
    isNewUser?: boolean
  }
}