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
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        <Button
          type="button"
          variant="outline"
          disabled={uploading || images.length >= maxImages}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? "Uploading..." : "Upload Images"}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={handleUrlAdd}
          disabled={images.length >= maxImages}
        >
          <ImageIcon className="h-4 w-4 mr-2" />
          Add URL
        </Button>

        <span className="text-sm text-muted-foreground self-center">
          {images.length}/{maxImages} images
        </span>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          {images.map((img, index) => (
            <div key={index} className="relative group">
              <img
                src={img}
                className="w-full h-32 object-cover rounded border"
                alt=""
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
              >
                <X className="h-3 w-3" />
              </button>
              {index === 0 && (
                <div className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                  Main
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
