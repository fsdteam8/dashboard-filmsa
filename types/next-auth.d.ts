declare module "next-auth" {
  interface Session {
    accessToken?: string
    refreshToken?: string
    user: {
      id: string
      email: string
      role: string
    }
  }

  interface User {
    id: string
    email: string
    role: string
    accessToken?: string
    refreshToken?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
    refreshToken?: string
    role?: string
  }
}
