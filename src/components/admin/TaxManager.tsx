
'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit, Save } from 'lucide-react'
import Loading from '@/components/ui/Loading'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  getTaxClassesAction, createTaxClassAction, updateTaxClassAction, deleteTaxClassAction,
  getTaxRulesAction, createTaxRuleAction, updateTaxRuleAction, deleteTaxRuleAction
} from '@/actions/tax'

interface TaxManagerProps {
  settings: any
  onChange: (key: string, value: any) => void
}

export function TaxManager({ settings, onChange }: TaxManagerProps) {
  const [activeTab, setActiveTab] = useState('settings')

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium">Tax Management</h3>
          <p className="text-sm text-muted-foreground">Configure tax rates, classes, and rules.</p>
        </div>
        <TabsList>
          <TabsTrigger value="settings">General Settings</TabsTrigger>
          <TabsTrigger value="classes">Tax Classes</TabsTrigger>
          <TabsTrigger value="rules">Tax Rules</TabsTrigger>
        </TabsList>
      </div>

      <div className="flex-1 overflow-auto">
        <TabsContent value="settings" className="space-y-4 mt-0">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">Enable Taxes</Label>
              <div className="text-sm text-muted-foreground">Calculate taxes at checkout</div>
            </div>
            <Switch
              checked={settings.taxEnabled || false}
              onCheckedChange={checked => onChange('taxEnabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">Prices Include Tax</Label>
              <div className="text-sm text-muted-foreground">If enabled, tax is extracted from the price. If disabled, tax is added to the price.</div>
            </div>
            <Switch
              checked={settings.pricesIncludeTax || false}
              onCheckedChange={checked => onChange('pricesIncludeTax', checked)}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">Display Prices With Tax</Label>
              <div className="text-sm text-muted-foreground">Show tax-inclusive prices on storefront</div>
            </div>
            <Switch
              checked={settings.displayPricesWithTax || false}
              onCheckedChange={checked => onChange('displayPricesWithTax', checked)}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">Charge Tax on Shipping</Label>
              <div className="text-sm text-muted-foreground">Apply taxes to shipping costs based on shipping rules or standard rate</div>
            </div>
            <Switch
              checked={settings.shippingTaxable || false}
              onCheckedChange={checked => onChange('shippingTaxable', checked)}
            />
          </div>
        </TabsContent>

        <TabsContent value="classes" className="mt-0 h-full">
          <TaxClassesManager />
        </TabsContent>

        <TabsContent value="rules" className="mt-0 h-full">
          <TaxRulesManager />
        </TabsContent>
      </div>
    </Tabs>
  )
}

function TaxClassesManager() {
  const [classes, setClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({ name: '', isDefault: false })

  useEffect(() => {
    loadClasses()
  }, [])

  async function loadClasses() {
    setLoading(true)
    const res = await getTaxClassesAction()
    setClasses(res)
    setLoading(false)
  }

  async function handleSubmit() {
    if (editingId) {
      await updateTaxClassAction(editingId, formData)
    } else {
      await createTaxClassAction(formData)
    }
    setIsDialogOpen(false)
    loadClasses()
  }

  async function handleDelete(id: number) {
    if (confirm('Are you sure? This might affect products using this class.')) {
      await deleteTaxClassAction(id)
      loadClasses()
    }
  }

  function openCreate() {
    setEditingId(null)
    setFormData({ name: '', isDefault: false })
    setIsDialogOpen(true)
  }

  function openEdit(cls: any) {
    setEditingId(cls.id)
    setFormData({ name: cls.name, isDefault: cls.is_default })
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate} size="sm"><Plus className="w-4 h-4 mr-2" /> Add Tax Class</Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Default</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center h-24">
                  <Loading variant="inline" size="sm" />
                  <span className="ml-2">Loading classes...</span>
                </TableCell>
              </TableRow>
            ) : classes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">No tax classes found.</TableCell>
              </TableRow>
            ) : (
              classes.map((cls) => (
                <TableRow key={cls.id}>
                  <TableCell className="font-medium">{cls.name}</TableCell>
                  <TableCell>{cls.is_default ? 'Yes' : 'No'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(cls)}><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(cls.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Tax Class' : 'Add Tax Class'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={formData.isDefault} onCheckedChange={checked => setFormData({ ...formData, isDefault: checked })} />
              <Label>Is Default</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function TaxRulesManager() {
  const [rules, setRules] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const initialForm = {
    name: '',
    tax_class_id: '',
    country_code: '',
    state_code: '',
    zip_code: '',
    rate: 0,
    priority: 0,
    is_compound: false,
    is_shipping: false
  }
  const [formData, setFormData] = useState(initialForm)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const [r, c] = await Promise.all([getTaxRulesAction(), getTaxClassesAction()])
    setRules(r)
    setClasses(c)
    setLoading(false)
  }

  async function handleSubmit() {
    const payload = {
      ...formData,
      tax_class_id: parseInt(formData.tax_class_id),
      rate: Number(formData.rate),
      priority: Number(formData.priority)
    }

    if (editingId) {
      await updateTaxRuleAction(editingId, payload)
    } else {
      await createTaxRuleAction(payload)
    }
    setIsDialogOpen(false)
    loadData()
  }

  async function handleDelete(id: number) {
    if (confirm('Are you sure you want to delete this rule?')) {
      await deleteTaxRuleAction(id)
      loadData()
    }
  }

  function openCreate() {
    setEditingId(null)
    setFormData(initialForm)
    if (classes.length > 0) {
      setFormData(prev => ({ ...prev, tax_class_id: classes[0].id.toString() }))
    }
    setIsDialogOpen(true)
  }

  function openEdit(rule: any) {
    setEditingId(rule.id)
    setFormData({
      name: rule.name,
      tax_class_id: rule.tax_class_id.toString(),
      country_code: rule.country_code,
      state_code: rule.state_code || '',
      zip_code: rule.zip_code || '',
      rate: rule.rate,
      priority: rule.priority,
      is_compound: rule.is_compound,
      is_shipping: rule.is_shipping
    })
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate} size="sm"><Plus className="w-4 h-4 mr-2" /> Add Tax Rule</Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Rate (%)</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24">
                  <Loading variant="inline" size="sm" />
                  <span className="ml-2">Loading rules...</span>
                </TableCell>
              </TableRow>
            ) : rules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">No tax rules found.</TableCell>
              </TableRow>
            ) : (
              rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">
                    {rule.name}
                    {rule.is_shipping && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">Shipping</span>}
                    {rule.is_compound && <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">Compound</span>}
                  </TableCell>
                  <TableCell>{rule.tax_class_name}</TableCell>
                  <TableCell>{rule.country_code}</TableCell>
                  <TableCell>{rule.state_code || '*'}</TableCell>
                  <TableCell>{rule.rate}%</TableCell>
                  <TableCell>{rule.priority}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(rule)}><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(rule.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Tax Rule' : 'Add Tax Rule'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 space-y-2">
              <Label>Rule Name</Label>
              <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. VAT UK" />
            </div>

            <div className="space-y-2">
              <Label>Tax Class</Label>
              <Select value={formData.tax_class_id} onValueChange={(val: string) => setFormData({ ...formData, tax_class_id: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(c => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Rate (%)</Label>
              <Input type="number" value={formData.rate} onChange={e => setFormData({ ...formData, rate: parseFloat(e.target.value) })} />
            </div>

            <div className="space-y-2">
              <Label>Country Code</Label>
              <Input value={formData.country_code} onChange={e => setFormData({ ...formData, country_code: e.target.value })} placeholder="US, UK, *" />
            </div>

            <div className="space-y-2">
              <Label>State Code (Optional)</Label>
              <Input value={formData.state_code} onChange={e => setFormData({ ...formData, state_code: e.target.value })} placeholder="NY, CA, *" />
            </div>

            <div className="space-y-2">
              <Label>Zip/Postal (Optional)</Label>
              <Input value={formData.zip_code} onChange={e => setFormData({ ...formData, zip_code: e.target.value })} placeholder="10001, 100*, *" />
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Input type="number" value={formData.priority} onChange={e => setFormData({ ...formData, priority: parseInt(e.target.value) })} />
            </div>

            <div className="col-span-2 flex items-center gap-6 pt-2">
              <div className="flex items-center gap-2">
                <Switch checked={formData.is_compound} onCheckedChange={checked => setFormData({ ...formData, is_compound: checked })} />
                <Label>Compound Tax</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={formData.is_shipping} onCheckedChange={checked => setFormData({ ...formData, is_shipping: checked })} />
                <Label>Shipping Tax</Label>
              </div>
            </div>

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
