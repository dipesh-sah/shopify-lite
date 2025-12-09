'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from "@/contexts/AuthContext"
import { useEffect } from "react"
import { LogOut, ShoppingBag, User, MapPin, Settings } from 'lucide-react'

export default function AccountPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin')
    }
  }, [user, loading, router])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading your account...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 md:px-6 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">My Account</h1>
          <p className="text-muted-foreground">Manage your profile and orders</p>
        </div>

        {/* Account Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
          {/* Profile Card */}
          <div className="rounded-lg border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Account</p>
                <p className="font-semibold text-sm break-all">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full inline-flex h-10 items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>

          {/* Orders Card */}
          <Link
            href="/orders"
            className="rounded-lg border bg-card p-6 shadow-sm hover:shadow-md transition-all hover:border-primary/50"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="w-7 h-7 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Orders</p>
                <p className="font-semibold text-sm">View all orders</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Track and manage your purchases, view order details and status.
            </p>
          </Link>

          {/* Shipping Addresses Card */}
          <div className="rounded-lg border bg-card p-6 shadow-sm opacity-60 pointer-events-none">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
                <MapPin className="w-7 h-7 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Addresses</p>
                <p className="font-semibold text-sm">Manage addresses</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Coming soon
            </p>
          </div>

          {/* Settings Card */}
          <div className="rounded-lg border bg-card p-6 shadow-sm opacity-60 pointer-events-none">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-purple-50 rounded-full flex items-center justify-center flex-shrink-0">
                <Settings className="w-7 h-7 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Settings</p>
                <p className="font-semibold text-sm">Account settings</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Coming soon
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Quick Actions</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/products"
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
            >
              Continue Shopping
            </Link>
            <Link
              href="/"
              className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-6 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
