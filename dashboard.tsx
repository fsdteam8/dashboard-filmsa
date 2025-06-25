"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "./components/app-sidebar"
import { Header } from "./components/header"
import { Toaster } from "sonner"
import { useState } from "react"
import DashboardPage from "./app/dashboard/page"

export default function AdminDashboard() {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>
        <div className="flex min-h-screen bg-gray-900 w-full">
          <AppSidebar />
          <SidebarInset className="flex-1 w-full">
            <Header />
            <main className="flex-1 w-full bg-gray-900">
              <DashboardPage />
            </main>
          </SidebarInset>
        </div>
        <Toaster />
      </SidebarProvider>
    </QueryClientProvider>
  )
}
