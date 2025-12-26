"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { ShoppingBag, User, ChevronDown, Search, Globe } from "lucide-react"
import { useCart } from "@/store/cart"
import { SearchBar } from "./SearchBar"
import { AnnouncementBar } from "./AnnouncementBar"
import { useThemeStore } from "@/store/theme-store"
import { CartDrawer } from "./CartDrawer"
import { Button } from "@/components/ui/button"

interface Collection {
  id: string
  name: string
  slug: string
}

interface NavbarClientProps {
  collections: Collection[]
  children?: React.ReactNode
}

import { LocaleSelector } from "./LocaleSelector"

export function NavbarClient({ collections, children }: NavbarClientProps) {
  const items = useCart((state) => state.items)
  const [mounted, setMounted] = useState(false)
  const { settings } = useThemeStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  const itemCount = mounted ? items.reduce((sum, item) => sum + item.quantity, 0) : 0

  return (
    <div className="w-full flex flex-col font-sans">
      {/* Row 1: Announcement Bar */}
      <AnnouncementBar />

      {/* Row 2: Main Dark Header */}
      <header className="bg-[#111827] text-white border-b border-white/5 sticky top-0 z-50">
        <div className="container flex items-center h-20 gap-4 md:gap-8">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0 transition-transform hover:scale-105 active:scale-95">
            {settings.media.logoDesktop ? (
              <div className="h-10 w-auto max-w-[200px] flex items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={settings.media.logoDesktop}
                  alt={settings.info.name}
                  className="h-full object-contain "
                />
              </div>
            ) : (
              <div className="flex flex-col leading-none">
                <span className="text-2xl font-black tracking-tighter text-white">
                  {settings.info.name ? settings.info.name.toUpperCase() : 'SHOPIFY'}
                </span>
                <span className="text-[10px] font-bold tracking-[0.2em] text-white/60 ml-0.5">
                  LITE
                </span>
              </div>
            )}
          </Link>

          {/* Center: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 flex-1 px-4">
            {collections.map((collection) => (
              <Link
                key={collection.id}
                href={`/collections/${collection.slug}`}
                className="text-[13px] font-semibold tracking-wide text-white/90 hover:text-white transition-all hover:scale-105 py-2 relative group"
              >
                {collection.name}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all group-hover:w-full" />
              </Link>
            ))}
            <Link
              href="/blog"
              className="text-[13px] font-semibold tracking-wide text-white/90 hover:text-white transition-all hover:scale-105 py-2 relative group"
            >
              Blog
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all group-hover:w-full" />
            </Link>
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-1 sm:gap-4 flex-shrink-0">

            {/* Locale Selector */}
            <LocaleSelector />

            {/* Search */}
            <SearchBar />

            {/* Account (AuthStatus) */}
            {children}

            {/* Cart */}
            <button
              onClick={() => useCart.getState().openCart()}
              className="relative p-2 text-white hover:text-white/80 transition-all hover:scale-110 active:scale-90 group"
              aria-label="View shopping bag"
            >
              <ShoppingBag className="h-6 w-6 stroke-[1.5]" />
              {itemCount > 0 && (
                <span className="absolute top-1 right-1 h-5 w-5 rounded-full bg-white text-[10px] font-extrabold text-[#111827] flex items-center justify-center border-2 border-[#111827] shadow-xl transform transition-transform group-hover:scale-110">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Cart Drawer Portal */}
      {mounted && <CartDrawer />}
    </div>
  )
}
