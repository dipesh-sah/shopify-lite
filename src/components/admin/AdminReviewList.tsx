'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Star, Check, X, Trash2, Search, Filter, ArrowRightLeft, Edit2, RefreshCw } from 'lucide-react'
import Loading from '@/components/ui/Loading'
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
  comment?: string // Alternative field name in some schemas
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
        {searching && <div className="p-2 text-sm text-muted-foreground flex items-center gap-2"><Loading variant="inline" size="sm" /> Searching...</div>}
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
      await updateReviewStatusAction(String(reviewId), status)
      showToast(`Review ${status === 'active' ? 'approved' : 'deactivated'}`, 'success')
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
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search reviews..."
            className="pl-10 h-10 bg-white border-gray-200"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-10 bg-white border-gray-200">
            <Filter className="mr-2 h-4 w-4 text-gray-400" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">all</SelectItem>
            <SelectItem value="active">active</SelectItem>
            <SelectItem value="inactive">inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 border-b border-gray-200 hover:bg-gray-50">
              <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Review</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Product</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Author</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReviews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-gray-500">
                  No reviews found.
                </TableCell>
              </TableRow>
            ) : (
              filteredReviews.map((review) => (
                <TableRow key={review.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                  {/* Review Column */}
                  <TableCell className="max-w-[280px] py-4">
                    <div className="space-y-1.5">
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`}
                          />
                        ))}
                      </div>
                      <p className="font-semibold text-sm text-gray-900 line-clamp-1">{review.title}</p>
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {(() => {
                          const r = review as any;

                          // Try every possible field name
                          const possibleContent =
                            r.content ||
                            r.comment ||
                            r.body ||
                            r.description ||
                            r.text ||
                            r.review_content ||
                            r.reviewContent ||
                            r.message ||
                            '';

                          // Log for debugging
                          if (!possibleContent) {
                            console.error('NO CONTENT FOUND for review:', review.id, 'Available fields:', Object.keys(r));
                          } else {
                            console.log('✓ Content found:', possibleContent.substring(0, 50));
                          }

                          return possibleContent || '—';
                        })()}
                      </p>
                    </div>
                  </TableCell>

                  {/* Product Column */}
                  <TableCell className="py-4">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-gray-900 max-w-[180px] truncate">
                        {review.product_title || 'Unknown Product'}
                      </p>
                      <p className="text-[10px] text-gray-400 font-mono">
                        ID: {review.product_id}
                      </p>
                    </div>
                  </TableCell>

                  {/* Author Column */}
                  <TableCell className="py-4">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-gray-900">{review.author_name}</p>
                      <p className="text-xs text-gray-500">{review.email}</p>
                    </div>
                  </TableCell>

                  {/* Status Column */}
                  <TableCell className="py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${review.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                    >
                      {review.status}
                    </span>
                  </TableCell>

                  {/* Date Column */}
                  <TableCell className="py-4">
                    <span className="text-sm text-gray-600" suppressHydrationWarning>
                      {review.created_at
                        ? new Date(review.created_at).toLocaleDateString('en-US', {
                          month: '2-digit',
                          day: '2-digit',
                          year: 'numeric'
                        })
                        : '—'
                      }
                    </span>
                  </TableCell>

                  {/* Actions Column */}
                  <TableCell className="py-4">
                    <div className="flex justify-end gap-1">
                      {/* Reassign/Move */}
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Reassign to another product"
                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md"
                        onClick={() => setMoveReview(review)}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>

                      {/* Edit */}
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Edit review"
                        className="h-8 w-8 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                        asChild
                      >
                        <a href={`/admin/reviews/${review.id}`}>
                          <Edit2 className="h-4 w-4" />
                        </a>
                      </Button>

                      {/* Approve/Deactivate */}
                      {review.status !== 'active' ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Approve review"
                          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md"
                          onClick={() => handleStatusUpdate(review.id, 'active')}
                          disabled={loading === review.id}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Deactivate review"
                          className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-md"
                          onClick={() => handleStatusUpdate(review.id, 'inactive')}
                          disabled={loading === review.id}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}

                      {/* Delete */}
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Delete review"
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md"
                        onClick={() => handleDelete(review.id)}
                        disabled={loading === review.id}
                      >
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

      {/* Move Review Dialog */}
      <Dialog open={!!moveReview} onOpenChange={() => setMoveReview(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Reassign Review to Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              Select a new product to assign this review to.
            </p>
            <div className="border border-gray-200 p-3 rounded-lg bg-gray-50 text-sm space-y-1">
              <p><strong className="text-gray-700">Review:</strong> <span className="text-gray-900">{moveReview?.title}</span></p>
              <p><strong className="text-gray-700">Current Product:</strong> <span className="text-gray-900">{moveReview?.product_title}</span></p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">New Product</label>
              {targetProduct ? (
                <div className="flex items-center justify-between p-3 border border-green-200 rounded-lg bg-green-50">
                  <span className="font-medium text-green-800">{targetProduct.title}</span>
                  <Button variant="ghost" size="sm" onClick={() => setTargetProduct(null)} className="h-7 w-7 p-0">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <ProductPicker onSelect={setTargetProduct} />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveReview(null)}>Cancel</Button>
            <Button onClick={handleMove} disabled={!targetProduct || moving} className="bg-blue-600 hover:bg-blue-700">
              {moving ? 'Reassigning...' : 'Reassign Review'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
