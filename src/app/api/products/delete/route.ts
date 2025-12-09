import { deleteProductAction } from "@/actions/products"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { productId } = await req.json()

  if (!productId) {
    return NextResponse.json({ error: "Missing productId" }, { status: 400 })
  }

  try {
    await deleteProductAction(productId)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
  }
}
