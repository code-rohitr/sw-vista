import NextAuth from "next-auth"

declare module "next-auth" {
  interface User {
    id: number
    role: string
    username: string
  }

  interface Session {
    user: User & {
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
} 