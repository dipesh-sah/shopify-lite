"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  MoreHorizontal,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  MoreVertical,
  Trash2
} from "lucide-react"
import { deleteProductAction, bulkUpdateProductsStatusAction } from "@/actions/products"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Product {
  id: string
  productNumber?: string
  title: string
  status: string
  quantity: number
  categoryId?: string
  categoryName?: string
  images: { url: string }[]
  vendor?: string
}

interface Collection {
  id: string
  name: string
}

interface ProductsTableProps {
  products: Product[]
  collections: Collection[]
  totalCount?: number
  totalPages?: number
  currentPage?: number
}

export function ProductsTable({
  products,
  collections = [],
  totalCount = 0,
  totalPages = 1,
  currentPage = 1
}: ProductsTableProps) {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [currentTab, setCurrentTab] = useState("all")
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | 'bulk' | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || "")

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm !== (searchParams.get('search') || "")) {
        handleSearch(searchTerm)
      }
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm])

  const handleSort = (sortBy: string, sortOrder: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort_by', sortBy)
    params.set('sort_order', sortOrder)
    router.push(`?${params.toString()}`)
  }

  const handleFilter = (categoryId: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (categoryId) {
      params.set('category', categoryId)
    } else {
      params.delete('category')
    }
    params.set('page', '1') // Reset to page 1 on filter
    router.push(`?${params.toString()}`)
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', newPage.toString())
    router.push(`?${params.toString()}`)
  }

  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (term) {
      params.set('search', term)
    } else {
      params.delete('search')
    }
    params.set('page', '1') // Reset to page 1 on search
    router.push(`?${params.toString()}`)
  }

  const handleDeleteClick = (id: string) => {
    setDeleteTarget(id)
  }

  const handleBulkDeleteClick = () => {
    setDeleteTarget('bulk')
  }

  const handleBulkArchive = async () => {
    if (selectedProducts.length === 0) return
    setIsDeleting(true)
    try {
      await bulkUpdateProductsStatusAction(selectedProducts, 'archived')
      setSelectedProducts([])
      router.refresh()
    } catch (error) {
      alert("Failed to archive products")
    } finally {
      setIsDeleting(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return

    setIsDeleting(true)
    try {
      if (deleteTarget === 'bulk') {
        await Promise.all(selectedProducts.map(id => deleteProductAction(id)))
        setSelectedProducts([])
      } else {
        await deleteProductAction(deleteTarget)
      }
      router.refresh()
      setDeleteTarget(null)
    } catch (error) {
      alert("Failed to delete product(s)")
    } finally {
      setIsDeleting(false)
    }
  }

  const filteredProducts = products.filter(product => {
    if (currentTab === "all") return true
    return product.status === currentTab
  })

  const toggleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id))
    }
  }

  const toggleSelect = (id: string) => {
    if (selectedProducts.includes(id)) {
      setSelectedProducts(selectedProducts.filter(p => p !== id))
    } else {
      setSelectedProducts([...selectedProducts, id])
    }
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="all" className="w-full" onValueChange={setCurrentTab}>
        <div className="flex items-center justify-between">
          <TabsList className="bg-transparent p-0 border-b w-full justify-start rounded-none h-auto">
            <TabsTrigger value="all" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 py-2 text-sm">All</TabsTrigger>
            <TabsTrigger value="active" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 py-2 text-sm">Active</TabsTrigger>
            <TabsTrigger value="draft" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 py-2 text-sm">Draft</TabsTrigger>
            <TabsTrigger value="archived" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 py-2 text-sm">Archived</TabsTrigger>
            <TabsTrigger value="plus" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 py-2 text-sm">
              <Plus className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex items-center gap-2 py-4">
          {selectedProducts.length > 0 ? (
            <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-md border border-primary/20 animate-in fade-in slide-in-from-top-1">
              <span className="text-sm font-medium mr-2">
                {selectedProducts.length} selected
              </span>
              <Button
                variant="destructive"
                size="sm"
                className="h-8 gap-1.5"
                onClick={handleBulkDeleteClick}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={handleBulkArchive}
              >
                Archive
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => setSelectedProducts([])}
              >
                Clear
              </Button>
            </div>
          ) : (
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter products"
                className="pl-8 bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Filter by Collection</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/admin/products?page=1${searchTerm ? `&search=${searchTerm}` : ''}`}>
                  All Collections
                </Link>
              </DropdownMenuItem>
              {collections.map((col) => (
                <DropdownMenuItem key={col.id} asChild>
                  <Link href={`/admin/products?page=1&category=${col.id}${searchTerm ? `&search=${searchTerm}` : ''}`}>
                    {col.name}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/admin/products?sort_by=created_at&sort_order=desc&page=1${searchParams.get('category') ? `&category=${searchParams.get('category')}` : ''}${searchTerm ? `&search=${searchTerm}` : ''}`}>
                  Newest first
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/admin/products?sort_by=created_at&sort_order=asc&page=1${searchParams.get('category') ? `&category=${searchParams.get('category')}` : ''}${searchTerm ? `&search=${searchTerm}` : ''}`}>
                  Oldest first
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/admin/products?sort_by=title&sort_order=asc&page=1${searchParams.get('category') ? `&category=${searchParams.get('category')}` : ''}${searchTerm ? `&search=${searchTerm}` : ''}`}>
                  Title (A-Z)
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/admin/products?sort_by=title&sort_order=desc&page=1${searchParams.get('category') ? `&category=${searchParams.get('category')}` : ''}${searchTerm ? `&search=${searchTerm}` : ''}`}>
                  Title (Z-A)
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/admin/products?sort_by=price&sort_order=asc&page=1${searchParams.get('category') ? `&category=${searchParams.get('category')}` : ''}${searchTerm ? `&search=${searchTerm}` : ''}`}>
                  Price (Low-High)
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/admin/products?sort_by=price&sort_order=desc&page=1${searchParams.get('category') ? `&category=${searchParams.get('category')}` : ''}${searchTerm ? `&search=${searchTerm}` : ''}`}>
                  Price (High-Low)
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/admin/products?sort_by=quantity&sort_order=asc&page=1${searchParams.get('category') ? `&category=${searchParams.get('category')}` : ''}${searchTerm ? `&search=${searchTerm}` : ''}`}>
                  Inventory (Low-High)
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/admin/products?sort_by=quantity&sort_order=desc&page=1${searchParams.get('category') ? `&category=${searchParams.get('category')}` : ''}${searchTerm ? `&search=${searchTerm}` : ''}`}>
                  Inventory (High-Low)
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>


        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-[40px] pl-4">
                  <Checkbox
                    checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-[80px]"></TableHead>
                <TableHead className="font-medium text-xs uppercase text-muted-foreground">Product</TableHead>
                <TableHead className="font-medium text-xs uppercase text-muted-foreground">Status</TableHead>
                <TableHead className="font-medium text-xs uppercase text-muted-foreground">Inventory</TableHead>
                <TableHead className="font-medium text-xs uppercase text-muted-foreground">Category</TableHead>
                <TableHead className="font-medium text-xs uppercase text-muted-foreground text-center">Channels</TableHead>
                <TableHead className="font-medium text-xs uppercase text-muted-foreground text-center">Catalogs</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow
                  key={product.id}
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={(e) => {
                    // Don't navigate if clicking on checkbox or delete button
                    const target = e.target as HTMLElement
                    if (target.closest('button') || target.closest('[role="checkbox"]')) {
                      return
                    }
                    router.push(`/admin/products/${product.id}`)
                  }}
                >
                  <TableCell className="pl-4" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedProducts.includes(product.id)}
                      onCheckedChange={() => toggleSelect(product.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="h-10 w-10 rounded-md border bg-muted overflow-hidden">
                      {product.images[0] ? (
                        <img
                          src={product.images[0].url}
                          alt={product.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
                          <Plus className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="hover:underline text-sm font-semibold block">
                      {product.title}
                    </div>
                    {product.productNumber && (
                      <span className="text-xs text-muted-foreground">{product.productNumber}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`
                        font-normal border-0 px-2.5 py-0.5 rounded-full capitalize
                        ${product.status === 'active' ? 'bg-green-100 text-green-700 hover:bg-green-100' :
                          product.status === 'draft' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' :
                            product.status === 'suspended' ? 'bg-red-100 text-red-700 hover:bg-red-100' :
                              'bg-gray-100 text-gray-700 hover:bg-gray-100'}
                      `}
                    >
                      {product.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={`text-sm ${product.quantity <= 0 ? "text-red-600" : "text-muted-foreground"}`}>
                      {product.quantity} in stock
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{product.categoryName || 'Uncategorized'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground text-center">4</TableCell>
                  <TableCell className="text-sm text-muted-foreground text-center">2</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteClick(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center">
                    No products found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-end gap-2 py-4">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            Next
          </Button>
        </div>
      </Tabs >

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the
              {deleteTarget === 'bulk' ? ` ${selectedProducts.length} selected products` : ' selected product'}
              and remove data from our servers.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  )
}
