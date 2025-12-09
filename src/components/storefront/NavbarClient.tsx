'use client'

import Link from "next/link"
import { ShoppingCart, User, Search, LogOut, ChevronDown } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useCart } from "@/store/cart"
import { useEffect, useState } from "react"

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  isActive: boolean
}

interface Subcategory {
  id: string
  name: string
  slug: string
  categoryId: string
  isActive: boolean
}

interface NavbarClientProps {
  categories: Category[]
  subcategories: Subcategory[]
}

export function NavbarClient({ categories, subcategories }: NavbarClientProps) {
  const { user, signOut } = useAuth()
  const items = useCart((state) => state.items)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const itemCount = mounted ? items.reduce((sum, item) => sum + item.quantity, 0) : 0

  const [showUserMenu, setShowUserMenu] = useState(false)
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)

  const handleSignOut = async () => {
    try {
      await signOut()
      setShowUserMenu(false)
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  // Helper to get subcategories for a category
  const getCategorySubcategories = (categoryId: string) => {
    return subcategories.filter(sub => sub.categoryId === categoryId)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <span className="text-primary">Shopify</span>Lite
        </Link>

        <nav className="hidden md:flex gap-6 text-sm font-medium h-full items-center">
          <Link href="/" className="transition-colors hover:text-primary">
            Home
          </Link>

          {categories.map((category) => {
            const categorySubcategories = getCategorySubcategories(category.id)
            const hasSubcategories = categorySubcategories.length > 0

            return (
              <div
                key={category.id}
                className="relative h-full flex items-center"
                onMouseEnter={() => setHoveredCategory(category.id)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                <Link
                  href={`/categories/${category.slug}`}
                  className="flex items-center gap-1 transition-colors hover:text-primary py-4"
                >
                  {category.name}
                  {hasSubcategories && <ChevronDown className="h-3 w-3" />}
                </Link>

                {/* Dropdown Menu */}
                {hasSubcategories && hoveredCategory === category.id && (
                  <div className="absolute top-full left-0 w-64 pt-2 animate-in fade-in slide-in-from-top-2">
                    <div className="rounded-lg border bg-card shadow-lg overflow-hidden">
                      <div className="p-2">
                        {categorySubcategories.map((sub) => (
                          <Link
                            key={sub.id}
                            href={`/categories/${category.slug}/${sub.slug}`}
                            className="block px-4 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-accent rounded-full">
            <Search className="h-5 w-5" />
          </button>
          <Link href="/cart" className="p-2 hover:bg-accent rounded-full relative">
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="p-2 hover:bg-accent rounded-full transition-colors"
              >
                <User className="h-5 w-5" />
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-lg border bg-card shadow-lg animate-in fade-in slide-in-from-top-2 z-50">
                  <div className="p-4 border-b">
                    <p className="text-sm font-medium truncate">{user.email}</p>
                  </div>
                  <div className="p-2 space-y-1">
                    <Link
                      href="/account"
                      className="block px-4 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      My Account
                    </Link>
                    <Link
                      href="/orders"
                      className="block px-4 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      My Orders
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm rounded-md hover:bg-accent transition-colors flex items-center gap-2 text-red-600 hover:text-red-700"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link href="/signin" className="text-sm hover:text-primary font-medium">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
