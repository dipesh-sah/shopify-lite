'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createProductAction } from "@/actions/products"
import { getCollectionsAction, getSubcategoriesAction } from "@/actions/collections"
import { getTaxClassesAction } from "@/actions/tax"

import { showToast } from '@/components/ui/Toast'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Spinner from '@/components/ui/Spinner'
import { ImagePicker } from "@/components/admin/ImagePicker"
import { MultiSelect } from "@/components/ui/multi-select"
import { ProductOptions } from "@/components/admin/ProductOptions"
import { VariantsTable, Variant } from "@/components/admin/VariantsTable"
import { ArrowLeft } from "lucide-react"

import { previewNextNumberAction } from "@/actions/settings"
import { RichTextEditor } from "@/components/admin/RichTextEditor"

export default function NewProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [prefilledSku, setPrefilledSku] = useState("")

  useEffect(() => {
    previewNextNumberAction('product')
      .then(num => setPrefilledSku(num))
      .catch(console.error)
  }, [])

  const [images, setImages] = useState<string[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [subcategories, setSubcategories] = useState<any[]>([])
  const [subsLoading, setSubsLoading] = useState(false)
  const [selectedCollections, setSelectedCollections] = useState<string[]>([])
  const [price, setPrice] = useState<number>(0)
  const [taxClasses, setTaxClasses] = useState<any[]>([])

  // New Variant System State
  const [options, setOptions] = useState<any[]>([]) // [{ id, name, values: [] }]
  const [variants, setVariants] = useState<Variant[]>([])
  const [description, setDescription] = useState("")



  useEffect(() => {
    async function loadData() {
      try {
        const catsRes = await getCollectionsAction()
        setCategories(catsRes.collections)
        const tClasses = await getTaxClassesAction()
        setTaxClasses(tClasses)
      } catch (error) {
        console.error('Failed to load initial data:', error)
      } finally {
        setCategoriesLoading(false)
      }
    }
    loadData()
  }, [])

  // Generate variants when options change
  useEffect(() => {
    if (options.length === 0) {
      setVariants([])
      return
    }

    // Filter out incomplete options
    const validOptions = options.filter(o => o.name && o.values.length > 0)
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

    // 1. Prepare values arrays: [['Red', 'Blue'], ['S', 'M']]
    const valuesArrays = validOptions.map(o => o.values)

    // 2. Generate combinations: [['Red', 'S'], ['Red', 'M']...]
    const combinations = cartesian(valuesArrays)

    // 3. Map to variant objects
    const newVariants = combinations.map(combo => {
      const variantOptions: Record<string, string> = {}
      combo.forEach((val: string, idx: number) => {
        variantOptions[validOptions[idx].name] = val
      })

      const title = combo.join(' / ')
      const existing = variants.find(v => v.title === title)

      // Preserve existing data if found
      return existing || {
        id: `v-${Date.now()}-${Math.random()}`,
        title,
        sku: '',
        price: price,
        stock: 0,
        options: variantOptions,
        images: []
      }
    })

    setVariants(newVariants)
  }, [options, price])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    formData.append('images', JSON.stringify(images))
    // formData.append('tags', JSON.stringify(tags))
    formData.append('variants', JSON.stringify(variants))
    formData.append('collectionIds', JSON.stringify(selectedCollections))
    formData.set('description', description)

    try {
      await createProductAction(formData)
      showToast('Product created successfully', 'success')
      // router.push('/admin/products') // Removed redirect per user request
    } catch (error) {
      console.error(error)
      showToast('Failed to create product', 'error')
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
        <h1 className="text-2xl font-bold">Add Product</h1>
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
                className="w-full px-3 py-2 border rounded-md"
                placeholder="e.g. Summer T-Shirt"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2">
                Description *
              </label>
              <RichTextEditor
                value={description}
                onChange={setDescription}
                placeholder="Describe your product..."
                className="min-h-[250px]"
              />
              <input type="hidden" name="description" value={description} />
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
                  key={prefilledSku}
                  defaultValue={prefilledSku}
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
              <select id="status" name="status" className="w-full px-3 py-2 border rounded-md bg-white">
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
                className="w-full px-3 py-2 border rounded-md"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
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
                className="w-full px-3 py-2 border rounded-md"
                placeholder="0.00"
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
                className="w-full px-3 py-2 border rounded-md"
                placeholder="0.00"
              />
            </div>


            <div className="col-span-3">
              <label htmlFor="taxClassId" className="block text-sm font-medium mb-2">
                Tax Class
              </label>
              <select id="taxClassId" name="taxClassId" className="w-full px-3 py-2 border rounded-md bg-white">
                {/* Default usually handled by backend if null, but explicit is better */}
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
                defaultValue="0"
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
                defaultValue="5"
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
                defaultValue="0.00"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            {/* Dimensions section removed as it is not supported by backend yet */}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Product"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </form >
    </div >
  )
}
