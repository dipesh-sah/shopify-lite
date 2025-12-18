"use client"

import { useState, useEffect } from "react"
import { getSegmentsAction, createSegmentAction, updateSegmentAction, deleteSegmentAction, evaluateSegmentAction } from "@/actions/segments"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { showToast } from "@/components/ui/Toast"
import { SegmentBuilder } from "./SegmentBuilder"
import { Trash2, Edit2, Plus, Users, ArrowLeft, MoreHorizontal, Eye } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function SegmentManager() {
  const [segments, setSegments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<any>(null)

  // View Mode State
  const [viewingSegment, setViewingSegment] = useState<any>(null)
  const [segmentCustomers, setSegmentCustomers] = useState<any[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(false)

  const [isOpen, setIsOpen] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', query: null as any })

  useEffect(() => {
    loadSegments()
  }, [])

  async function loadSegments() {
    setLoading(true)
    try {
      const data = await getSegmentsAction()
      setSegments(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleViewSegment(seg: any) {
    setViewingSegment(seg)
    setLoadingCustomers(true)
    try {
      const customers = await evaluateSegmentAction(seg.id)
      setSegmentCustomers(customers)
    } catch (e) {
      showToast("Failed to load segment customers", "error")
    } finally {
      setLoadingCustomers(false)
    }
  }

  function handleAddNew() {
    setEditing(null)
    setForm({
      name: '',
      description: '',
      query: {
        type: 'container',
        operator: 'AND',
        children: [{ type: 'condition', field: 'total_spent', operator: 'gt', value: 0 }]
      }
    })
    setIsOpen(true)
  }

  function handleEdit(seg: any) {
    setEditing(seg)
    let parsedQuery = null
    try {
      parsedQuery = JSON.parse(seg.query)
    } catch (e) { }

    setForm({ name: seg.name, description: seg.description || '', query: parsedQuery })
    setIsOpen(true)
  }

  async function handleSave() {
    if (!form.name || !form.query) {
      showToast("Name and Rules are required", "error")
      return
    }

    try {
      const payload = {
        name: form.name,
        description: form.description,
        query: JSON.stringify(form.query)
      }

      let result;
      if (editing) {
        result = await updateSegmentAction(editing.id, payload)
      } else {
        result = await createSegmentAction(payload)
      }

      if (result?.error) {
        showToast(result.error, "error")
        return
      }

      showToast(editing ? "Segment updated" : "Segment created", "success")
      setIsOpen(false)
      loadSegments()
    } catch (e) {
      console.error(e)
      showToast("Failed to save segment", "error")
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this segment?")) return
    await deleteSegmentAction(id)
    loadSegments()
    showToast("Segment deleted", "success")
  }

  if (loading) return <div>Loading segments...</div>

  // RENDER VIEWING MODE (List of Customers)
  if (viewingSegment) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => setViewingSegment(null)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              {viewingSegment.name}
              <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full border">
                {segmentCustomers.length} customers
              </span>
            </h2>
            <p className="text-sm text-muted-foreground">{viewingSegment.description}</p>
          </div>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleEdit(viewingSegment)}>
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Rules
            </Button>
          </div>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Spent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingCustomers ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    Loading matching customers...
                  </TableCell>
                </TableRow>
              ) : segmentCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="h-8 w-8 opacity-20" />
                      <p>No customers match this segment criteria.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                segmentCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {(customer.first_name?.[0] || customer.email?.[0] || '?').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {customer.first_name} {customer.last_name}
                          </span>
                          <span className="text-xs text-muted-foreground">{customer.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {customer.billing_city ? `${customer.billing_city}, ${customer.billing_country}` : '-'}
                    </TableCell>
                    <TableCell>{customer.orders_count || 0}</TableCell>
                    <TableCell>${Number(customer.total_spent || 0).toFixed(2)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  // RENDER LIST MODE
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-muted/20 p-4 rounded-lg border">
        <div>
          <h3 className="font-semibold">Your Segments</h3>
          <p className="text-sm text-muted-foreground">Dynamic groups of customers based on rules.</p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="h-4 w-4 mr-2" />
          Create Segment
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {segments.map(seg => (
          <div
            key={seg.id}
            className="border rounded-lg p-4 bg-card shadow-sm space-y-3 hover:border-primary transition-colors cursor-pointer group relative"
            onClick={() => handleViewSegment(seg)}
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold flex items-center gap-2 group-hover:text-primary">
                  <Users className="h-4 w-4" />
                  {seg.name}
                </h4>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{seg.description || "No description"}</p>
              </div>
            </div>

            <div className="pt-2 border-t flex justify-end gap-2" onClick={e => e.stopPropagation()}>
              <Button variant="ghost" size="sm" onClick={() => handleEdit(seg)}>
                <Edit2 className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(seg.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Segment' : 'Create Segment'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Segment Name</label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. VIP Customers" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description..." />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Filter Rules</label>
              <SegmentBuilder value={form.query} onChange={val => setForm({ ...form, query: val })} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Segment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
