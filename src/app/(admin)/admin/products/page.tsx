import Link from "next/link"
import React from 'react';
import { Plus, ChevronDown } from "lucide-react"
import { getProductsAction } from "@/actions/products"
import { ProductsTable } from "@/components/admin/ProductsTable"
import { Button } from "@/components/ui/button"
import { ProductActions } from "./ProductActions"

interface AdminProductsPageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

import { getCollectionsAction } from "@/actions/collections"

import { CSVImportExport } from "@/components/admin/products/CSVImportExport"

export default async function AdminProductsPage({ searchParams }: AdminProductsPageProps) {
  const params = await searchParams
  const sortBy = (params?.sort_by as any) || 'created_at'
  const sortOrder = (params?.sort_order as any) || 'desc'
  const categoryId = (params?.category as string) || undefined

  const page = params?.page ? parseInt(params.page as string) : 1
  const limit = 50 // Increased from 15 to show more products per page

  // Parallel data fetching
  const [{ products, totalCount, totalPages }, { collections }] = await Promise.all([
    getProductsAction({
      sortBy,
      sortOrder,
      category: categoryId,
      page,
      limit,
      search: (params?.search as string) || undefined
    }),
    getCollectionsAction()
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <div className="flex items-center gap-2">
          <Button size="sm" asChild>
            <Link href="/admin/products/new">
              <Plus className="mr-2 h-4 w-4" />
              Add product
            </Link>
          </Button>
        </div>
      </div>

      {/* CSV Operations */}
      <CSVImportExport />

      {/* Products Table */}
      <React.Suspense fallback={<div>Loading products...</div>}>
        <ProductsTable
          products={products}
          collections={collections}
          totalCount={totalCount}
          totalPages={totalPages}
          currentPage={page}
        />
      </React.Suspense>
    </div >
  )
}
