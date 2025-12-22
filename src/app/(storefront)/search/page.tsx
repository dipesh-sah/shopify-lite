import { Suspense } from "react"
import { getProductsAction } from "@/actions/products"
import { getActiveCollections } from "@/lib/collections"
import { ProductCard } from "@/components/storefront/ProductCard"
import { SearchFilters } from "@/components/storefront/SearchFilters"
import { Search } from "lucide-react"

interface SearchPageProps {
  searchParams: {
    q?: string
    sort?: string
    minPrice?: string
    maxPrice?: string
    category?: string
    inStock?: string
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const query = params?.q || ""
  const sort = params?.sort || "relevance"
  const minPrice = params?.minPrice ? parseFloat(params.minPrice) : undefined
  const maxPrice = params?.maxPrice ? parseFloat(params.maxPrice) : undefined
  const category = params?.category || undefined
  const inStock = params?.inStock === 'true'

  // Parse sort parameter
  const [sortBy, sortOrder] = sort.includes('-')
    ? sort.split('-') as [string, 'asc' | 'desc']
    : [sort, 'desc'] as [string, 'asc' | 'desc']

  let products = []
  let totalCount = 0

  if (query.trim()) {
    const result = await getProductsAction({
      search: query,
      status: "active",
      limit: 50,
      sortBy: sortBy as any,
      sortOrder,
      minPrice,
      maxPrice,
      category,
      inStock
    })
    products = result.products
    totalCount = result.totalCount
  }

  // Get categories for filter
  const categories = await getActiveCollections()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Search Results</h1>
        {query && (
          <p className="text-muted-foreground">
            {totalCount > 0 ? (
              <>Searching for "{query}"</>
            ) : (
              <>No results found for "{query}"</>
            )}
          </p>
        )}
      </div>

      {query.trim() && (
        <SearchFilters categories={categories} totalResults={totalCount} />
      )}

      {!query.trim() ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Start Searching</h2>
          <p className="text-muted-foreground max-w-md">
            Enter a search term above to find products by name, description, or SKU
          </p>
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">No Results Found</h2>
          <p className="text-muted-foreground max-w-md">
            We couldn't find any products matching "{query}". Try different keywords or check your spelling.
          </p>
        </div>
      )}
    </div>
  )
}
