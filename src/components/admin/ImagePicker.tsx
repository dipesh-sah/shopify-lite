"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { showToast } from "@/components/ui/Toast"
import { Upload, X, Image as ImageIcon, Plus, FolderOpen } from "lucide-react"
import { MediaLibraryModal } from "./MediaLibraryModal"
import Loading from "@/components/ui/Loading"

interface ImagePickerProps {
  images: string[]
  onChange: (images: string[]) => void
  maxImages?: number
  multiple?: boolean
  single?: boolean
}

export function ImagePicker({
  images,
  onChange,
  maxImages,
  multiple = true,
  single = false,
}: ImagePickerProps) {
  const [uploading, setUploading] = useState(false)
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false)
  const [urlModalOpen, setUrlModalOpen] = useState(false)
  const [urlInput, setUrlInput] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)

    try {
      const uploadedImages: string[] = []

      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append("file", file)

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!res.ok) throw new Error("Upload failed")

        const data = await res.json()
        uploadedImages.push(data.url)
      }

      onChange([...images, ...uploadedImages])
    } catch (error) {
      console.error("Upload error", error)
      showToast("Failed to upload image", "error")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleUrlAdd = () => {
    if (urlInput) {
      if (single) {
        onChange([urlInput])
      } else {
        onChange([...images, urlInput])
      }
      setUrlInput("")
      setUrlModalOpen(false)
    }
  }

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index))
  }

  const handleMediaSelect = (urls: string[]) => {
    onChange([...images, ...urls])
  }

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={multiple && (!maxImages || images.length < maxImages)}
        onChange={handleFileSelect}
        className="hidden"
      />

      <MediaLibraryModal
        open={mediaLibraryOpen}
        onOpenChange={setMediaLibraryOpen}
        onSelect={handleMediaSelect}
        multiple={multiple && !single}
      />

      {/* URL Input Modal */}
      {urlModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Add Image via URL</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Paste the direct link to your image below</p>
            </div>
            <div className="p-6">
              <input
                autoFocus
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUrlAdd()}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white outline-none"
              />
            </div>
            <div className="p-6 bg-gray-50 dark:bg-gray-900/50 flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setUrlModalOpen(false)
                  setUrlInput("")
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleUrlAdd} disabled={!urlInput}>
                Add Image
              </Button>
            </div>
          </div>
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 text-center md:grid-cols-4 lg:grid-cols-5 gap-4">
          {images.map((img, index) => (
            <div key={index} className="relative group aspect-square rounded-lg border bg-muted overflow-hidden">
              <img
                src={img}
                className="w-full h-full object-contain transition-transform group-hover:scale-105"
                alt={`Product image ${index + 1}`}
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />

              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 bg-white/90 text-red-600 w-7 h-7 rounded-md flex items-center justify-center translate-y-[-10px] opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all shadow-sm z-10 hover:bg-white"
              >
                <X className="h-4 w-4" />
              </button>

              {index === 0 ? (
                <div className="absolute bottom-2 left-2 right-2">
                  <div className="bg-black/70 backdrop-blur-sm text-white text-[10px] font-medium py-1 px-2 rounded text-center shadow-sm">
                    Main Media
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const newImages = [...images];
                    const [selected] = newImages.splice(index, 1);
                    newImages.unshift(selected);
                    onChange(newImages);
                  }}
                  className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/90 text-gray-800 text-[10px] font-medium py-1 px-2 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white whitespace-nowrap"
                >
                  Set as Main
                </button>
              )}
            </div>
          ))}

          {(!maxImages || images.length < maxImages) && (
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="relative aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 hover:border-gray-400 transition-all group text-gray-500 hover:text-gray-700"
            >
              {uploading ? (
                <Loading size="sm" variant="inline" />
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Plus className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium">Add Image</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">or drop files</span>
                </>
              )}
            </button>
          )}

          {(!maxImages || images.length < maxImages) && (
            <button
              type="button"
              onClick={() => setUrlModalOpen(true)}
              className="relative aspect-square flex flex-col items-center justify-center border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-all text-gray-500 hover:text-gray-700"
            >
              <ImageIcon className="w-6 h-6 mb-2 opacity-50" />
              <span className="text-xs font-medium">Add via URL</span>
            </button>
          )}

        </div>
      )}

      {images.length === 0 && (
        <div className="mt-4 border-2 border-dashed border-gray-300 rounded-lg bg-white hover:border-gray-400 transition-colors">
          <div className="p-6">
            <div className="flex flex-col items-center justify-center text-center py-4">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Upload className="w-6 h-6 text-gray-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">Add images</h3>
              <p className="text-xs text-gray-500 mb-6 max-w-sm">
                Accepts images, videos, or 3D models
              </p>

              <div className="flex flex-wrap gap-3 justify-center">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-gray-900 hover:bg-gray-800 text-white"
                >
                  Add file
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setMediaLibraryOpen(true)}
                  className="border-gray-300 hover:bg-gray-50"
                >
                  Add from library
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setUrlModalOpen(true)}
                  className="border-gray-300 hover:bg-gray-50"
                >
                  Add from URL
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
