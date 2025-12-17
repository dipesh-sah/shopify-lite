'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getProductAction, updateProductAction, getMediaAction } from "@/actions/products"
import { getCollectionsAction, getSubcategoriesAction } from "@/actions/collections"
import { getTaxClassesAction } from "@/actions/tax"

import { showToast } from '@/components/ui/Toast'
import { Button } from "@/components/ui/button"
import Spinner from '@/components/ui/Spinner'
import { ImagePicker } from "@/components/admin/ImagePicker"
import { MultiSelect } from "@/components/ui/multi-select"
import { ProductOptions } from "@/components/admin/ProductOptions"
import { VariantsTable, Variant } from "@/components/admin/VariantsTable"
import { ArrowLeft } from "lucide-react"

export default function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [product, setProduct] = useState<any>(null)
  const [images, setImages] = useState<string[]>([])
  // const [tags, setTags] = useState<string[]>([]) // Tags removed per request
  const [productId, setProductId] = useState<string>("")
  const [categories, setCategories] = useState<any[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [subcategories, setSubcategories] = useState<any[]>([])
  const [subsLoading, setSubsLoading] = useState(false)
  const [selectedCollections, setSelectedCollections] = useState<string[]>([])
  const [taxClasses, setTaxClasses] = useState<any[]>([])

  // New Variant System State
  const [options, setOptions] = useState<any[]>([])
  const [variants, setVariants] = useState<Variant[]>([])

  const [mediaList, setMediaList] = useState<any[]>([])
  const [mediaLoading, setMediaLoading] = useState<boolean>(true)

  useEffect(() => {
    async function loadData() {
      const resolvedParams = await params
      setProductId(resolvedParams.id)

      // Load product
      const data = await getProductAction(resolvedParams.id)
      if (data) {
        const productData = data as any
        setProduct(productData)
        setImages(productData.images?.map((img: any) => img.url) || [])
        // setTags(productData.tags || [])
        setSelectedCollections(productData.collectionIds || [])

        const existingVariants = (productData.variants || []).map((v: any) => ({
          ...v,
          stock: v.inventoryQuantity,
          images: v.images || (v.image ? [v.image] : [])
        }))
        setVariants(existingVariants)

        // Reconstruct options from variants if not present (simple inference)
        if (existingVariants.length > 0) {
          const derivedOptions: any[] = []
          const firstVar = existingVariants[0]
          if (firstVar.options) {
            Object.keys(firstVar.options).forEach((optName, idx) => {
              const values = new Set<string>()
              existingVariants.forEach((v: any) => {
                if (v.options && v.options[optName]) values.add(v.options[optName])
              })
              derivedOptions.push({
                id: `opt-${idx}`,
                name: optName,
                values: Array.from(values)
              })
            })
            setOptions(derivedOptions)
          }
        }
      }

      // Load categories
      try {
        const { collections } = await getCollectionsAction()
        setCategories(collections)
      } catch (error) {
        console.error('Failed to load categories:', error)
      } finally {
        setCategoriesLoading(false)
      }

      // Load tax classes
      try {
        const tClasses = await getTaxClassesAction()
        setTaxClasses(tClasses)
      } catch (e) { console.error(e) }

      // Load subcategories for product's category
      if (data?.categoryId) {
        try {
          setSubsLoading(true)
          // setSelectedCategory(data.categoryId)
          const subs = await getSubcategoriesAction(data.categoryId)
          setSubcategories(subs)
        } catch (err) {
          console.error('Failed to load subcategories:', err)
        } finally {
          setSubsLoading(false)
        }
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

  // Generate variants when options change (preserving existing data)
  useEffect(() => {
    // Only generate if we have options (avoid clearing on initial load before options are set)
    if (options.length === 0 && variants.length === 0) return

    // Filter out incomplete options
    const validOptions = options.filter(o => o.name && o.values.length > 0)
    if (options.length > 0 && validOptions.length === 0) {
      // User cleared all options
      setVariants([])
      return
    }
    if (validOptions.length === 0) return

    // Helper to generate Cartesian product
    const cartesian = (args: any[]): any[][] => {
      const r: any[][] = []
      const max = args.length - 1
      function helper(arr: any[], i: number) {
        for (let j = 0, l = args[i].length; j < l; j++) {
          const a = arr.slice(0)
          a.push(args[i][j])
          if (i === max) r.push(a)
          else helper(a, i + 1)
        }
      }
      helper([], 0)
      return r
    }

    // 1. Prepare values arrays
    const valuesArrays = validOptions.map(o => o.values)

    // 2. Generate combinations
    const combinations = cartesian(valuesArrays)

    // 3. Map to variant objects
    const newVariants = combinations.map(combo => {
      const variantOptions: Record<string, string> = {}
      combo.forEach((val: string, idx: number) => {
        variantOptions[validOptions[idx].name] = val
      })

      const title = combo.join(' / ')

      // Try to match with existing variants to preserve price/sku/stock/id/image
      // Matching by title is usually safe if title is deterministic (Red / S)
      // Or matching by exact options match
      const existing = variants.find(v => {
        // Check if all options match
        const opts = v.options || {}
        return Object.keys(variantOptions).every(k => opts[k] === variantOptions[k]) &&
          Object.keys(opts).every(k => variantOptions[k] === opts[k])
      })

      return existing ? { ...existing, title } : {
        id: `v-${Date.now()}-${Math.random()}`,
        title,
        sku: '',
        price: product?.price || 0,
        stock: 0,
        options: variantOptions,
        images: []
      }
    })

    // Only update if dimensions changed to avoid loops (simple check: length)
    // A better check would be deep comparison, but length + title check is usually enough for simple cases
    const currentTitles = new Set(variants.map(v => v.title))
    const newTitles = new Set(newVariants.map(v => v.title))

    // If set of titles is different, update
    let changed = false
    if (newVariants.length !== variants.length) changed = true
    else {
      for (const t of newTitles) {
        if (!currentTitles.has(t)) {
          changed = true
          break
        }
      }
    }

    if (changed) {
      setVariants(newVariants)
    }
  }, [options])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    formData.append('images', JSON.stringify(images))
    formData.append('variants', JSON.stringify(variants))
    formData.append('collectionIds', JSON.stringify(selectedCollections))

    // Handle checkboxes
    if (!formData.has('trackQuantity')) formData.append('trackQuantity', 'false')

    try {
      if (product) {
        await updateProductAction(product.id, formData)
        showToast('Product updated', 'success')
        // router.push('/admin/products') // Removed redirect per user request
      }
    } catch (err) {
      console.error(err)
      showToast('Failed to update', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (files: File[]): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (res.ok) {
          const data = await res.json();
          uploadedUrls.push(data.url);
        }
      } catch (e) {
        console.error(e);
      }
    }
    if (uploadedUrls.length > 0) {
      // setImages(prev => [...prev, ...uploadedUrls]); // User requested not to add variant uploads to main product images
    }
    return uploadedUrls;
  };

  if (loading) return <div>Loading...</div>
  if (!product) return <div className="p-8">Product not found</div>

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
                defaultValue={product.title || product.name}
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

              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Collections
                </label>
                <MultiSelect
                  options={categories.map(c => ({ label: c.name, value: c.id }))}
                  selected={selectedCollections}
                  onChange={setSelectedCollections}
                  placeholder="Select collections..."
                />
              </div>
            </div>

            <div className="mt-3">
              <label htmlFor="status" className="block text-sm font-medium mb-2">
                Status
              </label>
              <select id="status" name="status" defaultValue={product.status} className="w-full px-3 py-2 border rounded-md bg-white">
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
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
                defaultValue={product.costPerItem}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div className="col-span-3">
              <label htmlFor="taxClassId" className="block text-sm font-medium mb-2">
                Tax Class
              </label>
              <select
                id="taxClassId"
                name="taxClassId"
                defaultValue={product.taxClassId || ''}
                className="w-full px-3 py-2 border rounded-md bg-white"
              >
                {taxClasses.map((TC: any) => (
                  <option key={TC.id} value={TC.id}>{TC.name} {TC.is_default ? '(Default)' : ''}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Variants */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Variants</h2>

          <div className="space-y-6">
            <ProductOptions options={options} onChange={setOptions} />

            {variants.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Preview Variants</h3>
                <VariantsTable
                  variants={variants}
                  options={options}
                  onChange={setVariants}
                  availableImages={images}
                  onImageUpload={handleImageUpload}
                />
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
                defaultValue={product.quantity || 0}
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

            {/* Dimensions section removed as it is not supported by backend yet */}
          </div>
        </div>

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
