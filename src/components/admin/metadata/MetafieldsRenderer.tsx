"use client"

import { useState, useEffect } from 'react'
import { getMetafieldDefinitionsAction, updateMetafieldAction, getMetafieldsAction, getMetaobjectsAction } from '@/actions/metadata'
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import Loading from "@/components/ui/Loading"

interface MetafieldsRendererProps {
  ownerType: string
  ownerId?: string
  onChange?: (metafields: any[]) => void
  definitions?: any[] // Optional override
}

export function MetafieldsRenderer({ ownerType, ownerId, onChange, definitions: propDefinitions }: MetafieldsRendererProps) {
  const [definitions, setDefinitions] = useState<any[]>([])
  const [values, setValues] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (propDefinitions) {
      setDefinitions(propDefinitions)
      setLoading(false)
    } else {
      loadData()
    }
  }, [ownerType, ownerId, propDefinitions])

  async function loadData() {
    setLoading(true)
    try {
      // 1. Load Definitions
      const defsRes = await getMetafieldDefinitionsAction(ownerType)
      if (defsRes.success) {
        setDefinitions(defsRes.data || [])
      }

      // 2. Load Values if ownerId exists
      if (ownerId && defsRes.data && defsRes.data.length > 0) {
        // We assume we have an action to get all metafields for an owner
        // If not, we might need to fetch them one by one or add a bulk fetch action.
        // For now, let's assume we fetch them all via a new server action or helper.
        // Actually, we can use `getMetafieldsAction` if we expose `getMetafields` from lib properly
      }
    } catch (error) {
      console.error('Failed to load metadata', error)
    } finally {
      setLoading(false)
    }
  }

  // Load existing values specifically
  useEffect(() => {
    if (!ownerId) return;
    async function loadValues() {
      if (!ownerId) return;
      const res = await getMetafieldsAction(ownerType, ownerId)
      if (res.success && Array.isArray(res.data)) {
        const valMap: Record<string, any> = {}
        res.data.forEach((m: any) => {
          valMap[m.key] = { value: m.value, type: m.type }
        })
        setValues(valMap)
      }
    }
    loadValues()
  }, [ownerId, ownerType])

  function handleChange(key: string, value: any, type: string) {
    const newValues = { ...values, [key]: { value, type } }
    setValues(newValues)

    if (onChange) {
      // Transform to array for parent
      const metafieldsArray = Object.entries(newValues).map(([k, v]: [string, any]) => ({
        key: k,
        value: v.value,
        type: v.type,
        namespace: 'custom' // Defaulting to custom for now
      }))
      onChange(metafieldsArray)
    }
  }

  if (loading) return <div className="py-4"><Loading variant="centered" size="sm" /></div>
  if (definitions.length === 0) return null

  return (
    <div className="space-y-4 rounded-lg border bg-card p-6">
      <h3 className="text-lg font-medium">Metafields</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {definitions.map(def => (
          <div key={def.id} className="space-y-2">
            <Label>{def.name}</Label>
            {renderInput(def, values[def.key]?.value, (val) => handleChange(def.key, val, def.type))}
            {def.description && <p className="text-xs text-muted-foreground">{def.description}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}



// Reuse the Metaobject logic for other resources too?
// We need specific fetchers.
// Reuse the Metaobject logic for other resources too?
// We need specific fetchers.
import { getProductsAction } from '@/actions/products'
import { getCollectionsAction } from '@/actions/collections'
import { getCustomersAction } from '@/actions/customers'
import { getOrdersAction } from '@/actions/orders'
import { getImagesAction } from '@/actions/media'

function ResourceReferenceInput({ def, value, onChange }: { def: any, value: any, onChange: (val: any) => void }) {
  const [options, setOptions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Map def.type to the fetching action
  useEffect(() => {
    let fetcher: (() => Promise<any>) | null = null;

    if (def.type === 'product_reference') {
      fetcher = () => getProductsAction().then(res => ({ data: res.products, labelKey: 'title' }));
    } else if (def.type === 'collection_reference') {
      fetcher = () => getCollectionsAction().then(res => ({ data: res.collections, labelKey: 'name' }));
    } else if (def.type === 'customer_reference') {
      fetcher = () => getCustomersAction().then(res => ({ data: res.customers, labelKey: 'first_name', labelKey2: 'last_name' }));
    } else if (def.type === 'order_reference') {
      fetcher = () => getOrdersAction().then(res => ({ data: res.orders, labelKey: 'orderNumber', fallbackKey: 'id' }));
    } else if (def.type === 'file_reference') {
      fetcher = () => getImagesAction().then(res => ({ data: res, labelKey: 'url' }));
    }
    // Page reference not fully implemented yet in backend actions

    if (fetcher) {
      setLoading(true)
      fetcher().then(res => {
        const data = Array.isArray(res.data) ? res.data : [];
        setOptions(data.map((item: any) => ({
          id: String(item.id),
          label: item[res.labelKey || 'title']
            ? (res.labelKey2 ? `${item[res.labelKey]} ${item[res.labelKey2]}` : item[res.labelKey])
            : (item[res.fallbackKey || 'id'] || item.id)
        })))
      }).catch(console.error).finally(() => setLoading(false))
    }
  }, [def.type])

  return (
    <Select value={value ? String(value) : ''} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select resource..." />
      </SelectTrigger>
      <SelectContent>
        {options.map(opt => (
          <SelectItem key={opt.id} value={opt.id}>
            {opt.label}
          </SelectItem>
        ))}
        {options.length === 0 && <div className="p-2 text-sm text-muted-foreground">No items found</div>}
      </SelectContent>
    </Select>
  )
}

function MetaobjectReferenceInput({ def, value, onChange }: { def: any, value: any, onChange: (val: any) => void }) {
  const [options, setOptions] = useState<any[]>([])

  useEffect(() => {
    // If validation.type is present, use it. Otherwise fetch all.
    const targetType = def.validation?.type;

    getMetaobjectsAction(targetType).then(res => {
      if (res.success && res.data) {
        setOptions(res.data)
      }
    })
  }, [def])

  return (
    <Select value={value || ''} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select reference..." />
      </SelectTrigger>
      <SelectContent>
        {options.map(opt => (
          <SelectItem key={opt.id} value={opt.handle}>
            {/* Show type if not filtered by type */}
            {def.validation?.type ? opt.display_name : `[${opt.type_name}] ${opt.display_name}`}
          </SelectItem>
        ))}
        {options.length === 0 && <div className="p-2 text-sm text-muted-foreground">No metaobjects found</div>}
      </SelectContent>
    </Select>
  )
}

function renderInput(def: any, currentValue: any, onChange: (val: any) => void) {
  switch (def.type) {
    case 'metaobject_reference':
      return <MetaobjectReferenceInput def={def} value={currentValue} onChange={onChange} />
    case 'multi_line_text_field':
    case 'json':
      return <Textarea value={currentValue || ''} onChange={e => onChange(e.target.value)} placeholder={def.key} />
    case 'boolean':
      return (
        <div className="flex items-center h-10">
          <Switch checked={currentValue === 'true' || currentValue === true} onCheckedChange={checked => onChange(checked)} />
        </div>
      )
    case 'number_integer':
    case 'number_decimal':
      return <Input type="number" value={currentValue || ''} onChange={e => onChange(e.target.value)} placeholder="0" />
    case 'color':
      return <Input type="color" value={currentValue || '#000000'} onChange={e => onChange(e.target.value)} className="h-10 w-20 p-1" />
    case 'date':
      return <Input type="date" value={currentValue || ''} onChange={e => onChange(e.target.value)} />
    case 'date_time':
      return <Input type="datetime-local" value={currentValue || ''} onChange={e => onChange(e.target.value)} />
    case 'url':
      return <Input type="url" value={currentValue || ''} onChange={e => onChange(e.target.value)} placeholder="https://" />
    case 'email':
      return <Input type="email" value={currentValue || ''} onChange={e => onChange(e.target.value)} placeholder="example@email.com" />
    case 'weight':
    case 'volume':
    case 'dimension':
      // Simplified for now: just text. In future, composite input for Value + Unit.
      return <Input type="text" value={currentValue || ''} onChange={e => onChange(e.target.value)} placeholder="e.g. 10 kg" />
    case 'rating':
      // Simple number input constrained 0-5
      return <Input type="number" min="0" max="5" step="0.1" value={currentValue || ''} onChange={e => onChange(e.target.value)} placeholder="0-5" />
    case 'money':
      return <Input type="number" step="0.01" value={currentValue || ''} onChange={e => onChange(e.target.value)} placeholder="0.00" />
    case 'rich_text_field':
      // Placeholder for rich text editor
      return <Textarea className="min-h-[150px]" value={currentValue || ''} onChange={e => onChange(e.target.value)} placeholder="Rich content..." />

    // References
    case 'product_reference':
    case 'variant_reference':
    case 'collection_reference':
    case 'customer_reference':
    case 'page_reference':
    case 'order_reference':
    case 'file_reference':
      return <ResourceReferenceInput def={def} value={currentValue} onChange={onChange} />

    default:
      return <Input type="text" value={currentValue || ''} onChange={e => onChange(e.target.value)} placeholder={def.key} />
  }
}
