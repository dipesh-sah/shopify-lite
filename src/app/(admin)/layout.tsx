"use client"

import { useState } from "react"
import { AdminSidebar } from "@/components/admin/Sidebar"
import { AdminHeader } from "@/components/admin/Header"
import ToastContainer from '@/components/ui/Toast'
import ConfirmContainer from '@/components/ui/Confirm'
import { usePathname } from 'next/navigation'
import { Sheet, SheetContent } from "@/components/ui/sheet"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isLoginPage = pathname === '/admin/login' || pathname === '/admin/login/verify-2fa'

  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-background">
        {children}
        <ToastContainer />
        <ConfirmContainer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full bg-muted/10">
      {/* Desktop Sidebar - Sticky */}
      <div className="hidden md:block w-64 flex-shrink-0 sticky top-0 h-screen self-start border-r">
        <AdminSidebar className="w-full h-full" />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-72">
          <AdminSidebar className="w-full h-full border-none" />
        </SheetContent>
      </Sheet>

      <div className="flex flex-col flex-1">
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 md:p-6">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
          <ToastContainer />
          <ConfirmContainer />
        </main>
      </div>
    </div>
  )
}
