"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { showToast } from "@/components/ui/Toast"
import { Upload, X, Image as ImageIcon } from "lucide-react"

interface ImagePickerProps {
  images: string[]
  onChange: (images: string[]) => void
  maxImages?: number
}

export function ImagePicker({
  images,
  onChange,
  maxImages = 5,
}: ImagePickerProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)

    try {
      const uploadedImages: string[] = []

      for (const file of Array.from(files)) {
        if (images.length + uploadedImages.length >= maxImages) break

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
    const url = prompt("Enter image URL:")
    if (url && images.length < maxImages) {
      onChange([...images, url])
    }
  }

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4 w-full">
      <div className="grid gap-4">
        {images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {images.map((img, index) => (
              <div key={index} className="relative group aspect-square">
                <img
                  src={img}
                  className="w-full h-full object-cover rounded-lg border bg-muted"
                  alt={`Image ${index + 1}`}
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-destructive text-destructive-foreground w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-sm"
                >
                  <X className="h-3 w-3" />
                </button>
                {index === 0 && (
                  <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm">
                    Main
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {images.length < maxImages && (
          <div
            className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg hover:bg-muted/50 transition-colors ${images.length > 0 ? 'h-32' : 'h-full min-h-[200px]'}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              // Rudimentary drag-drop hint - implementation would require state update
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="flex flex-col items-center gap-2 text-center">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-2">
                <Upload className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex flex-col gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-primary hover:text-primary/90 hover:bg-transparent p-0 h-auto font-semibold"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? "Uploading..." : "Upload images"}
                </Button>
                <span className="text-xs text-muted-foreground">or drag and drop</span>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleUrlAdd}
                  disabled={images.length >= maxImages}
                  className="text-xs h-8"
                >
                  <ImageIcon className="h-3 w-3 mr-2" />
                  Add from URL
                </Button>
              </div>

              <span className="text-[10px] text-muted-foreground mt-2">
                {images.length}/{maxImages} images used
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
