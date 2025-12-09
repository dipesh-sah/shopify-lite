import { NextResponse } from "next/server"

export async function POST(req: Request) {
  return new NextResponse(
    JSON.stringify({ 
      message: "Checkout API is currently disabled. Payment methods are coming soon." 
    }),
    { status: 503, headers: { "Content-Type": "application/json" } }
  )
}
