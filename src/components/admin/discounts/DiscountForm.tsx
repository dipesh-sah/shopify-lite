"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import Spinner from "@/components/ui/Spinner"
import { RuleSelector } from "@/components/admin/rules/RuleSelector"
import { createPromotionAction, updatePromotionAction } from "@/actions/promotions"
import { showToast } from "@/components/ui/Toast"

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
  ruleId?: string
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
  ruleId: '',
}

interface DiscountFormProps {
  initialData?: any
  isEditing?: boolean
}

export function DiscountForm({ initialData, isEditing }: DiscountFormProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<PromoForm>(initialForm)

  useEffect(() => {
    if (initialData) {
      const startDate = initialData.startDate instanceof Date ? initialData.startDate : new Date(initialData.startDate);
      const endDate = initialData.endDate instanceof Date ? initialData.endDate : new Date(initialData.endDate);

      setForm({
        code: initialData.code,
        description: initialData.description || '',
        discountType: initialData.discountType,
        discountValue: initialData.discountValue,
        minOrderAmount: initialData.minOrderAmount || 0,
        maxUsages: initialData.maxUsages || 0,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        isActive: initialData.isActive,
        ruleId: initialData.ruleId || ''
      })
    }
  }, [initialData])

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
        ruleId: form.ruleId
      }

      if (isEditing && initialData?.id) {
        await updatePromotionAction(initialData.id, data)
        showToast('Promotion updated', 'success')
      } else {
        await createPromotionAction(data)
        showToast('Promotion created', 'success')
      }

      router.push('/admin/discounts')
      router.refresh()
    } catch (error) {
      console.error('Failed to save promotion:', error)
      showToast('Failed to save promotion', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="border rounded-lg p-6 bg-card max-w-4xl mx-auto">
      <h2 className="text-lg font-semibold mb-4">{isEditing ? 'Edit Promotion' : 'Create New Promotion'}</h2>
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
              disabled={isEditing}
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
            <label className="block text-sm font-medium mb-2">Requirements Rule</label>
            <RuleSelector
              value={form.ruleId}
              onChange={(val) => setForm({ ...form, ruleId: val })}
              moduleType="promotion"
              placeholder="Select conditions..."
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
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
              isEditing ? 'Update Promotion' : 'Create Promotion'
            )}
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
