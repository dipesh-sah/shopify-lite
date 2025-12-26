"use client"

import Link from "next/link"
import { User, LogOut, ShoppingBag, Settings, LayoutDashboard, Heart } from "lucide-react"
import { logoutAction } from "@/actions/customer-auth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState, useEffect } from "react"
import { getSessionAction } from "@/actions/customer-auth"

export function AuthStatus({ initialUser }: { initialUser?: any }) {
  const [user, setUser] = useState<any>(initialUser)
  const [loading, setLoading] = useState(!initialUser)

  useEffect(() => {
    if (!initialUser) {
      async function checkSession() {
        try {
          const session = await getSessionAction()
          setUser(session)
        } catch (error) {
          console.error("Failed to fetch session:", error)
        } finally {
          setLoading(false)
        }
      }
      checkSession()
    }
  }, [initialUser])

  if (loading) {
    return (
      <div className="p-2 text-white/20 animate-pulse">
        <User className="h-6 w-6 stroke-[1.5]" />
      </div>
    )
  }

  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button suppressHydrationWarning className="flex items-center gap-2 text-white hover:text-white/80 transition-all group outline-none">
            <User className="h-5 w-5 stroke-[1.5]" />
            <div className="hidden lg:flex flex-col leading-tight text-left">
              <span className="text-[10px] text-white/50 uppercase font-bold tracking-wider group-hover:text-white transition-colors">Account</span>
              <span className="text-xs font-semibold max-w-[80px] truncate">{user.firstName}</span>
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px] bg-[#1f2937] border-white/10 text-white p-1">
          <DropdownMenuLabel className="px-3 py-2 text-xs font-bold text-white/50 uppercase">
            My Account
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-white/5" />
          <DropdownMenuItem asChild>
            <Link href="/account" className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-white/5 rounded-md focus:bg-white/10 transition-colors">
              <User className="h-4 w-4" />
              <span className="text-sm">Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/orders" className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-white/5 rounded-md focus:bg-white/10 transition-colors">
              <ShoppingBag className="h-4 w-4" />
              <span className="text-sm">Orders</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/account/wishlist" className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-white/5 rounded-md focus:bg-white/10 transition-colors">
              <Heart className="h-4 w-4" />
              <span className="text-sm">Wishlist</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/account/settings" className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-white/5 rounded-md focus:bg-white/10 transition-colors">
              <Settings className="h-4 w-4" />
              <span className="text-sm">Settings</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-white/5" />
          <form action={logoutAction}>
            <button type="submit" className="flex w-full items-center gap-2 px-3 py-2 cursor-pointer hover:bg-red-500/10 text-red-400 rounded-md focus:bg-red-500/20 transition-colors">
              <LogOut className="h-4 w-4" />
              <span className="text-sm font-medium">Log out</span>
            </button>
          </form>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button suppressHydrationWarning className="p-2 text-white hover:text-white/80 transition-all hover:scale-110 active:scale-95 group relative outline-none" aria-label="Account">
          <User className="h-6 w-6 stroke-[1.5]" />
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-white transition-all group-hover:w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px] bg-[#1f2937] border-white/10 text-white p-1">
        <DropdownMenuItem asChild>
          <Link href="/signin" className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-white/5 rounded-md focus:bg-white/10 transition-colors font-semibold">
            <span className="text-sm">Sign In</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/signup" className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-white/5 rounded-md focus:bg-white/10 transition-colors text-white/70">
            <span className="text-sm">Create Account</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
