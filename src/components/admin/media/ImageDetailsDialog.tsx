
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2, Copy, Download, ExternalLink } from 'lucide-react'
import { useState, useEffect } from 'react'

interface ImageDetailsDialogProps {
  image: any | null
  isOpen: boolean
  onClose: () => void
  onUpdate: (id: string, altText: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function ImageDetailsDialog({ image, isOpen, onClose, onUpdate, onDelete }: ImageDetailsDialogProps) {
  const [altText, setAltText] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (image) {
      setAltText(image.altText || '')
    }
  }, [image])

  if (!image) return null

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(image.url)
      // Ideally show toast, but this component doesn't have access to showToast directly unless passed or verified global.
      // Assuming parent handles toasts or we use a hook.
    } catch (err) {
      console.error('Failed to copy', err)
    }
  }

  const handleSave = async () => {
    setIsUpdating(true)
    try {
      await onUpdate(image.id, altText)
      onClose()
    } catch (error) {
      console.error('Failed to update', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    // Parent handles confirmation
    await onDelete(image.id)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col md:flex-row gap-6">
        <div className="flex-1 flex items-center justify-center bg-muted/20 rounded-lg p-4">
          <img
            src={image.url}
            alt={altText}
            className="max-w-full max-h-[60vh] object-contain rounded shadow-sm"
          />
        </div>

        <div className="w-full md:w-80 space-y-6 flex flex-col">
          <DialogHeader>
            <DialogTitle>Image Details</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 flex-1">
            <div className="space-y-2">
              <Label htmlFor="alt-text">Alt Text (Accessibility)</Label>
              <Input
                id="alt-text"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Describe the image..."
              />
              <p className="text-xs text-muted-foreground">
                Crucial for SEO and accessibility. Describe what's in the image.
              </p>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Filename</span>
                <span className="font-medium truncate max-w-[150px]" title={image.productTitle}>
                  {image.productTitle || 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Dimensions</span>
                <span className="font-medium">-</span> {/* Backend doesn't store this yet */}
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium">Image</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="w-full justify-start" onClick={handleCopyUrl}>
                <Copy className="mr-2 h-4 w-4" />
                Copy URL
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href={image.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open
                </a>
              </Button>
              {/* Download often requires server-side headers or a fetch blob trick which is overkill for now, 'Open' serves similar purpose */}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-col gap-2 mt-auto">
            <Button onClick={handleSave} disabled={isUpdating} className="w-full">
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>

            <Button variant="destructive" onClick={handleDelete} className="w-full">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Image
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
