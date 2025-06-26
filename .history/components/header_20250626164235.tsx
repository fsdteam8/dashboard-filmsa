"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown, User, Settings, LogOut } from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"

export function Header() {
  const { data: session } = useSession()

  const handleSignOut = async () => {
    localStorage.removeItem("auth_token")
    await signOut({ callbackUrl: "/login" })
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-6 py-4 w-full h-[84px]">
      <div className="flex items-center justify-between w-full">
        <div className="flex-1" />
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-3 text-gray-900 hover:text-gray-600 focus:outline-none">
            <div className="text-right">
              <div className="text-sm font-medium">{session?.user?.email?.split("@")[0] || "Admin"}</div>
              <div className="text-xs text-gray-500 capitalize">{session?.user?.role || "Admin"}</div>
            </div>
            <Avatar className="h-8 w-8">
              <AvatarImage src="/placeholder-user.jpg" />
              <AvatarFallback className="bg-gray-200 text-gray-900">
                {session?.user?.email?.charAt(0).toUpperCase() || "A"}
              </AvatarFallback>
            </Avatar>
            <ChevronDown className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[#272727] *:text-white border-gray-200 w-64">
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="font-medium border-b border-gray-200">{session?.user?.email}</div>
              <div className="text-sm text-gray-300 capitalizeborder-b border-gray-200">@{session?.user?.role}</div>
            </div>
            <DropdownMenuItem asChild className="text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-4 py-3">
              <Link href="/dashboard/personal-information" className="flex items-center">
                <User className="h-4 w-4 mr-3" />
                Personal Information
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                window.location.href = "/dashboard/personal-information"
              }}
              className="text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-4 py-3"
            >
              <Settings className="h-4 w-4 mr-3" />
              Change Password
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-4 py-3"
            >
              <LogOut className="h-4 w-4 mr-3" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
