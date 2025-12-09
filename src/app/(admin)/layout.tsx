import { AdminSidebar } from "@/components/admin/Sidebar"
import ToastContainer from '@/components/ui/Toast'
import ConfirmContainer from '@/components/ui/Confirm'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen w-full">
      <AdminSidebar />
      <main className="flex-1 p-6 bg-muted/10">
        {children}
        <ToastContainer />
        <ConfirmContainer />
      </main>
    </div>
  )
}
