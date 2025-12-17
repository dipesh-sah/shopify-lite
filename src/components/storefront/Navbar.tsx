import { getActiveCollections, getAllSubcategories as getActiveSubcategories } from '@/lib/collections'
import { NavbarClient } from './NavbarClient'
import { AuthStatus } from './AuthStatus'

export async function Navbar() {
  const [categories, subcategories] = await Promise.all([
    getActiveCollections(),
    getActiveSubcategories()
  ])

  return (
    <NavbarClient categories={categories} subcategories={subcategories}>
      <div className="ml-auto flex items-center space-x-4">
        <AuthStatus />
      </div>
    </NavbarClient>
  )
}
