
"use client"

import { Bell, Search, Menu, User, LogOut, Settings as SettingsIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { logoutAction } from "@/actions/auth"
import { Badge } from "@/components/ui/badge"
import { useThemeStore } from "@/store/theme-store"

interface AdminHeaderProps {
  onMenuClick: () => void
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const router = useRouter()
  const { settings } = useThemeStore()

  const handleSignOut = async () => {
    await logoutAction()
    router.push('/signin')
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6 shadow-sm">
      <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </Button>

      <div className="hidden md:flex items-center gap-2 mr-4">
        <span className="text-sm font-semibold text-muted-foreground">Store:</span>
        <Badge variant="outline" className="font-medium bg-muted/50">{settings.info.name || "Main Store"}</Badge>
      </div>

      <div className="w-full flex-1">
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-full bg-background pl-8 md:w-[200px] lg:w-[320px]"
            />
          </div>
        </form>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-600" />
          <span className="sr-only">Notifications</span>
        </Button>
      </div>
    </header>
  )
}
