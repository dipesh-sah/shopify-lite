'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Star, Check, X, Trash2, Search, Filter, ArrowRightLeft, Search as SearchIcon, Loader2, Edit2 } from 'lucide-react'
import { updateReviewStatusAction, deleteReviewAction, assignReviewToProductAction } from '@/actions/reviews'
import { showToast } from '@/components/ui/Toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { getProductsAction } from '@/actions/products'

// Match Backend Interface
interface Review {
  id: number
  product_id: number
  product_title?: string
  product_slug?: string
  title: string
  rating: number
  content: string
  author_name: string
  email: string
  status: 'active' | 'inactive'
  is_verified: boolean
  created_at: string | Date
}

// Helper Component for Product Picker
function ProductPicker({ onSelect }: { onSelect: (product: { id: string, title: string }) => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)

  // Debounce search ideally, but for now simple effect
  const handleSearch = async (term: string) => {
    setQuery(term)
    if (term.length < 2) {
      setResults([])
      return
    }
    setSearching(true)
    try {
      const res = await getProductsAction({ search: term, limit: 5 })
      setResults(res.products)
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="space-y-2">
      <Input
        placeholder="Search for a product..."
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
      />
      <div className="border rounded-md max-h-[200px] overflow-y-auto">
        {searching && <div className="p-2 text-sm text-muted-foreground flex gap-2"><Loader2 className="animate-spin h-4 w-4" /> Searching...</div>}
        {!searching && results.length === 0 && query.length >= 2 && <div className="p-2 text-sm text-muted-foreground">No products found</div>}
        {results.map(p => (
          <div
            key={p.id}
            className="p-2 hover:bg-gray-100 cursor-pointer text-sm flex justify-between items-center"
            onClick={() => onSelect({ id: p.id, title: p.title })}
          >
            <span className="truncate flex-1">{p.title}</span>
            <span className="text-xs text-muted-foreground ml-2">ID: {p.id}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AdminReviewList({ reviews, onUpdate }: { reviews: Review[], onUpdate: () => void }) {
  const [loading, setLoading] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Move Dialog State
  const [moveReview, setMoveReview] = useState<Review | null>(null)
  const [targetProduct, setTargetProduct] = useState<{ id: string, title: string } | null>(null)
  const [moving, setMoving] = useState(false)

  const handleStatusUpdate = async (reviewId: number, status: 'active' | 'inactive') => {
    setLoading(reviewId)
    try {
      // Map UI action to backend status
      await updateReviewStatusAction(String(reviewId), status)
      showToast(`Review ${status}`, 'success')
      onUpdate()
    } catch (err) {
      console.error(err)
      showToast('Failed to update status', 'error')
    } finally {
      setLoading(null)
    }
  }

  const handleDelete = async (reviewId: number) => {
    if (!confirm('Are you sure you want to delete this review?')) return
    setLoading(reviewId)
    try {
      await deleteReviewAction(String(reviewId))
      showToast('Review deleted', 'success')
      onUpdate()
    } catch (err) {
      showToast('Failed to delete review', 'error')
    } finally {
      setLoading(null)
    }
  }

  const handleMove = async () => {
    if (!moveReview || !targetProduct) return
    setMoving(true)
    try {
      await assignReviewToProductAction(moveReview.id, Number(targetProduct.id))
      showToast('Review moved successfully', 'success')
      setMoveReview(null)
      setTargetProduct(null)
      onUpdate()
    } catch (err) {
      showToast('Failed to move review', 'error')
    } finally {
      setMoving(false)
    }
  }

  // Filter Logic
  const filteredReviews = reviews.filter(r => {
    const matchesSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.author_name.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase()) ||
      (r.product_title || '').toLowerCase().includes(search.toLowerCase())

    const matchesStatus = statusFilter === 'all' || r.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reviews..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Review</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReviews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No reviews found.
                </TableCell>
              </TableRow>
            ) : (
              filteredReviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell className="max-w-[300px]">
                    <div className="space-y-1">
                      <div className="flex text-yellow-500">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'fill-current' : 'text-gray-300'}`} />
                        ))}
                      </div>
                      <p className="font-medium truncate">{review.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{review.content}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium block truncate max-w-[150px]">{review.product_title || 'Unknown Product'}</span>
                    <span className="text-[10px] text-muted-foreground">ID: {review.product_id}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">{review.author_name}</span>
                      <span className="text-xs text-muted-foreground">{review.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${review.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                      {review.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" title="Move Review" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => setMoveReview(review)}>
                        <ArrowRightLeft className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-foreground hover:bg-muted" asChild>
                        <a href={`/admin/reviews/${review.id}`}>
                          <Edit2 className="h-4 w-4" />
                        </a>
                      </Button>
                      {review.status !== 'active' && (
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleStatusUpdate(review.id, 'active')} disabled={loading === review.id}>
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      {review.status === 'active' && (
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50" onClick={() => handleStatusUpdate(review.id, 'inactive')} disabled={loading === review.id}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(review.id)} disabled={loading === review.id}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!moveReview} onOpenChange={() => setMoveReview(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Select a new product to assign this review to.
            </p>
            <div className="border p-3 rounded-md bg-muted/50 text-sm">
              <p><strong>Current Review:</strong> {moveReview?.title}</p>
              <p><strong>Current Product:</strong> {moveReview?.product_title}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">New Product</label>
              {targetProduct ? (
                <div className="flex items-center justify-between p-3 border rounded-md bg-green-50">
                  <span className="font-medium text-green-800">{targetProduct.title}</span>
                  <Button variant="ghost" size="sm" onClick={() => setTargetProduct(null)}><X className="h-4 w-4" /></Button>
                </div>
              ) : (
                <ProductPicker onSelect={setTargetProduct} />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveReview(null)}>Cancel</Button>
            <Button onClick={handleMove} disabled={!targetProduct || moving}>
              {moving ? 'Moving...' : 'Move Review'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
