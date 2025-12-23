import { getCategoryTree } from '@/lib/categories'
import { NavbarClient } from './NavbarClient'
import { AuthStatus } from './AuthStatus'

export const dynamic = 'force-dynamic'

export async function Navbar() {
  const categories = await getCategoryTree('en-GB')

  // Recursive function to filter categories and their children
  const filterCategories = (cats: any[]): any[] => {
    return cats
      .filter(c => !c.hideFromNav && (c.isActive || c.status?.toLowerCase() === 'active'))
      .map(c => {
        const trans = c.translations['en-GB'] || Object.values(c.translations)[0]
        return {
          ...c,
          name: trans?.name || c.name || '',
          slug: trans?.slug || c.slug || '',
          children: c.children ? filterCategories(c.children) : []
        }
      })
  }

  const visibleCategories = filterCategories(categories)

  return (
    <NavbarClient categories={visibleCategories}>
      <AuthStatus />
    </NavbarClient>
  )
}
