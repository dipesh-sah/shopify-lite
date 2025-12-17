import { getActiveCategories, getActiveSubcategories } from '@/lib/firestore'
import { NavbarClient } from './NavbarClient'
import { AuthStatus } from './AuthStatus'

export async function Navbar() {
  const [categories, subcategories] = await Promise.all([
    getActiveCategories(),
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
