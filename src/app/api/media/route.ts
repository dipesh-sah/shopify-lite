import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  return NextResponse.json({ error: 'Media upload not supported in this version' }, { status: 501 })
}
