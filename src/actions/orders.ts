"use server"

import { deleteOrder, updateOrderStatus, getOrder, createOrder } from "@/lib/firestore"

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

export async function getCustomerOrdersAction(email?: string, userId?: string) {
  try {
    // In a real implementation this would query the DB
    // For now we return empty array or stub
    return []
  } catch (error) {
    console.error("Error fetching customer orders:", error)
    return []
  }
}
export async function createOrderAction(data: any) {
  try {
    const orderId = await createOrder(data)
    return orderId
  } catch (error) {
    console.error("Error creating order:", error)
    throw error
  }
}
