'use client'

import { useState, useEffect, useRef } from 'react'
import { getImagesAction, updateImageAction, deleteImageAction, createImageAction } from '@/actions/media'
import { showToast } from '@/components/ui/Toast'
import { showConfirm } from '@/components/ui/Confirm'
import Spinner from '@/components/ui/Spinner'
import { Button } from '@/components/ui/button'
import { Trash2, Edit2, Copy, Upload as UploadIcon, Link as LinkIcon } from 'lucide-react'
import { ImageDetailsDialog } from '@/components/admin/media/ImageDetailsDialog'

export default function MediaPage() {
  const [images, setImages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<any | null>(null)
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

  async function handleUpdate(id: string, newAltText: string) {
    try {
      const res = await updateImageAction(id, newAltText)
      if (res.error) throw new Error(res.error)

      setImages(images.map(img => img.id === id ? { ...img, altText: newAltText } : img))
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
            <div
              key={img.id}
              className="group relative border rounded-lg overflow-hidden bg-card shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedImage(img)}
            >
              <div className="aspect-square bg-muted relative">
                <img
                  src={img.url}
                  alt={img.altText || img.productTitle}
                  className="object-cover w-full h-full"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />

                {/* Internal Actions (Stop Propagation) */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Simplified quick actions, full actions in modal */}
                </div>
              </div>

              <div className="p-3 text-xs">
                <p className="font-medium truncate" title={img.productTitle}>{img.productTitle || 'Unassigned'}</p>
                <p className="text-muted-foreground truncate" title={img.altText || 'No alt text'}>
                  {img.altText || <span className="italic">No alt text</span>}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <ImageDetailsDialog
        image={selectedImage}
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        onUpdate={async (id, altText) => {
          await handleUpdate(id, altText)
        }}
        onDelete={async (id) => {
          await handleDelete(id)
        }}
      />
    </div>
  )
}
