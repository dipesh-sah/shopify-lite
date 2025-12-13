"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import {
  Search,
  Filter,
  ArrowUpDown,
  Save,
  Check,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { showToast } from "@/components/ui/Toast"
import { updateInventoryAction, InventoryUpdate } from "@/actions/inventory"
import { Badge } from "@/components/ui/badge"

interface InventoryItem {
  productId: string
  productName: string
  variantId?: string | null
  sku: string
  stock: number
  imageUrl?: string
  incoming?: number
  committed?: number
  unavailable?: number
}

interface InventoryTableProps {
  items: InventoryItem[]
  locations: string[] // e.g. ["Alkaline Inc"]
}

export function InventoryTable({ items, locations }: InventoryTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [inventoryChanges, setInventoryChanges] = useState<Record<string, number>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [localSearch, setLocalSearch] = useState(searchParams.get('q') || "")

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      const current = new URLSearchParams(Array.from(searchParams.entries()))
      if (localSearch) {
        current.set('q', localSearch)
      } else {
        current.delete('q')
      }
      const search = current.toString()
      const query = search ? `?${search}` : ""
      if (searchParams.get('q') !== localSearch) {
        router.replace(`${pathname}${query}`, { scroll: false })
      }
    }, 1000)
    return () => clearTimeout(timer)
  }, [localSearch, router, pathname, searchParams])

  const handleStockChange = (key: string, value: string) => {
    const numValue = parseInt(value)
    if (!isNaN(numValue)) {
      setInventoryChanges(prev => ({
        ...prev,
        [key]: numValue
      }))
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const updates: InventoryUpdate[] = Object.entries(inventoryChanges).map(([key, qty]) => {
        const [productId, variantId] = key.split('|')
        return {
          productId,
          variantId: variantId === 'null' ? null : variantId,
          quantity: qty
        }
      })

      if (updates.length === 0) return

      await updateInventoryAction(updates)
      showToast(`${updates.length} inventory items updated`, "success")
      setInventoryChanges({})
      router.refresh()
    } catch (err) {
      showToast("Failed to save inventory", "error")
    } finally {
      setIsSaving(false)
    }
  }

  const getItemKey = (item: InventoryItem) => `${item.productId}|${item.variantId || 'null'}`

  const hasUnsavedChanges = Object.keys(inventoryChanges).length > 0

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-4 border-b">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          Inventory
          <Badge variant="secondary" className="text-sm font-normal text-muted-foreground bg-muted">
            {locations[0]}
          </Badge>
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">Export</Button>
          <Button variant="outline" size="sm">Import</Button>
          <Button size="sm">View products</Button>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <Tabs defaultValue="all" className="w-auto">
          <TabsList className="bg-transparent p-0 h-auto gap-4">
            <TabsTrigger value="all" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1 pb-2">
              All
            </TabsTrigger>
            <TabsTrigger value="incoming" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1 pb-2">
              Incoming
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search inventory"
              className="pl-8"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon"><ArrowUpDown className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-md border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[40px] pl-4"><Checkbox /></TableHead>
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead className="text-right">Unavailable</TableHead>
              <TableHead className="text-right">Committed</TableHead>
              <TableHead className="text-right">Available</TableHead>
              <TableHead className="text-right w-[150px]">On hand</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const key = getItemKey(item)
              const currentStock = inventoryChanges[key] ?? item.stock
              const isChanged = inventoryChanges[key] !== undefined && inventoryChanges[key] !== item.stock

              return (
                <TableRow key={key} className="hover:bg-muted/50">
                  <TableCell className="pl-4"><Checkbox /></TableCell>
                  <TableCell>
                    <div className="h-10 w-10 rounded border bg-muted overflow-hidden">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">IMG</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">{item.productName}</span>
                      {item.variantId && <span className="text-xs text-muted-foreground">Variant ID: {item.variantId}</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{item.sku || '—'}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{item.unavailable || 0}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{item.committed || 0}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{currentStock}</TableCell>
                  <TableCell className="text-right p-2">
                    <div className={`flex items-center justify-end gap-2 border rounded-md px-2 py-1 ${isChanged ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-input'}`}>
                      <Input
                        type="number"
                        className="h-7 w-20 border-0 bg-transparent text-right p-0 focus-visible:ring-0"
                        value={currentStock}
                        onChange={(e) => handleStockChange(key, e.target.value)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                  No inventory found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Footer / Pagination Mock */}
        <div className="flex items-center justify-between px-4 py-4 border-t">
          <div className="text-xs text-muted-foreground">
            Showing {items.length} items
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8" disabled><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>

      {/* Floating Save Bar */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-foreground text-background px-6 py-3 rounded-full shadow-lg flex items-center gap-4 animate-in slide-in-from-bottom-4">
          <span className="font-medium text-sm">{Object.keys(inventoryChanges).length} unsaved changes</span>
          <div className="h-4 w-px bg-background/20" />
          <Button
            size="sm"
            variant="ghost"
            className="text-background hover:text-background/80 hover:bg-background/10"
            onClick={() => setInventoryChanges({})}
          >
            Discard
          </Button>
          <Button
            size="sm"
            className="bg-background text-foreground hover:bg-background/90"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      )}
    </div>
  )
}
