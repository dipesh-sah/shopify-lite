"use server"

import { getCustomers, getCustomer } from "@/lib/firestore"

export async function getCustomersAction() {
  try {
    const data = await getCustomers()
    return data
  } catch (error) {
    console.error("Error getting customers:", error)
    return []
  }
}

export async function getCustomerAction(id: string) {
  try {
    const data = await getCustomer(id)
    return data
  } catch (error) {
    console.error("Error getting customer:", error)
    return null
  }
}
