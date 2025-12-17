import Link from "next/link"
import { getCustomers } from "@/lib/customers"
import { CustomersTable } from "@/components/admin/customers/CustomersTable"
import { Button } from "@/components/ui/button"
import { Plus, Upload, Download } from "lucide-react"

export default async function AdminCustomersPage() {
  const { customers } = await getCustomers({ limit: 50 })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9">
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" size="sm" className="h-9">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Link href="/admin/customers/new">
            <Button size="sm" className="h-9">
              <Plus className="mr-2 h-4 w-4" />
              Add customer
            </Button>
          </Link>
        </div>
      </div>

      <CustomersTable customers={customers} />
    </div>
  )
}
