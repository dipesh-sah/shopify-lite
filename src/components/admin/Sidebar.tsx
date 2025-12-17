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
  Store
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

import { SettingsModal } from "./SettingsModal"

export function AdminSidebar() {
  const pathname = usePathname()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const renderItem = (item: SidebarItem) => {
    const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
    const isParentActive = item.children?.some(child => pathname.startsWith(child.href)) || isActive

    return (
      <li key={item.href}>
        <Link
          href={item.href}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
            isParentActive
              ? "bg-muted text-primary"
              : "text-muted-foreground hover:bg-muted/50 hover:text-primary"
          )}
        >
          {item.icon && <item.icon className="h-4 w-4" />}
          <span className="flex-1">{item.label}</span>
          {item.badge && (
            <span className="bg-muted-foreground/20 text-muted-foreground text-xs px-1.5 py-0.5 rounded-full">
              {item.badge}
            </span>
          )}
        </Link>
        {item.children && isParentActive && (
          <ul className="ml-9 mt-1 space-y-1">
            {item.children.map(child => {
              const isChildActive = pathname === child.href
              return (
                <li key={child.href}>
                  <Link
                    href={child.href}
                    className={cn(
                      "block px-3 py-2 rounded-md text-sm font-medium transition-colors hover:text-primary",
                      isChildActive
                        ? "text-primary bg-muted/50"
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
    <aside className="w-64 border-r bg-card h-full flex flex-col">
      <div className="p-6 border-b">
        <Link href="/admin" className="flex items-center gap-2 font-bold text-xl">
          <ShoppingBag className="h-6 w-6" />
          <span>Shopify Lite</span>
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {sidebarItems.map(renderItem)}
        </ul>
      </nav>
      <div className="p-4 border-t space-y-1">
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
        <button
          onClick={() => setIsSettingsOpen(true)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors text-muted-foreground hover:bg-muted/50 hover:text-primary"
          )}
        >
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </button>
      </div>

      {isSettingsOpen && <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />}
    </aside>
  )
}
