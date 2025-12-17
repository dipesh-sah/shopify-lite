import Link from "next/link"
import { getCompaniesAction } from "@/actions/companies"
import { CompaniesTable } from "@/components/admin/companies/CompaniesTable"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default async function AdminCompaniesPage() {
  const { companies } = await getCompaniesAction({ limit: 50 })

  /* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
  // @ts-ignore
  const mappedCompanies = companies.map(c => ({
    ...c,
    orderingStatus: c.orderingStatus || 'not_approved',
    locationCount: c.locationCount || 0
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Companies</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/companies/new">
            <Button size="sm" className="h-9">
              <Plus className="mr-2 h-4 w-4" />
              Add company
            </Button>
          </Link>
        </div>
      </div>

      <CompaniesTable companies={mappedCompanies} />
    </div>
  )
}
