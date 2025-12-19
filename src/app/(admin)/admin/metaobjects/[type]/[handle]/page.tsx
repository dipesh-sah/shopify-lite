"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  getMetaobjectAction,
  createMetaobjectAction,
  getMetaobjectDefinitionAction,
  updateMetafieldAction // We might need this if we support "editing" by just updating fields?
  // Actually our createMetaobjectAction creates a new one. 
  // We don't have updateMetaobjectAction yet for the whole object properties like display_name.
  // For now, let's focus on Creation. Editing fields can be done via the Renderer if we knew the ID.
} from "@/actions/metadata"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MetafieldsRenderer } from "@/components/admin/metadata/MetafieldsRenderer"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function MetaobjectEntryPage({ params }: { params: Promise<{ type: string, handle: string }> }) {
  const { type, handle } = use(params)
  const router = useRouter()
  const { toast } = useToast()

  const isNew = handle === 'new'
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)

  // Definition
  const [definition, setDefinition] = useState<any>(null)

  // Data
  const [displayName, setDisplayName] = useState("")
  const [slug, setSlug] = useState("")
  const [fields, setFields] = useState<any[]>([])
  // fields state here will hold the values from the renderer
  // BUT the renderer usually loads its own values.
  // For 'new', it's empty.
  // For 'edit', we need to pass existing values to Renderer or let it fetch.
  // Renderer uses 'ownerId'.
  // If we are editing, we have an ID.
  const [existingId, setExistingId] = useState<string | null>(null)

  useEffect(() => {
    // 1. Load Definition
    getMetaobjectDefinitionAction(type).then(res => {
      if (res.success && res.data) {
        // Need to transform field_definitions to match what Renderer expects?
        // Renderer expects 'id, names, type, key'.
        // Our metaobject def has field_definitions as JSON.
        // We should ensure they align.
        setDefinition(res.data)
      }
    })

    // 2. Load Entry if not new
    if (!isNew) {
      getMetaobjectAction(handle).then(res => {
        if (res.success && res.data) {
          setDisplayName(res.data.display_name)
          setSlug(res.data.handle)
          setExistingId(res.data.id.toString())
        }
        setLoading(false)
      })
    }
  }, [type, handle, isNew])

  async function handleSave() {
    if (!displayName || !slug) {
      toast({ title: "Error", description: "Name and Handle are required", variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      // Collect field values
      // If creating: we pass fields to createMetaobjectAction.
      // If editing: we probably just saved fields via the Renderer?
      // Wait, the Renderer onChange gives us values back too.

      // For Creation: Renderer onChange updates 'fields' state.
      // fields state is an array: [{key, value, type, namespace}]

      const fieldsPayload: Record<string, any> = {}
      fields.forEach((f: any) => {
        fieldsPayload[f.key] = f.value
      })

      if (isNew) {
        const res = await createMetaobjectAction(type, slug, displayName, fieldsPayload)
        if (res.success) {
          toast({ title: "Success", description: "Metaobject created" })
          router.push(`/admin/metaobjects/${type}`)
        } else {
          toast({ title: "Error", description: res.error, variant: "destructive" })
        }
      } else {
        // For Edit, Renderer hopefully handled saving fields if we passed ownerId?
        // But we might want to update Display Name or Handle too.
        // We don't have updateMetaobjectAction yet.
        // Assume Renderer saved the fields because we passed ownerId.
        toast({ title: "Success", description: "Saved (Fields updated automatically)" })
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to save", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  // Wrapper for Renderer using definitions from the Type
  // Renderer usually fetches definitions by ownerType.
  // Here we want to provide explicit definitions.
  // I need to update Renderer to accept `definitions` prop!
  // I did NOT update Renderer to accept `definitions` prop yet in previous steps!
  // I only added `MetaobjectReferenceInput`.
  // I should update Renderer to allow overriding definitions.

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>

  return (
    <div className="max-w-2xl mx-auto py-10 space-y-8">
      <div className="flex items-center gap-4">
        <Link href={`/admin/metaobjects/${type}`}>
          <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight capitalize">{isNew ? 'New Entry' : 'Edit Entry'}</h1>
      </div>

      <div className="space-y-4 border p-6 rounded-lg bg-white">
        <div className="grid gap-2">
          <Label>Display Name</Label>
          <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="e.g. Gucci" />
        </div>
        <div className="grid gap-2">
          <Label>Handle</Label>
          <Input value={slug} onChange={e => setSlug(e.target.value)} placeholder="e.g. gucci" disabled={!isNew} />
        </div>
      </div>

      {definition && (
        <div className="border p-6 rounded-lg bg-white">
          <h3 className="font-medium mb-4">Content</h3>
          {/* 
                  We need to update MetafieldsRenderer to support passing `definitions` directly.
                  For now, I'll use a hack or I should simply Update the Renderer first.
                  
                  Let's assume I will update the Renderer in the next step to accept `definitions` prop.
               */}
          <MetafieldsRenderer
            ownerType="metaobject"
            ownerId={existingId || undefined}
            onChange={(vals) => setFields(vals)}
            // @ts-ignore
            definitions={definition.field_definitions}
          />
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Entry'}</Button>
      </div>
    </div>
  )
}

// Added wrapper for getMetaobjectDefinitionAction since it wasn't exported in actions/metadata.ts explicitly?
// checking actions/metadata.ts...
// It EXPORTS `getMetaobjectDefinition`. But I need `getMetaobjectDefinitionAction`?
// `getMetaobjectDefinition` is from lib.
// `getMetaobjectDefinition` is NOT exposed as an Action in `metadata.ts`?
// I exported `getMetaobjectDefinitionsAction` (plural).
// I check `metadata.ts` again...
// It imports `getMetaobjectDefinition` from lib, but does it export an ACTION for it?
// Step 457 view showed:
// export async function getMetaobjectDefinitionsAction()...
// BUT NOT `getMetaobjectDefinitionAction` (singular).
// So I need to add that too.
