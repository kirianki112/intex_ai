"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/hooks/use-auth"
import {
  Users,
  Building2,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  FileText,
  Search,
  MessageSquare,
  Layout,
  FolderOpen,
  Sparkles,
} from "lucide-react"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navigation = [
    { name: "Projects", href: "/dashboard/projects", icon: FolderOpen, description: "AI-powered document creation" },
    { name: "Templates", href: "/dashboard/templates", icon: Layout, description: "Reusable document templates" },
    { name: "Documents", href: "/dashboard/documents", icon: FileText, description: "Knowledge base documents" },
    { name: "Search", href: "/dashboard/search", icon: Search, description: "AI-powered search" },
    { name: "Chat", href: "/dashboard/chat", icon: MessageSquare, description: "Document assistant" },
    { name: "Users", href: "/dashboard/users", icon: Users, description: "User management" },
    { name: "Organization", href: "/dashboard/organization", icon: Building2, description: "Organization settings" },
    { name: "Profile", href: "/dashboard/profile", icon: User, description: "Personal settings" },
  ]

  if (user?.roles.includes("admin")) {
    navigation.push({ name: "Admin", href: "/dashboard/admin", icon: Settings, description: "System administration" })
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border/50 backdrop-blur-xl transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:relative lg:flex lg:flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-20 px-6 border-b border-border/50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-foreground to-muted-foreground rounded-xl flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-background" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Accounts</h1>
                <p className="text-xs text-muted-foreground">AI Document Platform</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground hover:shadow-md"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 transition-transform duration-200 ${isActive ? "" : "group-hover:scale-110"}`}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className={`text-xs ${isActive ? "text-primary-foreground/70" : "text-muted-foreground/70"}`}>
                      {item.description}
                    </div>
                  </div>
                </Link>
              )
            })}
          </nav>

          <div className="p-4 border-t border-border/50">
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-muted/50">
              <Avatar className="h-10 w-10 ring-2 ring-border">
                <AvatarImage src={user?.profile.avatar || ""} alt={user?.profile.full_name} />
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                  {user?.profile.full_name ? getInitials(user.profile.full_name) : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{user?.profile.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <div className="sticky top-0 z-30 flex h-16 items-center gap-x-4 border-b border-border/50 bg-background/95 backdrop-blur-xl px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Button variant="ghost" size="sm" className="lg:hidden hover:bg-muted" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-muted">
                    <Avatar className="h-10 w-10 ring-2 ring-border">
                      <AvatarImage src={user?.profile.avatar || ""} alt={user?.profile.full_name} />
                      <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                        {user?.profile.full_name ? getInitials(user.profile.full_name) : "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 p-2" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal p-3">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold leading-none">{user?.profile.full_name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/dashboard/profile" className="flex items-center p-2 rounded-md">
                      <User className="mr-3 h-4 w-4" />
                      Profile Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={logout}
                    className="cursor-pointer text-destructive focus:text-destructive p-2 rounded-md"
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  )
}