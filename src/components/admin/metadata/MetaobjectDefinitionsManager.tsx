"use client"

import { useState, useEffect } from 'react'
import {
  getMetaobjectDefinitionsAction,
  defineMetaobjectAction,
  deleteMetaobjectDefinitionAction,
  updateMetaobjectDefinitionAction
} from '@/actions/metadata'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import Loading from '@/components/ui/Loading'
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
} from "@/components/ui/select"

export function MetaobjectDefinitionsManager() {
  const [definitions, setDefinitions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDef, setEditingDef] = useState<any>(null)

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    field_definitions: [] as any[]
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const res = await getMetaobjectDefinitionsAction()
      if (res.success) setDefinitions(res.data || [])
    } catch (error) {
      console.error('Failed to load', error)
    } finally {
      setLoading(false)
    }
  }

  function handleAddNew() {
    setEditingDef(null)
    setFormData({ name: '', type: '', field_definitions: [] })
    setIsModalOpen(true)
  }

  function handleAddNestedField() {
    setFormData(prev => ({
      ...prev,
      field_definitions: [
        ...prev.field_definitions,
        { key: '', name: '', type: 'single_line_text_field' } // default new field
      ]
    }))
  }

  function handleUpdateNestedField(index: number, field: string, value: string) {
    const newFields = [...formData.field_definitions];
    newFields[index] = { ...newFields[index], [field]: value };
    setFormData({ ...formData, field_definitions: newFields });
  }

  function handleRemoveNestedField(index: number) {
    const newFields = formData.field_definitions.filter((_, i) => i !== index);
    setFormData({ ...formData, field_definitions: newFields });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      // Validate fields
      if (formData.field_definitions.some(f => !f.key || !f.name)) {
        alert('All fields must have a Key and Name');
        return;
      }

      if (editingDef) {
        await updateMetaobjectDefinitionAction(editingDef.id, {
          name: formData.name,
          field_definitions: formData.field_definitions
        })
      } else {
        await defineMetaobjectAction(
          formData.type,
          formData.name,
          formData.field_definitions
        )
      }
      setIsModalOpen(false)
      loadData()
    } catch (error) {
      console.error(error)
      alert('Operation failed')
    }
  }

  function handleEdit(def: any) {
    setEditingDef(def)
    setFormData({
      name: def.name,
      type: def.type,
      field_definitions: Array.isArray(def.field_definitions) ? def.field_definitions : []
    })
    setIsModalOpen(true)
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure? This will delete the definition.')) return
    await deleteMetaobjectDefinitionAction(id)
    loadData()
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Metaobject Definitions</h2>
        <Button onClick={handleAddNew} size="sm">
          <Plus className="mr-2 h-4 w-4" /> Add Definition
        </Button>
      </div>

      <div className="rounded-md border bg-card flex-1 overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loading variant="centered" size="md" />
          </div>
        ) : (
          <div className="relative w-full overflow-auto flex-1">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b sticky top-0 bg-secondary/50 backdrop-blur z-10">
                <tr className="border-b transition-colors hover:bg-muted/50">
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">Name</th>
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">Type</th>
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">Fields</th>
                  <th className="h-10 px-4 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {definitions.map(def => (
                  <tr key={def.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle font-medium">{def.name}</td>
                    <td className="p-4 align-middle font-mono text-xs">{def.type}</td>
                    <td className="p-4 align-middle">
                      {Array.isArray(def.field_definitions) ? def.field_definitions.length : 0} fields
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
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingDef ? 'Edit Metaobject Definition' : 'New Metaobject Definition'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 py-4 flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name (Display)</Label>
                <Input
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Designer"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Type (Handle)</Label>
                <Input
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                  placeholder="e.g. designer"
                  required
                  disabled={!!editingDef}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Fields</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddNestedField}>
                  <Plus className="mr-2 h-3 w-3" /> Add Field
                </Button>
              </div>

              <div className="space-y-2 border rounded-md p-4 bg-muted/20">
                {formData.field_definitions.map((field, index) => (
                  <div key={index} className="flex gap-2 items-start border-b pb-2 last:border-0 last:pb-0">
                    <div className="grid grid-cols-3 gap-2 flex-1">
                      <Input
                        placeholder="Name"
                        value={field.name}
                        onChange={e => handleUpdateNestedField(index, 'name', e.target.value)}
                      />
                      <Input
                        placeholder="Key"
                        value={field.key}
                        onChange={e => handleUpdateNestedField(index, 'key', e.target.value)}
                      />
                      <Select
                        value={field.type}
                        onValueChange={(val: string) => handleUpdateNestedField(index, 'type', val)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single_line_text_field">Single Line Text</SelectItem>
                          <SelectItem value="multi_line_text_field">Multi Line Text</SelectItem>
                          <SelectItem value="number_integer">Integer</SelectItem>
                          <SelectItem value="number_decimal">Decimal</SelectItem>
                          <SelectItem value="url">URL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => handleRemoveNestedField(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {formData.field_definitions.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground p-4">No fields defined.</p>
                )}
              </div>
            </div>

            <DialogFooter className="mt-auto">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit">Save Definition</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
