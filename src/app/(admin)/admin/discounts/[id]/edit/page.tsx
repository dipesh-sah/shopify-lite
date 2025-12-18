"use client"

import { useState, useEffect } from "react"
import { DiscountForm } from "@/components/admin/discounts/DiscountForm"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getPromotionsAction } from "@/actions/promotions"
import { showToast } from "@/components/ui/Toast"

interface PageProps {
  params: Promise<{ id: string }>
}

export default function EditDiscountPage({ params }: PageProps) {
  const [promo, setPromo] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPromo()
  }, [])

  async function loadPromo() {
    try {
      // Since we don't have a direct getPromotion(id) action exposed yet (only getPromotions or getByCode),
      // we'll fetch all and find (not efficient but quickest refactor without touching actions).
      // Ideally should add getPromotionAction(id).
      const allPromos = await getPromotionsAction(false)
      const { id } = await params
      const found = allPromos.find((p: any) => p.id === id)

      if (found) {
        setPromo(found)
      } else {
        showToast("Promotion not found", "error")
      }
    } catch (error) {
      console.error(error)
      showToast("Failed to load promotion", "error")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8" /></div>
  }

  if (!promo) {
    return <div>Promotion not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/discounts">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Edit Promotion</h1>
      </div>
      <DiscountForm initialData={promo} isEditing />
    </div>
  )
}
