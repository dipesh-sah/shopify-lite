"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getMetaobjectDefinitionsAction } from "@/actions/metadata"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, ArrowRight, Database } from "lucide-react"

export default function MetaobjectsPage() {
  const [definitions, setDefinitions] = useState<any[]>([])

  useEffect(() => {
    getMetaobjectDefinitionsAction().then(res => {
      if (res.success) setDefinitions(res.data || [])
    })
  }, [])

  return (
    <div className="max-w-5xl mx-auto py-10 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Metaobjects</h1>
          <p className="text-muted-foreground mt-2">
            Manage your custom data structures and content.
          </p>
        </div>
        <Link href="/admin/settings">
          <Button variant="outline">Manage Definitions</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {definitions.map(def => (
          <Link key={def.id} href={`/admin/metaobjects/${def.type}`}>
            <Card className="hover:bg-muted/50 transition cursor-pointer h-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-blue-600" />
                  {def.name}
                </CardTitle>
                <CardDescription>Type: {def.type}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-muted-foreground">
                  View Entries <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {definitions.length === 0 && (
          <div className="col-span-full text-center py-12 border rounded-lg bg-muted/10">
            <p className="text-muted-foreground">No metaobject definitions found.</p>
            <p className="text-sm text-muted-foreground mt-1">Go to Settings &gt; Metaobjects to define a new type.</p>
          </div>
        )}
      </div>
    </div>
  )
}
