"use server"

import { deleteOrder, updateOrderStatus, getOrder } from "@/lib/firestore"

export async function deleteOrderAction(id: string) {
  try {
    await deleteOrder(id)
    return { success: true }
  } catch (error) {
    console.error("Error deleting order:", error)
    return { error: "Failed to delete order" }
  }
}

export async function updateOrderStatusAction(id: string, status: string) {
  try {
    await updateOrderStatus(id, status)
    return { success: true }
  } catch (error) {
    console.error("Error updating order status:", error)
    return { error: "Failed to update order status" }
  }
}

export async function getOrderAction(id: string) {
  try {
    const order = await getOrder(id)
    return order
  } catch (error) {
    console.error("Error fetching order:", error)
    return null
  }
}
