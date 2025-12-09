"use server"

export async function createReturnAction(data: any) {
  try {
    console.log("Mock create return", data)
    return { success: true, id: "mock-return-id" }
  } catch (error) {
    console.error("Error creating return:", error)
    return { error: "Failed to create return" }
  }
}

export async function getCustomerReturnsAction(customerId: string) {
  try {
    return []
  } catch (error) {
    console.error("Error getting customer returns:", error)
    return []
  }
}
