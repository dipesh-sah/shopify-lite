"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import {
  MoreHorizontal,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  ImageIcon,
  Trash2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { deleteCollectionAction } from "@/actions/collections"

interface Collection {
  id: string
  name: string
  description?: string
  productIds?: string[]
  conditions?: any[]
  type: 'manual' | 'smart'
  image?: string
  isActive?: boolean
  hideFromNav?: boolean
  productsCount?: number
}

interface CollectionsTableProps {
  collections: Collection[]
  totalCount: number
  currentPage: number
  totalPages: number
  searchQuery: string
}


export function CollectionsTable({ collections, totalCount, currentPage, totalPages, searchQuery: initialSearch }: CollectionsTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [selectedCollections, setSelectedCollections] = useState<string[]>([])
  // We use local state for input to avoid lagging, but sync with URL on debounce
  const [searchQuery, setSearchQuery] = useState(initialSearch)

  // Sync state with URL params (e.g. back button)
  useEffect(() => {
    setSearchQuery(initialSearch)
  }, [initialSearch])

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only push if the local state differs from the URL state (prop)
      if (searchQuery !== initialSearch) {
        const params = new URLSearchParams(searchParams.toString())
        if (searchQuery) {
          params.set('q', searchQuery)
        } else {
          params.delete('q')
        }
        params.set('page', '1') // Reset to page 1 on search
        router.push(`${pathname}?${params.toString()}`)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery, router, pathname, searchParams, initialSearch])


  const toggleSelectAll = () => {
    // Select only visible collections
    if (selectedCollections.length === collections.length) {
      setSelectedCollections([])
    } else {
      setSelectedCollections(collections.map(c => c.id))
    }
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`${pathname}?${params.toString()}`)
  }

  const toggleSelect = (id: string) => {
    if (selectedCollections.includes(id)) {
      setSelectedCollections(selectedCollections.filter(c => c !== id))
    } else {
      setSelectedCollections([...selectedCollections, id])
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this collection?")) {
      await deleteCollectionAction(id)
      router.refresh()
    }
  }

  const handleBulkDelete = async () => {
    if (confirm(`Are you sure you want to delete ${selectedCollections.length} collections?`)) {
      try {
        await Promise.all(selectedCollections.map(id => deleteCollectionAction(id)));
        setSelectedCollections([]);
        router.refresh();
      } catch (error) {
        alert("Failed to delete some collections");
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-1 bg-background rounded-lg ">
        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-8">All</Button>
          <Button variant="ghost" size="icon" className="h-8 w-8"><Plus className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="flex items-center gap-2 py-2">
        {selectedCollections.length > 0 ? (
          <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-md border border-primary/20 animate-in fade-in slide-in-from-top-1">
            <span className="text-sm font-medium mr-2">
              {selectedCollections.length} selected
            </span>
            <Button
              variant="destructive"
              size="sm"
              className="h-8 gap-1.5"
              onClick={handleBulkDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => setSelectedCollections([])}
            >
              Clear
            </Button>
          </div>
        ) : (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search collections"
              className="pl-8 bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}
        <div className="flex items-center gap-2 ml-auto">
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[40px] pl-4">
                <Checkbox
                  checked={collections.length > 0 && selectedCollections.length === collections.length}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead className="font-medium text-xs uppercase text-muted-foreground">Title</TableHead>
              <TableHead className="font-medium text-xs uppercase text-muted-foreground">Products</TableHead>
              <TableHead className="font-medium text-xs uppercase text-muted-foreground">Product conditions</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {collections.map((collection) => (
              <TableRow key={collection.id} className="hover:bg-muted/50 group">
                <TableCell className="pl-4">
                  <Checkbox
                    checked={selectedCollections.includes(collection.id)}
                    onCheckedChange={() => toggleSelect(collection.id)}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/collections/${collection.id}`} className="hover:underline text-sm font-semibold">
                      {collection.name}
                    </Link>
                    {collection.hideFromNav && (
                      <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                        Hidden
                      </span>
                    )}
                  </div>
                  {collection.description && (
                    <div className="text-xs text-muted-foreground truncate max-w-[300px]">
                      {collection.description.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ')}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {collection.productsCount || 0}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {collection.type === 'smart' ? (
                    <div className="flex flex-col gap-1">
                      {collection.conditions?.map((c, i) => (
                        <span key={i} className="text-xs">{c.field} {c.operator} {c.value}</span>
                      ))}
                    </div>
                  ) : (
                    <span>Manual</span>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(collection.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {collections.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No collections found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          Showing {collections.length} of {totalCount} collections
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            Previous
          </Button>
          <div className="text-sm border px-3 py-1 rounded">
            {currentPage} / {totalPages || 1}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
