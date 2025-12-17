"use client"

import { AdminSidebar } from "@/components/admin/Sidebar"
import ToastContainer from '@/components/ui/Toast'
import ConfirmContainer from '@/components/ui/Confirm'
import { usePathname } from 'next/navigation'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/admin/login' || pathname === '/admin/login/verify-2fa'

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {!isLoginPage && <AdminSidebar />}
      <main className={`flex-1 overflow-y-auto ${isLoginPage ? '' : 'p-6 bg-muted/10'}`}>
        {children}
        <ToastContainer />
        <ConfirmContainer />
      </main>
    </div>
  )
}
