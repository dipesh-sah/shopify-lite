import { NextRequest, NextResponse } from 'next/server'
import { readdir } from 'fs/promises'
import { join } from 'path'

export async function POST(request: Request) {
  return NextResponse.json({ error: 'Media upload not supported in this version' }, { status: 501 })
}

export async function GET(request: NextRequest) {
  try {
    const uploadsDir = join(process.cwd(), 'public', 'uploads')

    try {
      const files = await readdir(uploadsDir)
      const imageFiles = files
        .filter(file => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file))
        .map(file => `/uploads/${file}`)
        .sort((a, b) => b.localeCompare(a)) // Newest first

      return NextResponse.json({ files: imageFiles })
    } catch (error) {
      // uploads directory might not exist yet
      return NextResponse.json({ files: [] })
    }
  } catch (error) {
    console.error('Error fetching media files:', error)
    return NextResponse.json(
      { error: 'Failed to fetch media files' },
      { status: 500 }
    )
  }
}
