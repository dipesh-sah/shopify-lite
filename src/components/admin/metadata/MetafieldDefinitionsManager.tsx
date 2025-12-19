"use client"

import { useState, useEffect } from 'react'
import {
  getMetafieldDefinitionsAction,
  createMetafieldDefinitionAction,
  updateMetafieldDefinitionAction,
  deleteMetafieldDefinitionAction
} from '@/actions/metadata'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export function MetafieldDefinitionsManager() {
  const [definitions, setDefinitions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeOwner, setActiveOwner] = useState('product')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDef, setEditingDef] = useState<any>(null)

  const [formData, setFormData] = useState({
    namespace: 'custom',
    key: '',
    name: '',
    description: '',
    type: 'single_line_text_field',
    validation: {
      min: '',
      max: '',
      regex: ''
    }
  })

  useEffect(() => {
    loadData()
  }, [activeOwner])

  async function loadData() {
    setLoading(true)
    try {
      const res = await getMetafieldDefinitionsAction(activeOwner)
      if (res.success) {
        setDefinitions(res.data || [])
      }
    } catch (error) {
      console.error('Failed to load definitions', error)
    } finally {
      setLoading(false)
    }
  }

  function handleAddNew() {
    setEditingDef(null)
    setFormData({
      namespace: 'custom',
      key: '',
      name: '',
      description: '',
      type: 'single_line_text_field',
      isList: false,
      validation: { min: '', max: '', regex: '' }
    })
    setIsModalOpen(true)
  }

  function handleEdit(def: any) {
    setEditingDef(def)
    setFormData({
      namespace: def.namespace,
      key: def.key,
      name: def.name,
      description: def.description || '',
      type: def.type.replace(/^list\./, ''), // Strip list prefix for the selector
      isList: def.type.startsWith('list.'),
      validation: def.validation || { min: '', max: '', regex: '' }
    })
    setIsModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (editingDef) {
        await updateMetafieldDefinitionAction(editingDef.id, {
          name: formData.name,
          description: formData.description,
          validation: formData.validation
          // Note: Changing key/type/namespace is usually restricted to avoid data loss
        })
      } else {
        await createMetafieldDefinitionAction({
          ...formData,
          type: formData.isList ? `list.${formData.type}` : formData.type,
          ownerType: activeOwner
        })
      }
      setIsModalOpen(false)
      loadData()
    } catch (error) {
      console.error('Operation failed', error)
      alert('Operation failed')
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure? This will not delete the actual values on resources, but will remove the definition.')) return
    await deleteMetafieldDefinitionAction(id)
    loadData()
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Metafield Definitions</h2>
          <Select value={activeOwner} onValueChange={setActiveOwner}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Resource" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="product">Products</SelectItem>
              <SelectItem value="variant">Variants</SelectItem>
              <SelectItem value="collection">Collections</SelectItem>
              <SelectItem value="customer">Customers</SelectItem>
              <SelectItem value="order">Orders</SelectItem>
              <SelectItem value="shop">Shop</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleAddNew} size="sm">
          <Plus className="mr-2 h-4 w-4" /> Add Definition
        </Button>
      </div>

      <div className="rounded-md border bg-card flex-1 overflow-hidden flex flex-col">
        <div className="relative w-full overflow-auto flex-1">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b sticky top-0 bg-secondary/50 backdrop-blur z-10">
              <tr className="border-b transition-colors hover:bg-muted/50">
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Key</th>
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Type</th>
                <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {definitions.map((def) => (
                <tr key={def.id} className="border-b transition-colors hover:bg-muted/50">
                  <td className="p-4 align-middle">
                    <div className="font-medium">{def.name}</div>
                    <div className="text-xs text-muted-foreground">{def.description}</div>
                  </td>
                  <td className="p-4 align-middle">
                    <div className="font-mono text-xs">{def.namespace}.{def.key}</div>
                  </td>
                  <td className="p-4 align-middle">
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                      {def.type}
                    </span>
                  </td>
                  <td className="p-4 align-middle text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(def)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(def.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {definitions.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-muted-foreground">No definitions found for {activeOwner}.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingDef ? 'Edit Definition' : 'Add New Definition'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Namespace</Label>
                <Input
                  value={formData.namespace}
                  onChange={e => setFormData({ ...formData, namespace: e.target.value })}
                  disabled={!!editingDef}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Key</Label>
                <Input
                  value={formData.key}
                  onChange={e => setFormData({ ...formData, key: e.target.value })}
                  required
                  disabled={!!editingDef}
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                {editingDef ? (
                  <Input value={formData.type} disabled />
                ) : (
                  <Select value={formData.type} onValueChange={(val: string) => setFormData({ ...formData, type: val })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] overflow-y-auto">
                      <SelectGroup>
                        <SelectLabel>Text</SelectLabel>
                        <SelectItem value="single_line_text_field">Single line text</SelectItem>
                        <SelectItem value="multi_line_text_field">Multi-line text</SelectItem>
                        <SelectItem value="rich_text_field">Rich text</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                      </SelectGroup>

                      <SelectGroup>
                        <SelectLabel>Reference</SelectLabel>
                        <SelectItem value="product_reference">Product</SelectItem>
                        <SelectItem value="variant_reference">Product variant</SelectItem>
                        <SelectItem value="collection_reference">Collection</SelectItem>
                        <SelectItem value="customer_reference">Customer</SelectItem>
                        <SelectItem value="order_reference">Order</SelectItem>
                        <SelectItem value="page_reference">Page</SelectItem>
                        <SelectItem value="metaobject_reference">Metaobject</SelectItem>
                        <SelectItem value="file_reference">File</SelectItem>
                      </SelectGroup>

                      <SelectGroup>
                        <SelectLabel>Number</SelectLabel>
                        <SelectItem value="number_integer">Integer</SelectItem>
                        <SelectItem value="number_decimal">Decimal</SelectItem>
                        <SelectItem value="rating">Rating</SelectItem>
                        <SelectItem value="weight">Weight</SelectItem>
                        <SelectItem value="volume">Volume</SelectItem>
                        <SelectItem value="dimension">Dimension</SelectItem>
                        <SelectItem value="money">Money</SelectItem>
                      </SelectGroup>

                      <SelectGroup>
                        <SelectLabel>Link</SelectLabel>
                        <SelectItem value="url">URL</SelectItem>
                      </SelectGroup>

                      <SelectGroup>
                        <SelectLabel>Date and time</SelectLabel>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="date_time">Date and time</SelectItem>
                      </SelectGroup>

                      <SelectGroup>
                        <SelectLabel>Other</SelectLabel>
                        <SelectItem value="boolean">True or false</SelectItem>
                        <SelectItem value="color">Color</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* Validation Rules Section */}
            <div className="rounded-md border p-4 space-y-4">
              <h4 className="text-sm font-medium">Validation Rules</h4>

              {['number_integer', 'number_decimal', 'money', 'weight', 'volume', 'dimension', 'rating'].includes(formData.type) && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Minimum Value</Label>
                    <Input
                      type="number"
                      value={formData.validation?.min || ''}
                      onChange={e => setFormData({ ...formData, validation: { ...formData.validation, min: e.target.value } })}
                      placeholder="e.g. 0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Maximum Value</Label>
                    <Input
                      type="number"
                      value={formData.validation?.max || ''}
                      onChange={e => setFormData({ ...formData, validation: { ...formData.validation, max: e.target.value } })}
                      placeholder="e.g. 100"
                    />
                  </div>
                </div>
              )}

              {['single_line_text_field', 'multi_line_text_field', 'email', 'url', 'json'].includes(formData.type) && (
                <div className="space-y-2">
                  <Label>Regex Pattern</Label>
                  <Input
                    value={formData.validation?.regex || ''}
                    onChange={e => setFormData({ ...formData, validation: { ...formData.validation, regex: e.target.value } })}
                    placeholder="e.g. ^[A-Z]+$"
                  />
                  <p className="text-[10px] text-muted-foreground">Regular expression for validation.</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
