"use client"

import type React from "react"
import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Header } from "@/components/header"
import { Toaster } from "sonner"
import { useState } from "react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [queryClient] = useState(() => new QueryClient())
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return // Still loading

    if (!session) {
      router.push("/login")
      return
    }

    // Store the token in localStorage for API calls
    if (session.accessToken) {
      localStorage.setItem("auth_token", session.accessToken)
    }
  }, [session, status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#111" }}>
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null // Will redirect to login
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>
        <div className="flex min-h-screen w-full" style={{ backgroundColor: "#111" }}>
          <AppSidebar />
          <SidebarInset className="flex-1 w-full">
            <Header />
            <main className="flex-1 w-full" style={{ backgroundColor: "#111" }}>
              {children}
            </main>
          </SidebarInset>
        </div>
        <Toaster />
      </SidebarProvider>
    </QueryClientProvider>
  )
}
