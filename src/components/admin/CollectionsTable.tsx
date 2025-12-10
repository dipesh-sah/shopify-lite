"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  MoreHorizontal,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  ImageIcon
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
}

interface CollectionsTableProps {
  collections: Collection[]
}

export function CollectionsTable({ collections }: CollectionsTableProps) {
  const router = useRouter()
  const [selectedCollections, setSelectedCollections] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  const filteredCollections = collections.filter(collection =>
    collection.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleSelectAll = () => {
    if (selectedCollections.length === filteredCollections.length) {
      setSelectedCollections([])
    } else {
      setSelectedCollections(filteredCollections.map(c => c.id))
    }
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-1 bg-background rounded-lg ">
        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-8">All</Button>
          <Button variant="ghost" size="icon" className="h-8 w-8"><Plus className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="flex items-center gap-2 py-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search collections"
            className="pl-8 bg-background"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
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
                  checked={selectedCollections.length === filteredCollections.length && filteredCollections.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead className="w-[80px]"></TableHead>
              <TableHead className="font-medium text-xs uppercase text-muted-foreground">Title</TableHead>
              <TableHead className="font-medium text-xs uppercase text-muted-foreground">Products</TableHead>
              <TableHead className="font-medium text-xs uppercase text-muted-foreground">Product conditions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCollections.map((collection) => (
              <TableRow key={collection.id} className="hover:bg-muted/50 group">
                <TableCell className="pl-4">
                  <Checkbox
                    checked={selectedCollections.includes(collection.id)}
                    onCheckedChange={() => toggleSelect(collection.id)}
                  />
                </TableCell>
                <TableCell>
                  <div className="h-10 w-10 rounded-md border bg-muted overflow-hidden flex items-center justify-center">
                    {collection.image ? (
                      <img
                        src={collection.image}
                        alt={collection.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-muted-foreground opacity-50" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  <Link href={`/admin/collections/${collection.id}`} className="hover:underline text-sm font-semibold">
                    {collection.name}
                  </Link>
                  <div className="text-xs text-muted-foreground truncate max-w-[300px]">
                    {collection.description}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {collection.productIds?.length || 0}
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
              </TableRow>
            ))}
            {filteredCollections.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No collections found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
