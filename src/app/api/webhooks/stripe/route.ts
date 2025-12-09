import { NextResponse } from "next/server"

export async function POST(req: Request) {
  return new NextResponse(
    JSON.stringify({ 
      message: "Stripe webhook is currently disabled." 
    }),
    { status: 503, headers: { "Content-Type": "application/json" } }
  )
}
