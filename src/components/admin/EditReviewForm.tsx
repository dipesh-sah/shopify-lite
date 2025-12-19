'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Star, Trash2, X, Plus } from 'lucide-react' // Added Plus, X
import { updateReviewDetailsAction, deleteReviewAction } from '@/actions/reviews'
import { getProductsAction, getProductAction } from '@/actions/products'
import { showToast } from '@/components/ui/Toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge' // Need Badge or similar

interface Review {
  id: number
  product_id: number
  product_title?: string
  product_ids?: number[] // Added
  title: string
  rating: number
  content: string
  author_name: string
  email: string
  phone?: string
  status: 'active' | 'inactive'
}

// Multi-Select Product Picker
function ProductPicker({
  selectedIds,
  onToggle
}: {
  selectedIds: number[],
  onToggle: (product: { id: string, title: string }) => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)

  // Load initial products
  useEffect(() => {
    handleSearch('')
  }, [])

  const handleSearch = async (term: string) => {
    setQuery(term)
    setSearching(true)
    try {
      const res = await getProductsAction({ search: term, limit: 10 })
      setResults(res.products)
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="space-y-4">
      <Input placeholder="Search products..." value={query} onChange={(e) => handleSearch(e.target.value)} />
      <div className="border rounded-md h-[300px] overflow-y-auto">
        {!searching && results.length === 0 && <div className="p-4 text-center text-sm text-muted-foreground">No products found</div>}
        {results.map(p => {
          const isSelected = selectedIds.includes(Number(p.id))
          return (
            <div
              key={p.id}
              className={`p-3 border-b last:border-0 cursor-pointer flex items-center justify-between text-sm ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
              onClick={() => onToggle({ id: String(p.id), title: p.title })} // Ensure ID is string/number consistent
            >
              <div className="flex flex-col">
                <span className="font-medium">{p.title}</span>
                <span className="text-xs text-muted-foreground">ID: {p.id}</span>
              </div>
              {isSelected && <Badge variant="secondary" className="bg-blue-200 text-blue-800 hover:bg-blue-300">Selected</Badge>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function EditReviewForm({ review }: { review: Review }) {
  const router = useRouter()

  // Initialize with existing product_ids or fallback to primary product_id
  const initialProductIds = review.product_ids && review.product_ids.length > 0
    ? review.product_ids
    : (review.product_id ? [review.product_id] : [])

  const [formData, setFormData] = useState({
    title: review.title,
    rating: review.rating,
    content: review.content,
    status: review.status,
    author_name: review.author_name,
    email: review.email,
    phone: review.phone || '',
    product_ids: initialProductIds
  })

  // We need to fetch titles for initialProductIds if we want to show tags
  // For now, we only have product_title for the PRIMARY one.
  // We should create a state for "Selected Products Details"
  const [selectedProducts, setSelectedProducts] = useState<{ id: number, title: string }[]>([])

  // Fetch product details for the tags on mount if needed
  useEffect(() => {
    const fetchDetails = async () => {
      if (initialProductIds.length === 0) return;

      // If we have only one and it matches the primary passed in review, use that to save an API call
      if (initialProductIds.length === 1 && initialProductIds[0] === review.product_id && review.product_title) {
        setSelectedProducts([{ id: review.product_id, title: review.product_title }])
        return
      }

      // Otherwise fetch all (or we could update getReview to return titles too, but let's do client fetch for simplicity now)
      // Actually, getProductsAction accepts `ids` array! Perfect.
      const res = await getProductsAction({ ids: initialProductIds.map(String) })
      setSelectedProducts(res.products.map((p: any) => ({ id: Number(p.id), title: p.title })))
    }
    fetchDetails()
  }, []) // Run once

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showProductPicker, setShowProductPicker] = useState(false)

  const handleToggleProduct = (product: { id: string, title: string }) => {
    const pid = Number(product.id)
    const exists = formData.product_ids.includes(pid)

    let newIds: number[]
    let newProducts = [...selectedProducts]

    if (exists) {
      newIds = formData.product_ids.filter(id => id !== pid)
      newProducts = newProducts.filter(p => p.id !== pid)
    } else {
      newIds = [...formData.product_ids, pid]
      newProducts.push({ id: pid, title: product.title })
    }

    setFormData({ ...formData, product_ids: newIds })
    setSelectedProducts(newProducts)
  }

  const handleSave = async () => {
    setIsSubmitting(true)
    try {
      const res = await updateReviewDetailsAction(review.id, {
        title: formData.title,
        rating: formData.rating,
        content: formData.content,
        status: formData.status,
        author_name: formData.author_name,
        email: formData.email,
        phone: formData.phone,
        product_ids: formData.product_ids
      })

      if (res.success) {
        showToast('Review updated successfully', 'success')
        router.refresh()
      } else {
        showToast(res.error || 'Failed to update', 'error')
      }
    } catch {
      showToast('An unexpected error occurred', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this review permanently?')) return
    setIsSubmitting(true)
    try {
      await deleteReviewAction(String(review.id))
      showToast('Review deleted', 'success')
      router.push('/admin/reviews')
    } catch {
      showToast('Failed to delete', 'error')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/reviews">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <h1 className="text-2xl font-bold">Edit Review</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Review Title</label>
                <Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} type="button" onClick={() => setFormData({ ...formData, rating: star })}>
                      <Star className={`h-6 w-6 ${star <= formData.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Assigned Products</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedProducts.map(p => (
                    <div key={p.id} className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm">
                      <span>{p.title}</span>
                      <button onClick={() => handleToggleProduct({ id: String(p.id), title: p.title })} className="hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {selectedProducts.length === 0 && <span className="text-muted-foreground text-sm italic">No products assigned</span>}
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowProductPicker(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Assign Products
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Review Content</label>
                <Textarea rows={6} value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={formData.status} onValueChange={(v: any) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Author</label>
                <Input value={formData.author_name} onChange={e => setFormData({ ...formData, author_name: e.target.value })} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Phone</label>
                <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t">
        <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>Delete Review</Button>
        <Button onClick={handleSave} disabled={isSubmitting}>Save Changes</Button>
      </div>

      <Dialog open={showProductPicker} onOpenChange={setShowProductPicker}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Assign Products</DialogTitle></DialogHeader>
          <ProductPicker
            selectedIds={formData.product_ids}
            onToggle={handleToggleProduct}
          />
          <DialogFooter>
            <Button onClick={() => setShowProductPicker(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
