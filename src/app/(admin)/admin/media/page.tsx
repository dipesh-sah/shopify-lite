'use client'

import { useState, useEffect, useRef } from 'react'
import { getImagesAction, updateImageAction, deleteImageAction, createImageAction } from '@/actions/media'
import { showToast } from '@/components/ui/Toast'
import { showConfirm } from '@/components/ui/Confirm'
import Spinner from '@/components/ui/Spinner'
import { Button } from '@/components/ui/button'
import { Trash2, Edit2, Copy, Upload as UploadIcon, Link as LinkIcon } from 'lucide-react'

export default function MediaPage() {
  const [images, setImages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editAltText, setEditAltText] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadImages()
  }, [])

  async function loadImages() {
    try {
      setLoading(true)
      const data = await getImagesAction()
      setImages(data)
    } catch (error) {
      console.error('Failed to load images:', error)
      showToast('Failed to load images', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    const confirmed = await showConfirm('Are you sure you want to delete this image? It will be removed from the product gallery.', 'Delete Image')
    if (!confirmed) return

    try {
      const res = await deleteImageAction(id)
      if (res.error) throw new Error(res.error)

      setImages(images.filter(img => img.id !== id))
      showToast('Image deleted successfully', 'success')
    } catch (error) {
      console.error('Failed to delete image:', error)
      showToast('Failed to delete image', 'error')
    }
  }

  async function handleUpdate(id: string) {
    try {
      const res = await updateImageAction(id, editAltText)
      if (res.error) throw new Error(res.error)

      setImages(images.map(img => img.id === id ? { ...img, altText: editAltText } : img))
      setEditingId(null)
      showToast('Image updated successfully', 'success')
    } catch (error) {
      console.error('Failed to update image:', error)
      showToast('Failed to update image', 'error')
    }
  }

  function startEdit(img: any) {
    setEditingId(img.id)
    setEditAltText(img.altText || '')
  }

  async function copyToClipboard(url: string) {
    try {
      await navigator.clipboard.writeText(url)
      showToast('URL copied to clipboard', 'success')
    } catch (err) {
      console.error('Failed to copy keys', err)
      showToast('Failed to copy URL', 'error')
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append("file", file)

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!res.ok) throw new Error("Upload failed")

        const data = await res.json()

        // Save to DB
        const createRes = await createImageAction(data.url, file.name)
        if (createRes.success && createRes.id) {
          // We need to construct the new image object to add it locally without full reload, 
          // but mapped id is string.
          // Ideally we reload to get correct structure.
          await loadImages()
        }
      }
      showToast('Images uploaded successfully', 'success')
    } catch (error) {
      console.error('Upload error:', error)
      showToast('Failed to upload images', 'error')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  async function handleUrlUpload() {
    const url = prompt("Enter image URL:")
    if (!url) return

    setIsUploading(true)
    try {
      const createRes = await createImageAction(url, 'Imported from URL')
      if (createRes.success) {
        await loadImages()
        showToast('Image added successfully', 'success')
      } else {
        throw new Error(createRes.error)
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to add image', 'error')
    } finally {
      setIsUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Media Library</h1>
          <p className="text-muted-foreground mt-2">Manage all product images ({images.length})</p>
        </div>
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
          />
          <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
            <UploadIcon className="h-4 w-4 mr-2" />
            {isUploading ? 'Uploading...' : 'Upload Image'}
          </Button>
          <Button variant="outline" onClick={handleUrlUpload} disabled={isUploading}>
            <LinkIcon className="h-4 w-4 mr-2" />
            Add from URL
          </Button>
        </div>
      </div>

      {images.length === 0 ? (
        <div className="text-center py-12 border rounded-lg text-muted-foreground">
          <p>No images found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {images.map(img => (
            <div key={img.id} className="group relative border rounded-lg overflow-hidden bg-card shadow-sm hover:shadow-md transition-shadow">
              <div className="aspect-square bg-muted relative">
                <img
                  src={img.url}
                  alt={img.altText || img.productTitle}
                  className="object-cover w-full h-full"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 w-8 p-0"
                    title="Copy URL"
                    onClick={() => copyToClipboard(img.url)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 w-8 p-0"
                    title="Edit Alt Text"
                    onClick={() => startEdit(img)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-8 w-8 p-0"
                    title="Delete"
                    onClick={() => handleDelete(img.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="p-3 text-xs">
                {editingId === img.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editAltText}
                      onChange={(e) => setEditAltText(e.target.value)}
                      className="w-full px-2 py-1 border rounded"
                      placeholder="Alt text"
                      autoFocus
                    />
                    <div className="flex gap-1">
                      <Button size="sm" className="h-6 text-xs w-full" onClick={() => handleUpdate(img.id)}>Save</Button>
                      <Button size="sm" variant="outline" className="h-6 text-xs w-full" onClick={() => setEditingId(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="font-medium truncate" title={img.productTitle}>{img.productTitle || 'Unassigned'}</p>
                    <p className="text-muted-foreground truncate" title={img.altText || 'No alt text'}>
                      {img.altText || <span className="italic">No alt text</span>}
                    </p>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
