import { getSegments } from "@/lib/segments"
import { Button } from "@/components/ui/button"

export default async function AdminSegmentsPage() {
  const segments = await getSegments()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Segments</h1>
        <Button>Create segment</Button>
      </div>

      <div className="rounded-md border bg-card p-6">
        {segments.length === 0 ? (
          <div className="text-center text-muted-foreground py-10">
            <p>No segments found.</p>
            <p className="text-sm mt-1">Save customer searches to create segments.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {segments.map((segment) => (
              <li key={segment.id} className="p-4 border rounded-md hover:bg-muted/50 transition-colors">
                <div className="font-medium">{segment.name}</div>
                <div className="text-xs text-muted-foreground truncate">{segment.queryString}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
