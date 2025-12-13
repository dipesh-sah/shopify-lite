import Link from "next/link"
import { Plus } from "lucide-react"
import { getCollectionsAction } from "@/actions/collections"
import { CollectionsTable } from "@/components/admin/CollectionsTable"
import { Button } from "@/components/ui/button"

interface CollectionsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function CollectionsPage(props: CollectionsPageProps) {
  const searchParams = await props.searchParams
  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page) : 1
  const search = typeof searchParams.q === 'string' ? searchParams.q : undefined
  const limit = 20
  const offset = (page - 1) * limit

  const { collections, totalCount } = await getCollectionsAction({ search, limit, offset })
  const totalPages = Math.ceil(totalCount / limit)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Collections</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            More actions
          </Button>
          <Button size="sm" asChild>
            <Link href="/admin/collections/new">
              Create collection
            </Link>
          </Button>
        </div>
      </div>

      <CollectionsTable
        collections={collections}
        totalCount={totalCount}
        currentPage={page}
        totalPages={totalPages}
        searchQuery={search || ""}
      />
    </div>
  )
}
