
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ChevronLeft,
  Search,
  X,
  ImageIcon,
  Globe,
  Calendar
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { updateCollectionAction, createCollectionAction } from "@/actions/collections"
import { getProductsAction as fetchProducts } from "@/actions/products"
import { ImagePicker } from "@/components/admin/ImagePicker"
import { RichTextEditor } from "@/components/admin/RichTextEditor"
import { MetafieldsRenderer } from "@/components/admin/metadata/MetafieldsRenderer"
import { cn } from "@/lib/utils"
import { Product } from "@/lib/products"
import Loading from "@/components/ui/Loading"

interface CollectionFormProps {
  collection?: any
  initialSelectedProducts?: Product[]
}

export function CollectionForm({ collection, initialSelectedProducts = [] }: CollectionFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: collection?.name || '',
    description: collection?.description || '',
    slug: (collection?.slug || '').replace(/^\/+/, ''),
    type: collection?.type || 'manual', // 'manual' | 'smart'
    productIds: collection?.productIds || [] as string[],
    image: collection?.image || '',
    seoTitle: collection?.seoTitle || '',
    seoDescription: collection?.seoDescription || '',
    isActive: collection?.isActive !== false, // default true
    hideFromNav: collection?.hideFromNav || false,
    metafields: [] as any[]
  })

  // Selected Products Cache (starts with initial, adds more as we browse)
  const [productsCache, setProductsCache] = useState<Record<string, Product>>(() => {
    const cache: Record<string, Product> = {}
    if (Array.isArray(initialSelectedProducts)) {
      initialSelectedProducts.forEach(p => cache[p.id] = p)
    }
    return cache
  })

  // Update formData when productIds change to ensure we keep cache in sync if needed? 
  // Actually we just need to render the selected ones.
  const selectedProducts: Product[] = (formData.productIds as string[]).map(id => productsCache[id]).filter((p): p is Product => !!p)

  // Products UI state
  const [productSearch, setProductSearch] = useState("") // For the main input (quick add) - functionality reduced or moved to browse
  const [isEditingSEO, setIsEditingSEO] = useState(false)

  // Browse modal state
  const [browseOpen, setBrowseOpen] = useState(false)
  const [browseSearch, setBrowseSearch] = useState("")
  const [browseSelected, setBrowseSelected] = useState<string[]>([])
  const [browseSearchResults, setBrowseSearchResults] = useState<Product[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Debounced search for Browse Modal
  useEffect(() => {
    if (!browseOpen) return

    // Initial load if empty
    if (!browseSearch && browseSearchResults.length === 0) {
      fetchProducts({ limit: 20 })
        .then((res) => setBrowseSearchResults(res.products || []))
        .catch(console.error)
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const results = await fetchProducts({ search: browseSearch, limit: 20 })
        setBrowseSearchResults(results.products || [])
        // Update cache with new results found
        setProductsCache(prev => {
          const next = { ...prev }
          results.products.forEach((p: any) => next[p.id] = p)
          return next
        })
      } catch (err) {
        console.error("Search failed", err)
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [browseSearch, browseOpen])


  const handleSave = async () => {
    setLoading(true)
    try {
      const dataToSave = {
        ...formData,
        slug: formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      }

      if (collection) {
        await updateCollectionAction(collection.id, dataToSave)
      } else {
        await createCollectionAction(dataToSave)
      }
      router.push("/admin/collections")
      router.refresh()
    } catch (error) {
      console.error("Error saving:", error)
      alert("Failed to save collection")
    } finally {
      setLoading(false)
    }
  }

  const addProduct = (productId: string) => {
    setFormData(prev => {
      if (!prev.productIds.includes(productId)) {
        return { ...prev, productIds: [...prev.productIds, productId] }
      }
      return prev
    })
  }

  const removeProduct = (id: string) => {
    setFormData(prev => ({ ...prev, productIds: prev.productIds.filter((pid: string) => pid !== id) }))
  }

  const handleBrowseOpen = () => {
    setBrowseSelected([...formData.productIds])
    setBrowseOpen(true)
    if (!browseSearch) {
      // Trigger initial load logic via effect or manual
      // Effect handles it
    }
  }

  const handleBrowseSave = () => {
    setFormData(prev => ({ ...prev, productIds: browseSelected }))
    setBrowseOpen(false)
  }

  const toggleBrowseProduct = (id: string) => {
    setBrowseSelected(prev =>
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    )
  }

  return (
    <div className="max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/collections" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold">{collection ? collection.name : "Create collection"}</h1>
        </div>
        <div className="flex items-center gap-2">
          {collection && <Button variant="secondary" size="sm">View</Button>}
          <Button variant="secondary" size="sm">More actions</Button>
          <Button onClick={handleSave} disabled={loading} size="sm">
            {loading && <Loading variant="inline" size="sm" />}
            {loading ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const name = e.target.value;
                    const generateSlug = (txt: string) => txt.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

                    setFormData(prev => {
                      const newSlug = generateSlug(name);
                      // Normalize check: removing leading slashes just in case
                      const currentSlugClean = prev.slug.replace(/^\/+/, '');
                      const nameStub = generateSlug(prev.name);

                      const currentSlugMatchesName = currentSlugClean === nameStub;

                      // Update slug if:
                      // 1. It's a new collection (!collection)
                      // 2. The current slug is empty
                      // 3. The current slug was already in sync with the name (smart update)
                      const shouldUpdateSlug = !collection || !prev.slug || currentSlugMatchesName;

                      return {
                        ...prev,
                        name,
                        slug: shouldUpdateSlug ? newSlug : prev.slug,
                        seoTitle: name
                      };
                    });
                  }}
                  placeholder="e.g. Summer collection, Under $100, etc."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <div className="rounded-md">
                  <RichTextEditor
                    value={formData.description}
                    onChange={(val) => setFormData(prev => ({ ...prev, description: val }))}
                    className="min-h-[200px]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Products</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products" // This input is now mostly visual or used for... disabling for now/using just as trigger
                    className="pl-8"
                    value={productSearch}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProductSearch(e.target.value)}
                    onClick={handleBrowseOpen} // Open browse on click for better UX now
                    readOnly // Make it read-only to force modal usage for simplicity & performance
                  />
                </div>
                <Button variant="outline" onClick={handleBrowseOpen}>Browse</Button>
                <Select defaultValue="best-selling">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="best-selling">Best selling</SelectItem>
                    <SelectItem value="title-asc">Product title A-Z</SelectItem>
                    <SelectItem value="title-desc">Product title Z-A</SelectItem>
                    <SelectItem value="price-asc">Highest price</SelectItem>
                    <SelectItem value="price-desc">Lowest price</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                    <SelectItem value="manual">Manually</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-0 divide-y border rounded-md">
                {selectedProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center gap-3 p-3 hover:bg-muted/30 group">
                    <div className="w-6 text-muted-foreground text-sm">{index + 1}.</div>
                    <div className="h-10 w-10 rounded border bg-muted flex items-center justify-center overflow-hidden">
                      {product.images?.[0] ? <img src={product.images[0].url} className="h-full w-full object-cover" /> : <ImageIcon className="h-4 w-4 opacity-50" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{product.title}</div>
                    </div>
                    <Badge variant={product.status === 'active' ? 'default' : 'secondary'} className={cn("capitalize", product.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-100' : '')}>
                      {product.status}
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100" onClick={() => removeProduct(product.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {selectedProducts.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    No products in this collection
                  </div>
                )}
              </div>
            </CardContent>
            <div className="p-4 border-t text-center">
              <Button variant="link" className="text-blue-600" onClick={handleBrowseOpen}>Show more products</Button>
            </div>
          </Card>

          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Search engine listing</CardTitle>
              <div
                role="button"
                className="text-blue-600 text-sm hover:underline cursor-pointer"
                onClick={() => setIsEditingSEO(!isEditingSEO)}
              >
                Edit
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditingSEO ? (
                <>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Page title</label>
                    <Input
                      value={formData.seoTitle}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, seoTitle: e.target.value })}
                      placeholder={formData.name}
                    />
                    <div className="text-xs text-muted-foreground">0 of 70 characters used</div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Meta description</label>
                    <Textarea
                      value={formData.seoDescription}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, seoDescription: e.target.value })}
                      placeholder={formData.description}
                      className="min-h-[80px]"
                    />
                    <div className="text-xs text-muted-foreground">0 of 320 characters used</div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">URL handle</label>
                    <div className="flex items-center">
                      <span className="bg-muted px-3 py-2 border border-r-0 rounded-l-md text-sm text-muted-foreground">https://your-store.com/collections/</span>
                      <Input
                        value={formData.slug}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, slug: e.target.value })}
                        className="rounded-l-none"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-sm text-muted-foreground">Add a title and description to see how this collection might appear in a search engine listing</div>
                  <div className="pt-2">
                    <div className="text-blue-600 text-lg font-medium leading-none mb-1">{formData.seoTitle || formData.name || "Collection Name"}</div>
                    <div className="text-green-700 text-sm mb-1">https://your-store.com/collections/{formData.slug || "collection-handle"}</div>
                    <div className="text-gray-600 text-sm">{formData.seoDescription || formData.description || "Collection description..."}</div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">

          {/* Metafields */}
          <MetafieldsRenderer
            ownerType="collection"
            ownerId={collection?.id}
            onChange={(metafields) => setFormData(prev => ({ ...prev, metafields }))}
          />


          <Card>
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
              <h3 className="font-semibold text-sm">Image</h3>
              <Button variant="link" className="h-auto p-0 text-blue-600">Edit</Button>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="border rounded-md p-2 bg-muted/10 min-h-[150px] flex items-center justify-center relative">
                {formData.image ? (
                  <div className="relative group w-full">
                    <img src={formData.image} className="w-full rounded object-contain max-h-[200px]" alt="Collection" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <Button variant="secondary" size="sm" onClick={() => setFormData({ ...formData, image: '' })}>Remove</Button>
                    </div>
                  </div>
                ) : (
                  <ImagePicker
                    images={[]}
                    onChange={(imgs) => {
                      if (imgs[0]) setFormData({ ...formData, image: imgs[0] })
                    }}
                    maxImages={1}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Active Status</label>
                  <p className="text-xs text-muted-foreground">Visible on storefront</p>
                </div>
                <Checkbox
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: !!checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Hide from navigation</label>
                  <p className="text-xs text-muted-foreground">Hides this from the main menu</p>
                </div>
                <Checkbox
                  checked={formData.hideFromNav}
                  onCheckedChange={(checked) => setFormData({ ...formData, hideFromNav: !!checked })}
                />
              </div>
            </CardContent>
          </Card>


        </div>
      </div>

      <Dialog open={browseOpen} onOpenChange={setBrowseOpen}>
        <DialogContent className="max-w-2xl bg-background p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>Add products to collection</DialogTitle>
          </DialogHeader>
          <div className="p-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products"
                className="pl-8"
                value={browseSearch}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBrowseSearch(e.target.value)}
              />
              {isSearching && <Loading variant="inline" size="sm" className="absolute right-3 top-2.5" />}
            </div>
            <div className="border rounded-md h-[400px] overflow-y-auto divide-y">
              {browseSearchResults.map(p => (
                <div key={p.id} className="flex items-center gap-3 p-3 hover:bg-muted/50">
                  <Checkbox
                    checked={browseSelected.includes(p.id)}
                    onCheckedChange={() => toggleBrowseProduct(p.id)}
                  />
                  <div className="h-10 w-10 shrink-0 rounded border bg-muted flex items-center justify-center overflow-hidden">
                    {p.images?.[0] ? <img src={p.images[0].url} className="h-full w-full object-cover" /> : <ImageIcon className="h-4 w-4 opacity-50" />}
                  </div>
                  <span className="flex-1 text-sm font-medium">{p.title}</span>
                  <Badge variant={p.status === 'active' ? 'default' : 'secondary'} className={cn("capitalize", p.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-100' : '')}>
                    {p.status}
                  </Badge>
                </div>
              ))}
              {!isSearching && browseSearchResults.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2">
                  <span className="text-sm">No products found</span>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="p-4 border-t bg-muted/10">
            <div className="flex-1 flex items-center text-sm text-muted-foreground">
              {browseSelected.length} products selected
            </div>
            <Button variant="outline" onClick={() => setBrowseOpen(false)}>Cancel</Button>
            <Button onClick={handleBrowseSave}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
