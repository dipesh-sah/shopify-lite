
"use server"

export async function createReturnAction(data: any) {
  console.log("Mock create return:", data)
  return { success: true }
}

export async function getCustomerReturnsAction(customerId: string) {
  return []
}
