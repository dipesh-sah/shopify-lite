'use server'

import { setDefaultVariant } from '@/lib/products'
import { revalidatePath } from 'next/cache'

export async function setDefaultVariantAction(productId: string, variantId: string) {
  try {
    await setDefaultVariant(productId, variantId)
    revalidatePath('/admin/products')
    revalidatePath(`/admin/products/${productId}`)
    revalidatePath('/products')
    return { success: true }
  } catch (error) {
    console.error('Error setting default variant:', error)
    return { success: false, error: 'Failed to set default variant' }
  }
}
