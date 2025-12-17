'use client';

import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, ImageIcon, Edit2, Upload, Star } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"



export interface Variant {
  id: string;
  title: string;
  sku: string;
  price: number;
  stock: number;
  options: Record<string, string>;
  images: string[];
}

interface ProductOption {
  id: string;
  name: string;
  values: string[];
}

interface VariantsTableProps {
  variants: Variant[];
  options: ProductOption[];
  onChange: (variants: Variant[]) => void;
  availableImages: string[];
  onImageUpload: (files: File[]) => Promise<string[]>;
}

export function VariantsTable({ variants, options, onChange, availableImages, onImageUpload }: VariantsTableProps) {
  const [selectedVariants, setSelectedVariants] = useState<string[]>([]);
  const [uploadingVariantId, setUploadingVariantId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeVariantForUpload, setActiveVariantForUpload] = useState<string | null>(null);

  // ... (existing state) ...

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !activeVariantForUpload) return;

    setUploadingVariantId(activeVariantForUpload);
    try {
      const urls = await onImageUpload(Array.from(files));

      // Auto assign uploaded images to the active variant
      const variant = variants.find(v => v.id === activeVariantForUpload);
      if (variant) {
        const currentImages = variant.images || [];
        updateVariant(variant.id, 'images', [...currentImages, ...urls]);
      }
    } catch (error) {
      console.error("Upload failed", error);
      alert("Failed to upload image");
    } finally {
      setUploadingVariantId(null);
      setActiveVariantForUpload(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerUpload = (variantId: string) => {
    setActiveVariantForUpload(variantId);
    setTimeout(() => fileInputRef.current?.click(), 0);
  };

  // ... (return) ...


  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [bulkEditField, setBulkEditField] = useState<'price' | 'stock' | null>(null);
  const [bulkValue, setBulkValue] = useState("");

  const updateVariant = (id: string, field: keyof Variant, value: any) => {
    const newVariants = variants.map((v) =>
      v.id === id ? { ...v, [field]: value } : v
    );
    onChange(newVariants);
  };

  const removeVariant = (id: string) => {
    if (confirm("Are you sure you want to delete this variant?")) {
      onChange(variants.filter(v => v.id !== id));
    }
  }

  // Selection Logic
  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedVariants(variants.map(v => v.id));
    } else {
      setSelectedVariants([]);
    }
  };

  const toggleSelectVariant = (id: string, checked: boolean) => {
    setSelectedVariants(prev =>
      checked ? [...prev, id] : prev.filter(vId => vId !== id)
    );
  };


  // Bulk Actions
  const applyBulkEdit = () => {
    if (!bulkEditField || !bulkValue) return;

    const numValue = parseFloat(bulkValue);
    if (isNaN(numValue)) return;

    const newVariants = variants.map(v => {
      if (selectedVariants.includes(v.id)) {
        return { ...v, [bulkEditField]: numValue };
      }
      return v;
    });

    onChange(newVariants);
    setIsBulkEditOpen(false);
    setBulkValue("");
    setBulkEditField(null);
  };

  const openBulkEdit = (field: 'price' | 'stock') => {
    setBulkEditField(field);
    setIsBulkEditOpen(true);
  }

  const assignImageToSelected = (img: string) => {
    const newVariants = variants.map(v => {
      if (selectedVariants.includes(v.id)) {
        // For bulk, let's just append if not exists, or replace? Usually replace is expected in bulk.
        // Or if we want to "Add" image to selection.
        // Let's go with "Add to selection" as it's safer, or "Replace" if that's what was seemingly implied.
        // Given UX of single select in bulk menu, let's append.
        const current = v.images || [];
        return { ...v, images: current.includes(img) ? current : [...current, img] };
      }
      return v;
    });
    onChange(newVariants);
  };

  if (variants.length === 0) return null;

  // grid-cols definition based on number of options
  // Checkbox (auto), Options (n * 1fr), Price (100px), Stock (100px), SKU (150px), Media (100px), Actions (40px)
  // Checkbox (40px) | Options (min 120px) | Price (120px) | Stock (100px) | SKU (150px) | Media (250px) | Actions (50px)
  const gridTemplateColumns = `40px repeat(${options.length}, minmax(120px, 1fr)) 120px 100px 150px 250px 50px`;

  return (
    <div className="space-y-4">
      {/* Bulk Actions Bar */}
      {selectedVariants.length > 0 && (
        <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 animate-in fade-in slide-in-from-top-2">
          <span className="font-medium ml-2">{selectedVariants.length} selected</span>
          <div className="h-4 w-px bg-blue-200 mx-2" />
          <Button type="button" size="sm" variant="ghost" className="h-7 hover:bg-blue-100 hover:text-blue-800" onClick={() => openBulkEdit('price')}>
            Edit Price
          </Button>
          <Button type="button" size="sm" variant="ghost" className="h-7 hover:bg-blue-100 hover:text-blue-800" onClick={() => openBulkEdit('stock')}>
            Edit Stock
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" size="sm" variant="ghost" className="h-7 hover:bg-blue-100 hover:text-blue-800">
                Assign Image
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[300px]">
              <DropdownMenuLabel>Select Image</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="grid grid-cols-4 gap-2 p-2 max-h-[200px] overflow-y-auto">
                {availableImages.map((img, i) => (
                  <button type="button" key={i} onClick={() => assignImageToSelected(img)} className="relative aspect-square border rounded hover:ring-2 hover:ring-blue-500 overflow-hidden">
                    <img src={img} className="w-full h-full object-cover" />
                  </button>
                ))}
                {availableImages.length === 0 && <span className="col-span-4 text-xs text-center text-muted-foreground py-4">No images uploaded yet</span>}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex-1" />
          <Button type="button" size="sm" variant="ghost" className="h-7 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => {
            if (confirm(`Delete ${selectedVariants.length} variants?`)) {
              onChange(variants.filter(v => !selectedVariants.includes(v.id)));
              setSelectedVariants([]);
            }
          }}>
            Delete
          </Button>
        </div>
      )}

      <div className="rounded-md border overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 border-b px-4 py-3 grid gap-4 text-xs font-medium uppercase text-gray-500 items-center" style={{ gridTemplateColumns }}>
          <div className="flex items-center">
            <Checkbox
              checked={selectedVariants.length === variants.length && variants.length > 0}
              onCheckedChange={(c) => toggleSelectAll(!!c)}
            />
          </div>

          {/* Option Headers */}
          {options.map(opt => (
            <div key={opt.id}>{opt.name}</div>
          ))}

          <div>Price</div>
          <div>Stock</div>
          <div>Product Number</div> {/* Matched Screenshot Terminology */}
          <div>Media</div>
          <div></div>{/* Actions */}
        </div>

        <div className="divide-y">
          {variants.map(variant => (
            <div key={variant.id} className="grid gap-4 items-center px-4 py-3 bg-white hover:bg-gray-50/30" style={{ gridTemplateColumns }}>
              <div className="flex items-center">
                <Checkbox
                  checked={selectedVariants.includes(variant.id)}
                  onCheckedChange={(c) => toggleSelectVariant(variant.id, !!c)}
                />
              </div>

              {/* Option Values (Text) */}
              {options.map(opt => (
                <div key={opt.id} className="text-sm font-medium text-gray-700">
                  {variant.options[opt.name] || '-'}
                </div>
              ))}

              <div>
                <Input
                  type="number"
                  className="h-8 w-full"
                  value={variant.price ?? 0}
                  onChange={(e) => updateVariant(variant.id, 'price', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Input
                  type="number"
                  className="h-8 w-full"
                  value={variant.stock ?? 0}
                  onChange={(e) => updateVariant(variant.id, 'stock', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Input
                  type="text"
                  className="h-8 w-full"
                  value={variant.sku ?? ''}
                  onChange={(e) => updateVariant(variant.id, 'sku', e.target.value)}
                />
              </div>

              {/* Media Column (Right Side) */}
              <div className="flex items-center gap-1 overflow-x-auto max-w-[200px]">
                {/* Show selected images */}
                {variant.images && variant.images.length > 0 ? (
                  variant.images.map((img, i) => (
                    <div key={i} className="w-8 h-8 border rounded bg-gray-100 flex-shrink-0 overflow-hidden relative group">
                      <img src={img} className="w-full h-full object-cover" />

                      {/* Main Media Indicator */}
                      {i === 0 && (
                        <div className="absolute top-0 right-0 bg-yellow-400 text-[6px] p-0.5 rounded-bl shadow-sm z-10">
                          <Star className="w-2 h-2 fill-black text-black" />
                        </div>
                      )}

                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition-opacity">
                        {/* Set Main Button */}
                        {i !== 0 && (
                          <button
                            type="button"
                            title="Set as Main"
                            onClick={() => {
                              const newImages = [...variant.images];
                              const [selected] = newImages.splice(i, 1);
                              newImages.unshift(selected);
                              updateVariant(variant.id, 'images', newImages);
                            }}
                            className="text-white hover:text-yellow-400"
                          >
                            <Star className="w-3 h-3" />
                          </button>
                        )}

                        {/* Remove Button */}
                        <button
                          type="button"
                          title="Remove"
                          onClick={() => {
                            const newImages = variant.images.filter(imgUrl => imgUrl !== img);
                            updateVariant(variant.id, 'images', newImages);
                          }}
                          className="text-white hover:text-red-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  // Default Fallback
                  availableImages[0] ? (
                    <div className="w-8 h-8 border rounded bg-gray-100 flex-shrink-0 overflow-hidden opacity-50 relative group" title="Default Image">
                      <img src={availableImages[0]} className="w-full h-full object-cover grayscale" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 border rounded bg-gray-100 flex justify-center items-center">
                      <ImageIcon className="w-3 h-3 text-gray-300" />
                    </div>
                  )
                )}

                {/* Image Picker Popup Trigger (Add Button) */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button type="button" className="w-8 h-8 border border-dashed rounded flex flex-shrink-0 items-center justify-center hover:bg-gray-50 text-gray-400 hover:text-blue-500">
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[280px]">
                    <DropdownMenuLabel>Assign Images ({variant.images?.length || 0})</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="p-2 border-b mb-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full gap-2"
                        disabled={uploadingVariantId === variant.id}
                        onClick={(e) => {
                          e.preventDefault();
                          triggerUpload(variant.id);
                        }}
                      >
                        {uploadingVariantId === variant.id ? (
                          <span className="w-3 h-3 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Upload className="w-3 h-3" />
                        )}
                        Upload from Computer
                      </Button>
                    </div>
                    <div className="grid grid-cols-4 gap-2 p-2 max-h-[200px] overflow-y-auto">
                      {availableImages.length > 0 ? (
                        availableImages.map((img, i) => {
                          const isSelected = variant.images?.includes(img);
                          return (
                            <button
                              type="button"
                              key={i}
                              onClick={(e) => {
                                e.preventDefault();
                                const currentImages = variant.images || [];
                                const newImages = isSelected
                                  ? currentImages.filter(url => url !== img)
                                  : [...currentImages, img];
                                updateVariant(variant.id, 'images', newImages);
                              }}
                              className={`relative aspect-square border rounded overflow-hidden transition-all ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : 'hover:ring-1 hover:ring-gray-300'}`}
                            >
                              <img src={img} className="w-full h-full object-cover" />
                              {isSelected && (
                                <div className="absolute top-0.5 right-0.5 w-3 h-3 bg-blue-500 rounded-full border border-white" />
                              )}
                            </button>
                          );
                        })
                      ) : (
                        <div className="col-span-4 text-center py-4 px-2">
                          <p className="text-xs text-muted-foreground mb-2">No product images.</p>
                        </div>
                      )}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="text-right">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-red-600"
                  onClick={() => removeVariant(variant.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bulk Edit Dialog */}
      <Dialog open={isBulkEditOpen} onOpenChange={setIsBulkEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Bulk Edit {bulkEditField === 'price' ? 'Price' : 'Stock'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="bulk-value">
                New {bulkEditField === 'price' ? 'Price' : 'Stock'} for {selectedVariants.length} variants
              </Label>
              <Input
                id="bulk-value"
                type="number"
                value={bulkValue}
                onChange={(e) => setBulkValue(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={applyBulkEdit}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept="image/*"
        multiple
      />
    </div>
  );
}
