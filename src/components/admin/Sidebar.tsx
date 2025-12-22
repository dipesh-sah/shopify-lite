"use client"

import { useState } from 'react'
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  Settings,
  Tag,
  Percent,
  Archive,
  ShoppingCart,
  ChevronDown,
  Image,
  Star,
  Store,
  LogOut,
  FileText
} from "lucide-react"

interface SidebarItem {
  icon?: any
  label: string
  href: string
  badge?: number
  children?: SidebarItem[]
}

const sidebarItems: SidebarItem[] = [
  { icon: LayoutDashboard, label: "Home", href: "/admin" },
  { icon: ShoppingCart, label: "Orders", href: "/admin/orders" },
  {
    icon: Package,
    label: "Products",
    href: "/admin/products",
    children: [
      { label: "Collections", href: "/admin/collections" },
      { label: "Inventory", href: "/admin/inventory" },
    ]
  },
  {
    icon: Users,
    label: "Customers",
    href: "/admin/customers",
    children: [
      { label: "Segments", href: "/admin/segments" },
      { label: "Companies", href: "/admin/companies" },
    ]
  },
  { icon: Percent, label: "Discounts", href: "/admin/discounts" },
  { icon: Image, label: "Media", href: "/admin/media" },
  { icon: Star, label: "Reviews", href: "/admin/reviews" },
]


import { logoutAction } from "@/actions/auth"
import { useRouter } from "next/navigation"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function AdminSidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await logoutAction()
    router.push('/admin/login')
  }

  const renderItem = (item: SidebarItem) => {
    // ... (keep existing renderItem implementation)
    const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
    const isParentActive = item.children?.some(child => pathname.startsWith(child.href)) || isActive

    return (
      <li key={item.href}>
        <Link
          href={item.href}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
            isParentActive
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted/50 hover:text-primary"
          )}
        >
          {item.icon && <item.icon className="h-4 w-4" />}
          <span className="flex-1">{item.label}</span>
          {item.badge && (
            <span className="bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded-full font-bold">
              {item.badge}
            </span>
          )}
        </Link>
        {item.children && isParentActive && (
          <ul className="ml-9 mt-1 space-y-1 border-l pl-2">
            {item.children.map(child => {
              const isChildActive = pathname === child.href
              return (
                <li key={child.href}>
                  <Link
                    href={child.href}
                    className={cn(
                      "block px-3 py-2 rounded-md text-sm font-medium transition-colors hover:text-primary",
                      isChildActive
                        ? "text-primary font-bold"
                        : "text-muted-foreground"
                    )}
                  >
                    {child.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </li>
    )
  }

  return (
    <aside className={cn("border-r bg-card h-full flex flex-col", className)}>
      <div className="p-6 border-b flex items-center gap-2">
        <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
          <ShoppingBag className="h-5 w-5" />
        </div>
        <span className="font-bold text-xl tracking-tight">Shopify Lite</span>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {sidebarItems.map(renderItem)}
        </ul>
      </nav>
      <div className="p-4 border-t bg-muted/10 space-y-1">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors text-muted-foreground hover:bg-muted/50 hover:text-primary"
          )}
        >
          <Store className="h-4 w-4" />
          <span>Visit Website</span>
        </a>
        <Link
          href="/admin/settings"
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors text-muted-foreground hover:bg-muted/50 hover:text-primary",
            pathname === "/admin/settings" && "bg-primary/10 text-primary"
          )}
        >
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </Link>
        <button
          onClick={handleLogout}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors text-red-600 hover:bg-red-50"
          )}
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>

    </aside>
  )
}
