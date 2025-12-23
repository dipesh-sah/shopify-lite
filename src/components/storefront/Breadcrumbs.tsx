import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { query } from '@/lib/db'

export async function Breadcrumbs({ categoryId, locale = 'en-GB' }: { categoryId: string, locale?: string }) {
  // Fetch path for this category
  const rows = await query(`
    SELECT c.id, c.path, ct.name, ct.slug
    FROM categories c
    JOIN category_translations ct ON c.id = ct.category_id AND ct.locale = ?
    WHERE c.id = ?
  `, [locale, categoryId])

  if (rows.length === 0) return null
  const current = rows[0]

  // Parse path and fetch parent names
  const parentIds = current.path ? current.path.split('/').filter(Boolean) : []

  let parents: any[] = []
  if (parentIds.length > 0) {
    const inPlaceholders = parentIds.map(() => '?').join(', ')
    parents = await query(`
      SELECT c.id, ct.name, ct.slug
      FROM categories c
      JOIN category_translations ct ON c.id = ct.category_id AND ct.locale = ?
      WHERE c.id IN (${inPlaceholders})
    `, [locale, ...parentIds])

    // Sort parents according to path order
    parents.sort((a, b) => parentIds.indexOf(a.id.toString()) - parentIds.indexOf(b.id.toString()))
  }

  const allItems = [
    ...parents,
    current
  ]

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground py-4">
      <Link href="/" className="hover:text-foreground transition-colors">
        <Home className="w-4 h-4" />
      </Link>

      {allItems.map((item, index) => (
        <div key={item.id} className="flex items-center space-x-2">
          <ChevronRight className="w-4 h-4" />
          <Link
            href={`/collections/${allItems.slice(0, index + 1).map(i => i.slug).join('/')}`}
            className={index === allItems.length - 1 ? "text-foreground font-medium" : "hover:text-foreground transition-colors"}
          >
            {item.name}
          </Link>
        </div>
      ))}
    </nav>
  )
}
