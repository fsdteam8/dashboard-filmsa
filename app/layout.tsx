import type React from "react"
import type { Metadata } from "next"
import { Inter, Manrope } from "next/font/google"
import "./globals.css"
// import { NextAuthProvider } from "@/components/providers/session-provider"
// import { getServerSession } from "next-auth/next"
import { Toaster } from "sonner"
import AuthSessionProvider from "@/components/providers/session-provider"

const inter = Inter({ subsets: ["latin"] })
const manrope = Manrope({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Admin dashboard for content management",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // const session = await getServerSession()

  return (
    <html lang="en">
      <body className={manrope.className}>
        <AuthSessionProvider>


          {children}
        </AuthSessionProvider>
          <Toaster />
        
      </body>
    </html>
  )
}
