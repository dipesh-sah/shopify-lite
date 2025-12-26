"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, Check } from "lucide-react"
import Loading from "@/components/ui/Loading"

interface MediaLibraryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (urls: string[]) => void
  multiple?: boolean
}

export function MediaLibraryModal({ open, onOpenChange, onSelect, multiple = true }: MediaLibraryModalProps) {
  const [mediaFiles, setMediaFiles] = useState<string[]>([])
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      fetchMediaFiles()
    }
  }, [open])

  const fetchMediaFiles = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/media')
      const data = await response.json()
      setMediaFiles(data.files || [])
    } catch (error) {
      console.error('Failed to fetch media files:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleSelection = (url: string) => {
    if (multiple) {
      setSelectedFiles(prev =>
        prev.includes(url) ? prev.filter(f => f !== url) : [...prev, url]
      )
    } else {
      setSelectedFiles([url])
    }
  }

  const handleSelect = () => {
    onSelect(selectedFiles)
    setSelectedFiles([])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Select from Media Library</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loading size="md" variant="centered" />
            </div>
          ) : mediaFiles.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No media files found</p>
              <p className="text-sm mt-2">Upload some files first</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
              {mediaFiles.map((url) => {
                const isSelected = selectedFiles.includes(url)
                return (
                  <button
                    key={url}
                    type="button"
                    onClick={() => toggleSelection(url)}
                    className={`relative aspect-square rounded-lg border-2 overflow-hidden transition-all ${isSelected
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-400'
                      }`}
                  >
                    <img
                      src={url}
                      alt="Media file"
                      className="w-full h-full object-cover"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                        <div className="bg-blue-500 rounded-full p-1">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-gray-600">
            {selectedFiles.length} selected
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSelect} disabled={selectedFiles.length === 0}>
              Insert {selectedFiles.length} {selectedFiles.length === 1 ? 'Image' : 'Images'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
