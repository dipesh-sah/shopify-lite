"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { getMetaobjectsAction, deleteMetaobjectAction } from "@/actions/metadata" // We need delete action later, assumed exists or we add it
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, ArrowLeft, Trash2, Pencil } from "lucide-react"

export default function MetaobjectEntriesPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = use(params)
  const [entries, setEntries] = useState<any[]>([])

  useEffect(() => {
    getMetaobjectsAction(type).then(res => {
      if (res.success) setEntries(res.data || [])
    })
  }, [type])

  return (
    <div className="max-w-5xl mx-auto py-10 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/metaobjects">
            <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight capitalize">{type} Entries</h1>
            <p className="text-muted-foreground mt-2">
              Manage your {type} content.
            </p>
          </div>
        </div>
        <Link href={`/admin/metaobjects/${type}/new`}>
          <Button><Plus className="mr-2 h-4 w-4" /> Add Entry</Button>
        </Link>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Display Name</TableHead>
              <TableHead>Handle</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map(entry => (
              <TableRow key={entry.id}>
                <TableCell className="font-medium">{entry.display_name}</TableCell>
                <TableCell>{entry.handle}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/metaobjects/${type}/${entry.handle}`}>
                      <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
                    </Link>
                    {/* Add Delete Logic later */}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {entries.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  No entries found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
