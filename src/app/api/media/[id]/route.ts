import { NextResponse } from 'next/server'
import { adminDb, adminStorage } from '@/lib/firebase-admin'

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const docRef = adminDb.collection('media').doc(id)
    const docSnap = await docRef.get()
    if (!docSnap.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const data = docSnap.data()
    const path = data?.path

    // Delete storage object if path provided
    if (path) {
      try {
        const bucket = adminStorage.bucket()
        const file = bucket.file(path)
        await file.delete().catch(() => null)
      } catch (err) {
        console.warn('Failed to delete storage file:', err)
      }
    }

    // Delete Firestore doc
    await docRef.delete()

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Failed to delete media:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
