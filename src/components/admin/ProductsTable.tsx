"use client"

import { useState } from "react"
import Link from "next/link"
import {
  MoreHorizontal,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  MoreVertical
} from "lucide-react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Product {
  id: string
  title: string
  status: string
  quantity: number
  categoryId?: string
  categoryName?: string
  images: { url: string }[]
  vendor?: string
}

interface ProductsTableProps {
  products: Product[]
}

export function ProductsTable({ products }: ProductsTableProps) {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [currentTab, setCurrentTab] = useState("all")

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
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter products"
              className="pl-8 bg-background"
            />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="outline" size="icon" className="h-9 w-9">
              <Filter className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-9 w-9">
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id} className="hover:bg-muted/50">
                  <TableCell className="pl-4">
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
                    <Link href={`/admin/products/${product.id}`} className="hover:underline text-sm font-semibold">
                      {product.title}
                    </Link>
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
                      {/* TODO: Add variants availability logic if needed */}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{product.categoryName || 'Uncategorized'}</TableCell>
                  {/* Mocked Columns as per plan */}
                  <TableCell className="text-sm text-muted-foreground text-center">4</TableCell>
                  <TableCell className="text-sm text-muted-foreground text-center">2</TableCell>
                </TableRow>
              ))}
              {filteredProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    No products found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Tabs>
    </div>
  )
}
