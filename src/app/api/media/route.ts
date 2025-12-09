import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, url, path, contentType, folder, size } = body

    if (!url || !name) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const docRef = await adminDb.collection('media').add({
      name,
      url,
      path: path || null,
      contentType: contentType || null,
      folder: folder || null,
      size: size || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({ id: docRef.id, success: true })
  } catch (err) {
    console.error('Failed to register media:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
