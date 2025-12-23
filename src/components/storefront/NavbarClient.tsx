"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { ShoppingCart, ChevronDown, User, LogOut } from "lucide-react"
import { useCart } from "@/store/cart"
import { SearchBar } from "./SearchBar"
import { AnnouncementBar } from "./AnnouncementBar"
import { useThemeStore } from "@/store/theme-store"
import { CartDrawer } from "./CartDrawer"

interface Category {
  id: string
  name: string
  slug: string
  type?: string
  children?: Category[]
}

interface NavbarClientProps {
  categories: Category[]
  children?: React.ReactNode
}

export function NavbarClient({ categories, children }: NavbarClientProps) {
  const items = useCart((state) => state.items)
  const total = useCart((state) => state.total)
  const [mounted, setMounted] = useState(false)
  const { settings } = useThemeStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  const itemCount = mounted ? items.reduce((sum, item) => sum + item.quantity, 0) : 0
  const cartTotal = mounted ? total() : 0
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)

  return (
    <div className="w-full flex flex-col">
      {/* Row 1: Announcement Bar */}
      <AnnouncementBar />

      {/* Row 2: Logo | Search | Actions */}
      <div className="bg-white border-b py-4">
        <div className="container flex items-center justify-between gap-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-2xl flex-shrink-0">
            {settings.media.logoDesktop ? (
              <div className="h-10 w-auto max-w-[180px] flex items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={settings.media.logoDesktop} alt={settings.info.name} className="h-full object-contain" />
              </div>
            ) : (
              <>
                <span className="text-primary">{settings.info.name ? settings.info.name.split(' ')[0] : 'Shopify'}</span>
                {settings.info.name ? settings.info.name.split(' ').slice(1).join(' ') : 'Lite'}
              </>
            )}
          </Link>

          {/* Search Bar (Wide) */}
          <div className="flex-1 max-w-2xl hidden md:block">
            <SearchBar />
          </div>

          {/* Icons */}
          <div className="flex items-center gap-6 flex-shrink-0">
            {/* Account - handled by children (AuthStatus) */}
            {children}

            {/* Cart */}
            <Link
              href="#"
              onClick={(e) => { e.preventDefault(); useCart.getState().openCart() }}
              className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors text-sm font-medium relative"
            >
              <ShoppingCart className="h-6 w-6" />
              <div className="hidden lg:flex flex-col leading-tight">
                <span className="text-[10px] text-muted-foreground uppercase">Warenkorb</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Extra children like AuthStatus or custom buttons */}
            {children}
          </div>
        </div>
      </div>

      {/* Row 3: Navigation Menu (Black Bar) */}
      <div className="bg-black text-white h-12 flex items-center sticky top-0 z-50">
        <div className="container h-full">
          <nav className="flex items-center gap-8 h-full">
            {categories.map((category) => {
              const href = `/collections/${category.slug}`
              const hasSubcategories = category.children && category.children.length > 0

              return (
                <div
                  key={category.id}
                  className="relative h-full flex items-center"
                  onMouseEnter={() => setHoveredCategory(category.id)}
                  onMouseLeave={() => setHoveredCategory(null)}
                >
                  <Link
                    href={href}
                    className="flex items-center gap-1.5 transition-colors hover:text-primary py-2 text-xs font-bold uppercase tracking-wider h-full"
                  >
                    {category.name}
                    {hasSubcategories && <ChevronDown className="h-3 w-3" />}
                  </Link>

                  {/* Dropdown Menu */}
                  {hasSubcategories && hoveredCategory === category.id && (
                    <div className="absolute top-full left-0 w-64 pt-0 animate-in fade-in slide-in-from-top-1 z-[60]">
                      <div className="rounded-b-lg border-x border-b bg-card text-foreground shadow-lg overflow-hidden">
                        <div className="p-2">
                          {category.children!.map((sub) => {
                            const subHref = `/collections/${category.slug}/${sub.slug}`
                            return (
                              <Link
                                key={sub.id}
                                href={subHref}
                                className="block px-4 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                              >
                                {sub.name}
                              </Link>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Cart Drawer Portal */}
      {mounted && <CartDrawer />}
    </div>
  )
}
