'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getProductAction, updateProductAction, getMediaAction } from "@/actions/products"
import { getCollectionsAction, getSubcategoriesAction } from "@/actions/collections"
import { getAttributeGroupsAction } from "@/actions/attributes"
import { showToast } from '@/components/ui/Toast'
import { Button } from "@/components/ui/button"
import Spinner from '@/components/ui/Spinner'
import { ImagePicker } from "@/components/admin/ImagePicker"
import { ArrowLeft } from "lucide-react"

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [product, setProduct] = useState<any>(null)
  const [images, setImages] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [productId, setProductId] = useState<string>("")
  const [categories, setCategories] = useState<any[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [subcategories, setSubcategories] = useState<any[]>([])
  const [subsLoading, setSubsLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [variants, setVariants] = useState<any[]>([])
  const [variantForm, setVariantForm] = useState({ sku: '', priceDelta: '', stock: '', optionsSelected: {} as Record<string, string>, image: '' })
  const [mediaList, setMediaList] = useState<any[]>([])
  const [mediaLoading, setMediaLoading] = useState<boolean>(true)
  const [savingVariants, setSavingVariants] = useState<Record<string, boolean>>({})
  const [variantErrors, setVariantErrors] = useState<Record<string, string>>({})
  const [attributeGroups, setAttributeGroups] = useState<any[]>([])
  const [attrsLoading, setAttrsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const resolvedParams = await params
      setProductId(resolvedParams.id)

      // Load product
      const data = await getProductAction(resolvedParams.id)
      if (data) {
        const productData = data as any
        setProduct(productData)
        setImages(productData.images || [])
        setTags(productData.tags || [])
        setVariants(productData.variants || [])
      }

      // Load categories
      try {
        const cats = await getCollectionsAction()
        setCategories(cats)
      } catch (error) {
        console.error('Failed to load categories:', error)
      } finally {
        setCategoriesLoading(false)
      }

      // Load subcategories for product's category
      if (data?.categoryId) {
        try {
          setSubsLoading(true)
          setSelectedCategory(data.categoryId)
          const subs = await getSubcategoriesAction(data.categoryId)
          setSubcategories(subs)
        } catch (err) {
          console.error('Failed to load subcategories:', err)
        } finally {
          setSubsLoading(false)
        }
      }
      // load attribute groups
      try {
        setAttrsLoading(true)
        const a = await getAttributeGroupsAction()
        setAttributeGroups(a)
      } catch (err) {
        console.error('Failed to load attribute groups', err)
      } finally {
        setAttrsLoading(false)
      }
      // load media
      try {
        setMediaLoading(true)
        const m = await getMediaAction()
        setMediaList(m)
      } catch (err) {
        console.error('Failed to load media', err)
      } finally {
        setMediaLoading(false)
      }
    }
    loadData()
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    formData.append('images', JSON.stringify(images))
    formData.append('tags', JSON.stringify(tags))
    formData.append('productId', productId)
    formData.append('variants', JSON.stringify(variants))

    try {
      await updateProductAction(formData)
      router.push('/admin/products')
      router.refresh()
    } catch (error) {
      console.error(error)
      showToast('Failed to update product', 'error')
    } finally {
      setLoading(false)
    }
  }

  function addTag() {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput("")
    }
  }

  function removeTag(tag: string) {
    setTags(tags.filter(t => t !== tag))
  }

  function addVariant() {
    const options = { ...variantForm.optionsSelected }
    const priceDelta = variantForm.priceDelta ? parseFloat(variantForm.priceDelta) : 0
    const stock = variantForm.stock ? parseInt(variantForm.stock) : 0
    const v = { id: `tmp-${Date.now()}`, sku: variantForm.sku, priceDelta, stock, options, images: variantForm.image ? [variantForm.image] : [] }
    setVariants([...variants, v])
    setVariantForm({ sku: '', priceDelta: '', stock: '', optionsSelected: {}, image: '' })
  }

  function removeVariant(idx: number) {
    setVariants(variants.filter((_, i) => i !== idx))
  }

  async function saveVariant(idx: number) {
    const v = variants[idx]
    if (!v || !productId) return

    const id = v.id
    setSavingVariants(prev => ({ ...prev, [id]: true }))
    setVariantErrors(prev => ({ ...prev, [id]: '' }))

    const payload = {
      productId,
      variantId: v.id,
      sku: v.sku,
      stock: typeof v.stock === 'number' ? v.stock : parseInt(v.stock || '0'),
      priceDelta: v.priceDelta,
      mediaIds: v.mediaIds || [],
      options: v.options || {},
    }

    try {
      const res = await fetch('/api/variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed')
      // Update local state to reflect saved variant
      const copy = [...variants]
      copy[idx] = { ...copy[idx], updatedAt: new Date().toISOString() }
      setVariants(copy)
      setVariantErrors(prev => ({ ...prev, [id]: '' }))
    } catch (err: any) {
      console.error('Failed to save variant', err)
      setVariantErrors(prev => ({ ...prev, [id]: err?.message || String(err) }))
    } finally {
      setSavingVariants(prev => ({ ...prev, [id]: false }))
    }
  }

  async function adjustStock(idx: number, delta: number) {
    const v = variants[idx]
    if (!v) return
    const newStock = (Number(v.stock) || 0) + delta
    const copy = [...variants]
    copy[idx] = { ...copy[idx], stock: newStock }
    setVariants(copy)
    // Save change immediately
    try {
      await saveVariant(idx)
    } catch (err) {
      // error state handled in saveVariant
    }
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Edit Product</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Product Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                defaultValue={product.name}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows={4}
                defaultValue={product.description}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="categoryId" className="block text-sm font-medium mb-2">
                  Category *
                </label>
                <select
                  id="categoryId"
                  name="categoryId"
                  required
                  disabled={categoriesLoading}
                  defaultValue={product?.categoryId || ""}
                  onChange={async (e) => {
                    const val = e.target.value
                    setSelectedCategory(val)
                    if (val) {
                      try {
                        setSubsLoading(true)
                        const subs = await getSubcategoriesAction(val)
                        setSubcategories(subs)
                      } catch (err) {
                        console.error('Failed to load subcategories:', err)
                        setSubcategories([])
                      } finally {
                        setSubsLoading(false)
                      }
                    } else {
                      setSubcategories([])
                    }
                  }}
                  className="w-full px-3 py-2 border rounded-md bg-white"
                >
                  <option value="">Select a category...</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="sku" className="block text-sm font-medium mb-2">
                  SKU
                </label>
                <input
                  type="text"
                  id="sku"
                  name="sku"
                  defaultValue={product.sku}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>
            {/* Subcategory selector */}
            <div className="mt-3">
              <label htmlFor="subcategoryId" className="block text-sm font-medium mb-2">
                Subcategory
              </label>
              <select id="subcategoryId" name="subcategoryId" defaultValue={product?.subcategoryId || ""} disabled={subsLoading} className="w-full px-3 py-2 border rounded-md bg-white">
                <option value="">Select a subcategory (optional)</option>
                {subcategories.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Pricing</h2>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="price" className="block text-sm font-medium mb-2">
                Price ($) *
              </label>
              <input
                type="number"
                id="price"
                name="price"
                required
                step="0.01"
                min="0"
                defaultValue={product.price}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label htmlFor="compareAtPrice" className="block text-sm font-medium mb-2">
                Compare at Price ($)
              </label>
              <input
                type="number"
                id="compareAtPrice"
                name="compareAtPrice"
                step="0.01"
                min="0"
                defaultValue={product.compareAtPrice}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label htmlFor="costPrice" className="block text-sm font-medium mb-2">
                Cost Price ($)
              </label>
              <input
                type="number"
                id="costPrice"
                name="costPrice"
                step="0.01"
                min="0"
                defaultValue={product.costPrice}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
        </div>

        {/* Variants */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Variants</h2>

          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-3">
              <input value={variantForm.sku} onChange={(e) => setVariantForm(prev => ({ ...prev, sku: e.target.value }))} placeholder="SKU" className="px-3 py-2 border rounded-md col-span-1" />
              <input value={variantForm.priceDelta} onChange={(e) => setVariantForm(prev => ({ ...prev, priceDelta: e.target.value }))} placeholder="Price delta (e.g., 10 or -5)" className="px-3 py-2 border rounded-md col-span-1" />
              <input value={variantForm.stock} onChange={(e) => setVariantForm(prev => ({ ...prev, stock: e.target.value }))} placeholder="Stock" className="px-3 py-2 border rounded-md col-span-1" />
              <div className="col-span-1">
                {attrsLoading ? (
                  <div className="text-sm text-muted-foreground">Loading attributes...</div>
                ) : (
                  <div className="space-y-1">
                    {attributeGroups.map((g) => (
                      <div key={g.id} className="flex items-center gap-2">
                        <label className="text-xs w-24">{g.name}</label>
                        <select value={variantForm.optionsSelected[g.name] || ''} onChange={(e) => setVariantForm(prev => ({ ...prev, optionsSelected: { ...prev.optionsSelected, [g.name]: e.target.value } }))} className="px-2 py-1 border rounded-md">
                          <option value="">—</option>
                          {(g.options || []).map((opt: string) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <Button type="button" onClick={addVariant} variant="outline">Add Variant</Button>
            </div>

            {variants.length > 0 && (
              <div className="space-y-2">
                {variants.map((v, idx) => (
                  <div key={v.id} className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <p className="font-medium">{v.sku} {v.priceDelta ? `(${v.priceDelta >= 0 ? '+' : ''}${v.priceDelta})` : ''}</p>
                      <p className="text-xs text-muted-foreground">Stock: {v.stock} — Options: {Object.entries(v.options || {}).map(([k, val]) => `${k}:${val}`).join(', ')}</p>
                      {v.mediaIds && v.mediaIds.length > 0 && (
                        (() => {
                          const mediaId = v.mediaIds[0]
                          const media = mediaList.find(m => m.id === mediaId)
                          return media && media.url ? (
                            <img src={media.url} alt="variant" className="mt-2 h-12 w-12 object-cover rounded" />
                          ) : null
                        })()
                      )}
                      {!mediaLoading && (
                        <div className="mt-2">
                          <label className="text-xs block mb-1">Variant Image</label>
                          <select value={(v.mediaIds && v.mediaIds[0]) || ''} onChange={(e) => {
                            const newVal = e.target.value
                            const copy = [...variants]
                            copy[idx] = { ...copy[idx], mediaIds: newVal ? [newVal] : [] }
                            setVariants(copy)
                          }} className="px-2 py-1 border rounded-md">
                            <option value="">— No image —</option>
                            {mediaList.map(m => (
                              <option key={m.id} value={m.id}>{m.name || m.id}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="mt-2 grid grid-cols-3 gap-2">
                        <input className="px-2 py-1 border rounded" value={v.sku || ''} onChange={(e) => {
                          const copy = [...variants]
                          copy[idx] = { ...copy[idx], sku: e.target.value }
                          setVariants(copy)
                        }} placeholder="SKU" disabled={!!savingVariants[v.id]} />
                        <div className="flex items-center gap-2">
                          <button type="button" className="px-2 py-1 border rounded" onClick={() => adjustStock(idx, -1)} disabled={!!savingVariants[v.id]}>-</button>
                          <input type="number" className="px-2 py-1 border rounded w-24 text-center" value={v.stock || 0} onChange={(e) => {
                            const copy = [...variants]
                            copy[idx] = { ...copy[idx], stock: parseInt(e.target.value || '0') }
                            setVariants(copy)
                          }} placeholder="Stock" disabled={!!savingVariants[v.id]} />
                          <button type="button" className="px-2 py-1 border rounded" onClick={() => adjustStock(idx, 1)} disabled={!!savingVariants[v.id]}>+</button>
                        </div>
                        <Button type="button" onClick={() => saveVariant(idx)} variant="secondary" disabled={!!savingVariants[v.id]}>
                          {savingVariants[v.id] ? (
                            <><Spinner className="h-4 w-4 mr-2" />Saving...</>
                          ) : (
                            'Save'
                          )}
                        </Button>
                      </div>
                      {variantErrors[v.id] && (
                        <p className="text-sm text-red-500 mt-1">{variantErrors[v.id]}</p>
                      )}
                    </div>
                    <div>
                      <Button type="button" variant="ghost" onClick={() => removeVariant(idx)}>Remove</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Inventory */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Inventory</h2>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="stock" className="block text-sm font-medium mb-2">
                Stock Quantity
              </label>
              <input
                type="number"
                id="stock"
                name="stock"
                min="0"
                defaultValue={product.stock || 0}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label htmlFor="lowStockThreshold" className="block text-sm font-medium mb-2">
                Low Stock Alert
              </label>
              <input
                type="number"
                id="lowStockThreshold"
                name="lowStockThreshold"
                min="0"
                defaultValue={product.lowStockThreshold || 5}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label htmlFor="barcode" className="block text-sm font-medium mb-2">
                Barcode
              </label>
              <input
                type="text"
                id="barcode"
                name="barcode"
                defaultValue={product.barcode}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Product Images</h2>
          <ImagePicker images={images} onChange={setImages} />
        </div>

        {/* Shipping */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Shipping</h2>

          <div className="grid grid-cols-4 gap-4">
            <div>
              <label htmlFor="weight" className="block text-sm font-medium mb-2">
                Weight (kg)
              </label>
              <input
                type="number"
                id="weight"
                name="weight"
                step="0.01"
                min="0"
                defaultValue={product.weight}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label htmlFor="length" className="block text-sm font-medium mb-2">
                Length (cm)
              </label>
              <input
                type="number"
                id="length"
                name="length"
                step="0.1"
                min="0"
                defaultValue={product.dimensions?.length}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label htmlFor="width" className="block text-sm font-medium mb-2">
                Width (cm)
              </label>
              <input
                type="number"
                id="width"
                name="width"
                step="0.1"
                min="0"
                defaultValue={product.dimensions?.width}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label htmlFor="height" className="block text-sm font-medium mb-2">
                Height (cm)
              </label>
              <input
                type="number"
                id="height"
                name="height"
                step="0.1"
                min="0"
                defaultValue={product.dimensions?.height}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
        </div>

        {/* SEO */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">SEO</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="seoTitle" className="block text-sm font-medium mb-2">
                SEO Title
              </label>
              <input
                type="text"
                id="seoTitle"
                name="seoTitle"
                defaultValue={product.seoTitle}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label htmlFor="seoDescription" className="block text-sm font-medium mb-2">
                SEO Description
              </label>
              <textarea
                id="seoDescription"
                name="seoDescription"
                rows={3}
                defaultValue={product.seoDescription}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update Product"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
