"use client";

import {
  LayoutDashboard,
  Film,
  FileVideo,
  CreditCard,
  LogOut,
  Megaphone,
  LucidePanelsTopLeft,
  FolderMinusIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import Image from "next/image";

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Genres",
    url: "/dashboard/genres",
    icon: Film,
  },
  {
    title: "Movies",
    url: "/dashboard/content",
    icon: FileVideo,
  },
  {
    title: "Series",
    url: "/dashboard/series",
    icon: FileVideo,
  },
  {
    title: "Subscription",
    url: "/dashboard/subscription",
    icon: CreditCard,
  },
  {
    title: "Advertisement",
    url: "/dashboard/ads",
    icon: Megaphone,
  },
  {
    title: "Opinion Form",
    url: "/dashboard/form-submissions",
    icon: FolderMinusIcon,
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  const handleSignOut = async () => {
    localStorage.removeItem("auth_token");
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <Sidebar className="w-64 bg-white ">
      <SidebarContent className="bg-white">
        <SidebarGroup className="p-0">
          <div className="flex items-center justify-center py-5">
            <Image
              src="/logo.jpg"
              alt="azlo"
              height={300}
              width={300}
              className="h-[50px] w-[130px]"
            />
          </div>
          <SidebarGroupContent className="px-0 mt-4">
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title} className="px-4">
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    className={`w-full justify-start px-4  text-gray-600 hover:text-gray-900 hover:bg-gray-300 text-[#111111] rounded-lg transition-colors ${
                      pathname === item.url
                        ? "!bg-[#111] !text-white font-medium"
                        : ""
                    }`}
                  >
                    <Link
                      href={item.url}
                      className="flex items-center gap-2 py-6"
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="text-lg font-semibold">
                        {item.title}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="bg-white border-t ">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleSignOut}
              className="w-full justify-start px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5 mr-3" />
              <span className="text-sm">Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
