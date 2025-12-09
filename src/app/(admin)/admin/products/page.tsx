import Link from "next/link"
import { Plus, ChevronDown } from "lucide-react"
import { getProductsAction } from "@/actions/products"
import { ProductsTable } from "@/components/admin/ProductsTable"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default async function AdminProductsPage() {
  const products = await getProductsAction()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            Export
          </Button>
          <Button variant="outline" size="sm">
            Import
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                More actions <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Sync inventory</DropdownMenuItem>
              <DropdownMenuItem>Archive selected</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button size="sm" asChild>
            <Link href="/admin/products/new">
              <Plus className="mr-2 h-4 w-4" />
              Add product
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-md border bg-card p-4 shadow-sm">
          <div className="text-xs font-medium text-muted-foreground uppercase mb-2">Average sell-through rate</div>
          <div className="text-2xl font-bold">2% <span className="text-sm font-normal text-muted-foreground">—</span></div>
        </div>
        <div className="rounded-md border bg-card p-4 shadow-sm">
          <div className="text-xs font-medium text-muted-foreground uppercase mb-2">Products by days of inventory remaining</div>
          <div className="text-2xl font-bold text-muted-foreground">No data</div>
        </div>
        <div className="rounded-md border bg-card p-4 shadow-sm">
          <div className="text-xs font-medium text-muted-foreground uppercase mb-2">ABC product analysis</div>
          <div className="text-2xl font-bold">
            $6,580.00 <span className="text-sm font-normal text-muted-foreground">B</span>{' '}
            <span className="text-foreground">$181,375.27</span> <span className="text-sm font-normal text-muted-foreground">C</span>
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            $6,534.00 NULL
          </div>
        </div>
      </div>

      <ProductsTable products={products} />
    </div>
  )
}
