import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import type { User } from '@/lib/types'

export const authOptions: NextAuthOptions = {
  providers: [
    // Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    // Keep existing Credentials Provider
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        token: { label: 'Token', type: 'text' }, // Add token for post-registration auth
        isRegistration: { label: 'IsRegistration', type: 'text' }, // Flag for registration flow
        recaptchaToken: { label: 'ReCaptcha Token', type: 'text' } // Add reCAPTCHA token
      },
      async authorize(credentials) {
        console.log('NextAuth: authorize function called with credentials:', {
          hasEmail: !!credentials?.email,
          hasPassword: !!credentials?.password,
          hasToken: !!credentials?.token,
          isRegistration: credentials?.isRegistration,
          email: credentials?.email
        })

        // Handle post-registration flow with token
        if (credentials?.isRegistration === 'true' && credentials?.token) {
          console.log('NextAuth: Post-registration auth flow with token')

          try {
            // Verify the user profile with the token
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://hedera-quests.com"}/profile/me`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${credentials.token}`,
                'Content-Type': 'application/json',
              },
            })

            console.log('NextAuth: Profile API response status:', response.status)

            if (!response.ok) {
              console.log('NextAuth: Profile API error')
              return null
            }

            const data = await response.json()

            // Check if user not found - account may have been deleted
            if (!data.success && data.message === "user not found") {
              console.log('NextAuth: User not found - account may have been deleted')
              return null
            }

            console.log('NextAuth: Profile API response data:', JSON.stringify(data, null, 2))

            const isAdmin = data.is_admin || false
            const userData = data.admin || data.user || data

            // Create comprehensive user object from response data
            const userObj: User = {
              id: String(userData.id || Date.now()),
              firstName: userData.firstName,
              lastName: userData.lastName,
              username: userData.username,
              name: (() => {
                if (isAdmin) {
                  const firstName = userData.firstName || '';
                  const lastName = userData.lastName || '';
                  const fullName = `${firstName} ${lastName}`.trim();
                  return fullName || userData.username?.replace(/\[.*?\]/g, '').trim() || 'Admin';
                } else {
                  const firstName = userData.firstName || '';
                  const lastName = userData.lastName || '';
                  const fullName = `${firstName} ${lastName}`.trim();
                  return fullName || userData.username?.replace(/\[.*?\]/g, '').trim() || 'User';
                }
              })(),
              email: userData.email || credentials.email,
              bio: userData.bio || '',
              avatar: '/logo.png',
              hederaAccountId: null,
              points: isAdmin ? undefined : (userData.total_points || 0),
              level: userData.userLevel?.level || 1,
              streak: 0,
              joinedAt: userData.created_at || new Date().toISOString(),
              role: isAdmin ? 'admin' : 'user',
              badges: [],
              completedQuests: [],
              userLevel: userData.userLevel,
              facebookProfile: userData.facebookProfile,
              twitterProfile: userData.twitterProfile,
              discordProfile: userData.discordProfile
            };

            return {
              id: userObj.id,
              email: userObj.email,
              name: userObj.name,
              image: userObj.avatar,
              role: userObj.role,
              token: credentials.token,
              isAdmin,
              userData: userObj,
            } as any

          } catch (error) {
            console.log('NextAuth: Post-registration auth error:', error)
            return null
          }
        }

        // Regular login flow
        if (!credentials?.email || !credentials?.password) {
          console.log('NextAuth: Missing credentials for login')
          return null
        }

        try {
          console.log('NextAuth: Making API call to backend for login')
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://hedera-quests.com"}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
              recaptchaToken: credentials.recaptchaToken,
            }),
          })

          console.log('NextAuth: Login API response status:', response.status)

          if (!response.ok) {
            const errorText = await response.text()
            console.log('NextAuth: Login API error response:', errorText)
            return null
          }

          const data = await response.json()
          console.log('NextAuth: Login API response data:', JSON.stringify(data, null, 2))

          if (!data.token) {
            console.log('NextAuth: No token in response')
            return null
          }

          const isAdmin = data.is_admin || false

          // Create comprehensive user object from response data
          const userData: User = {
            id: String(data.admin?.id || data.user?.id || Date.now()),
            firstName: data.admin?.firstName || data.user?.firstName,
            lastName: data.admin?.lastName || data.user?.lastName,
            username: data.admin?.username || data.user?.username,
            name: (() => {
              if (isAdmin) {
                const firstName = data.admin?.firstName || '';
                const lastName = data.admin?.lastName || '';
                const fullName = `${firstName} ${lastName}`.trim();
                return fullName || data.admin?.username?.replace(/\[.*?\]/g, '').trim() || 'Admin';
              } else {
                const firstName = data.user?.firstName || '';
                const lastName = data.user?.lastName || '';
                const fullName = `${firstName} ${lastName}`.trim();
                return fullName || data.user?.username?.replace(/\[.*?\]/g, '').trim() || 'User';
              }
            })(),
            email: data.admin?.email || data.user?.email || credentials.email,
            bio: data.admin?.bio || data.user?.bio || '',
            avatar: '/logo.png',
            hederaAccountId: null,
            points: isAdmin ? undefined : (data.admin?.total_points || data.user?.total_points || 0),
            level: data.admin?.userLevel?.level || data.user?.userLevel?.level || 1,
            streak: 0,
            joinedAt: data.admin?.created_at || data.user?.created_at || new Date().toISOString(),
            role: isAdmin ? 'admin' : 'user',
            badges: [],
            completedQuests: [],
            userLevel: data.admin?.userLevel || data.user?.userLevel,
            facebookProfile: data.admin?.facebookProfile || data.user?.facebookProfile,
            twitterProfile: data.admin?.twitterProfile || data.user?.twitterProfile,
            discordProfile: data.admin?.discordProfile || data.user?.discordProfile
          };

          return {
            id: userData.id,
            email: userData.email,
            name: userData.name,
            image: userData.avatar,
            role: userData.role,
            token: data.token,
            isAdmin,
            userData,
          } as any
        } catch (error) {
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt' as const,
    maxAge: 24 * 60 * 60,
  },
  jwt: {
    maxAge: 24 * 60 * 60,
  },
  callbacks: {
    async signIn({ user, account, profile }: any) {
      console.log('NextAuth: signIn callback called', {
        provider: account?.provider,
        hasAccount: !!account,
        hasProfile: !!profile
      })

      // For Google OAuth, backend authentication MUST succeed
      // If jwt() callback throws an error, this will prevent sign in
      return true
    },
    async jwt({ token, user, account, trigger }: any) {
      console.log('NextAuth: JWT callback called', {
        hasUser: !!user,
        hasAccount: !!account,
        provider: account?.provider,
        tokenKeys: Object.keys(token)
      })

      // Handle Google OAuth flow
      if (account?.provider === 'google' && account?.id_token) {
        console.log('NextAuth: Google OAuth - sending id_token to backend for verification')
        console.log('NextAuth: Backend URL:', process.env.NEXT_PUBLIC_API_URL || "https://hedera-quests.com")
        console.log('NextAuth: id_token length:', account.id_token?.length)

        try {
          // Send id_token to backend for verification (SECURE - backend verifies with Google)
          const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || "https://hedera-quests.com"}/auth/google`
          console.log('NextAuth: Calling backend endpoint:', backendUrl)

          const response = await fetch(backendUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${account.id_token}`,
              'Content-Type': 'application/json',
            },
          })

          console.log('NextAuth: Google backend response status:', response.status)
          console.log('NextAuth: Google backend response ok:', response.ok)

          if (!response.ok) {
            const errorText = await response.text()
            console.error('NextAuth: Google backend error:', errorText)
            console.error('NextAuth: Backend authentication failed - rejecting login')
            // Reject authentication - user cannot proceed without backend
            throw new Error(`Backend authentication failed: ${errorText}`)
          }

          const data = await response.json()
          console.log('NextAuth: Google backend response:', JSON.stringify(data, null, 2))

          // Backend returns JWT token after verifying Google id_token
          if (data.token) {
            console.log('NextAuth: Google OAuth token received, fetching user profile')

            // Fetch user profile with the token (same pattern as credentials flow)
            const profileResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://hedera-quests.com"}/profile/me`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${data.token}`,
                'Content-Type': 'application/json',
              },
            })

            console.log('NextAuth: Google profile API response status:', profileResponse.status)

            if (!profileResponse.ok) {
              console.error('NextAuth: Google profile API error')
              throw new Error('Failed to fetch user profile')
            }

            const profileData = await profileResponse.json()
            console.log('NextAuth: Google profile API response:', JSON.stringify(profileData, null, 2))

            const isAdmin = profileData.is_admin || false
            const userData = profileData.admin || profileData.user || profileData

            token.role = isAdmin ? 'admin' : 'user'
            token.token = data.token // Backend JWT (authToken)
            token.isAdmin = isAdmin
            token.userData = {
              id: String(userData.id || Date.now()),
              firstName: userData.firstName,
              lastName: userData.lastName,
              username: userData.username,
              name: (() => {
                const firstName = userData.firstName || ''
                const lastName = userData.lastName || ''
                const fullName = `${firstName} ${lastName}`.trim()
                return fullName || userData.username?.replace(/\[.*?\]/g, '').trim() || (isAdmin ? 'Admin' : 'User')
              })(),
              email: userData.email,
              bio: userData.bio || '',
              avatar: userData.picture || '/logo.png',
              hederaAccountId: null,
              points: isAdmin ? undefined : (userData.total_points || 0),
              level: userData.userLevel?.level || 1,
              streak: 0,
              joinedAt: userData.created_at || new Date().toISOString(),
              role: isAdmin ? 'admin' : 'user',
              badges: [],
              completedQuests: [],
              userLevel: userData.userLevel,
              facebookProfile: userData.facebookProfile,
              twitterProfile: userData.twitterProfile,
              discordProfile: userData.discordProfile
            }
            token.provider = 'google'
            token.isNewUser = data.isNewUser

            console.log('NextAuth: Google OAuth successful, token and profile loaded', {
              hasToken: !!token.token,
              hasUserData: !!token.userData,
              userId: token.userData?.id,
              userEmail: token.userData?.email,
              tokenRole: token.role,
              tokenIsAdmin: token.isAdmin,
              tokenProvider: token.provider
            })

            // Return immediately - don't let credentials block overwrite Google OAuth data
            return token
          } else {
            console.error('NextAuth: Backend returned success but no token!')
            throw new Error('No token in backend response')
          }
        } catch (error) {
          console.error('NextAuth: Google OAuth backend error:', error)
          console.error('NextAuth: Cannot proceed without backend authentication')
          // Reject authentication completely
          throw error
        }
      }

      // Handle regular credentials login (only runs if not Google OAuth)
      if (user) {
        token.role = user.role
        token.token = user.token
        token.isAdmin = user.isAdmin
        token.userData = user.userData
        token.provider = 'credentials'
        console.log('NextAuth: JWT token updated with user data', {
          hasUserData: !!user.userData,
          provider: token.provider,
          userId: user.userData?.id
        })
      }

      // If no user or account, the token already has data from previous callback
      // Just return it as-is to preserve Google OAuth data
      console.log('NextAuth: Returning token', {
        hasToken: !!token.token,
        hasUserData: !!token.userData,
        provider: token.provider,
        role: token.role
      })

      return token
    },
    async session({ session, token }: any) {
      console.log('NextAuth: Session callback called', {
        hasToken: !!token,
        tokenKeys: token ? Object.keys(token) : [],
        sessionKeys: session ? Object.keys(session) : [],
        hasSessionUser: !!(session && session.user),
        provider: token?.provider
      })

      if (token) {
        // Ensure session.user exists
        if (!session.user) {
          session.user = {} as any
        }

        session.user.id = token.sub || token.id
        session.user.role = token.role as string
        session.user.token = token.token as string // This is the backend JWT (authToken)
        session.user.isAdmin = token.isAdmin as boolean
        session.user.userData = token.userData
        session.user.provider = token.provider // Track login method
        session.user.isNewUser = token.isNewUser

        console.log('NextAuth: Session updated with token data', {
          userId: session.user.id,
          userRole: session.user.role,
          hasToken: !!session.user.token,
          hasUserData: !!session.user.userData,
          userDataKeys: session.user.userData ? Object.keys(session.user.userData) : [],
          provider: session.user.provider
        })
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
}
