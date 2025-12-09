'use client'

import { useState, useEffect } from 'react'
import { getPromotionsAction, createPromotionAction, updatePromotionAction, deletePromotionAction } from '@/actions/promotions'
import { showToast } from '@/components/ui/Toast'
import { showConfirm } from '@/components/ui/Confirm'
import { Button } from '@/components/ui/button'
import Spinner from '@/components/ui/Spinner'
import { Plus, Trash2, Edit2 } from 'lucide-react'

interface PromoForm {
  code: string
  description: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  minOrderAmount: number
  maxUsages: number
  startDate: string
  endDate: string
  isActive: boolean
}

const initialForm: PromoForm = {
  code: '',
  description: '',
  discountType: 'percentage',
  discountValue: 0,
  minOrderAmount: 0,
  maxUsages: 0,
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  isActive: true,
}

export default function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<PromoForm>(initialForm)

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!form.code.trim() || form.discountValue <= 0) {
      showToast('Please fill in all required fields', 'error')
      return
    }

    setSubmitting(true)
    try {
      const data = {
        code: form.code.toUpperCase(),
        description: form.description,
        discountType: form.discountType,
        discountValue: parseFloat(form.discountValue as any),
        minOrderAmount: form.minOrderAmount ? parseFloat(form.minOrderAmount as any) : 0,
        maxUsages: form.maxUsages ? parseInt(form.maxUsages as any) : 0,
        startDate: new Date(form.startDate),
        endDate: new Date(form.endDate),
        isActive: form.isActive,
      }

      if (editingId) {
        await updatePromotionAction(editingId, data)
        setPromotions(promotions.map(p => p.id === editingId ? { ...p, ...data } : p))
        showToast('Promotion updated', 'success')
      } else {
        await createPromotionAction(data)
        await loadPromotions()
        showToast('Promotion created', 'success')
      }

      setForm(initialForm)
      setShowForm(false)
      setEditingId(null)
    } catch (error) {
      console.error('Failed to save promotion:', error)
      showToast('Failed to save promotion', 'error')
    } finally {
      setSubmitting(false)
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

  function startEdit(promo: any) {
    const startDate = promo.startDate instanceof Date ? promo.startDate : new Date(promo.startDate);
    const endDate = promo.endDate instanceof Date ? promo.endDate : new Date(promo.endDate);

    setForm({
      code: promo.code,
      description: promo.description || '',
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      minOrderAmount: promo.minOrderAmount || 0,
      maxUsages: promo.maxUsages || 0,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      isActive: promo.isActive,
    })
    setEditingId(promo.id)
    setShowForm(true)
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
        {!showForm && (
          <Button onClick={() => {
            setForm(initialForm)
            setEditingId(null)
            setShowForm(true)
          }}>
            <Plus className="h-4 w-4 mr-2" />
            New Promotion
          </Button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="border rounded-lg p-6 bg-card">
          <h2 className="text-lg font-semibold mb-4">{editingId ? 'Edit Promotion' : 'Create New Promotion'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Promo Code *</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="e.g., SUMMER20"
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  disabled={!!editingId}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g., Summer sale 2024"
                  className="w-full px-3 py-2 border rounded-md bg-background"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Discount Type *</label>
                <select
                  value={form.discountType}
                  onChange={(e) => setForm({ ...form, discountType: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount ($)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Discount Value *</label>
                <input
                  type="number"
                  value={form.discountValue}
                  onChange={(e) => setForm({ ...form, discountValue: parseFloat(e.target.value) || 0 })}
                  placeholder="e.g., 20"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border rounded-md bg-background"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Min Order Amount ($)</label>
                <input
                  type="number"
                  value={form.minOrderAmount}
                  onChange={(e) => setForm({ ...form, minOrderAmount: parseFloat(e.target.value) || 0 })}
                  placeholder="0 for no minimum"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border rounded-md bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Max Usages</label>
                <input
                  type="number"
                  value={form.maxUsages}
                  onChange={(e) => setForm({ ...form, maxUsages: parseInt(e.target.value) || 0 })}
                  placeholder="0 for unlimited"
                  min="0"
                  className="w-full px-3 py-2 border rounded-md bg-background"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Start Date *</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">End Date *</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="isActive" className="text-sm font-medium">
                Active
              </label>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <><Spinner className="h-4 w-4 mr-2" />Saving...</>
                ) : (
                  editingId ? 'Update Promotion' : 'Create Promotion'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                  setForm(initialForm)
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

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
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => startEdit(promo)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
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
