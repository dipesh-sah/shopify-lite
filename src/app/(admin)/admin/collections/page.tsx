import Link from "next/link"
import { Plus } from "lucide-react"
import { getCollectionsAction } from "@/actions/collections"
import { CollectionsTable } from "@/components/admin/CollectionsTable"
import { Button } from "@/components/ui/button"

export default async function CollectionsPage() {
  const collections = await getCollectionsAction()

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

      <CollectionsTable collections={collections} />
    </div>
  )
}
