"use client"

import { useState, useEffect } from 'react'
import { getPromotionsAction, deletePromotionAction } from '@/actions/promotions'
import { showToast } from '@/components/ui/Toast'
import { showConfirm } from '@/components/ui/Confirm'
import { Button } from '@/components/ui/button'
import Spinner from '@/components/ui/Spinner'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadPromotions()
  }, [])

  async function loadPromotions() {
    try {
      setLoading(true)
      const data = await getPromotionsAction(false)
      setPromotions(data)
    } catch (error) {
      console.error('Failed to load promotions:', error)
      showToast('Failed to load promotions', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    const confirmed = await showConfirm('Are you sure you want to delete this promotion?', 'Delete Promotion')
    if (!confirmed) return

    try {
      await deletePromotionAction(id)
      setPromotions(promotions.filter(p => p.id !== id))
      showToast('Promotion deleted', 'success')
    } catch (error) {
      console.error('Failed to delete promotion:', error)
      showToast('Failed to delete promotion', 'error')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Promotions & Discounts</h1>
          <p className="text-muted-foreground mt-2">Manage promotional codes and discounts</p>
        </div>
        <Link href="/admin/discounts/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Promotion
          </Button>
        </Link>
      </div>

      {/* Promotions List */}
      {promotions.length === 0 ? (
        <div className="text-center py-12 border rounded-lg text-muted-foreground">
          <p>No promotions yet</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {promotions.map(promo => {
            const startDate = promo.startDate instanceof Date ? promo.startDate : new Date(promo.startDate);
            const endDate = promo.endDate instanceof Date ? promo.endDate : new Date(promo.endDate);
            const now = new Date();
            const isExpired = now > endDate;
            const isActive = promo.isActive && !isExpired;

            return (
              <div key={promo.id} className="border rounded-lg p-4 flex items-center justify-between bg-card">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{promo.code}</h3>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                      }`}>
                      {isActive ? 'Active' : isExpired ? 'Expired' : 'Inactive'}
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-2">{promo.description}</p>

                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Discount: </span>
                      <span className="font-medium">
                        {promo.discountValue}{promo.discountType === 'percentage' ? '%' : '$'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Min Order: </span>
                      <span className="font-medium">
                        {promo.minOrderAmount > 0 ? `$${promo.minOrderAmount.toFixed(2)}` : 'None'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Valid: </span>
                      <span className="font-medium">
                        {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Usages: </span>
                      <span className="font-medium">
                        {promo.currentUsages || 0}{promo.maxUsages ? `/${promo.maxUsages}` : ''}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link href={`/admin/discounts/${promo.id}/edit`}>
                    <Button
                      size="sm"
                      variant="outline"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(promo.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
