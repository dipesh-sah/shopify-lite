import { getActiveCategories, getActiveSubcategories } from '@/lib/firestore'
import { NavbarClient } from './NavbarClient'

export async function Navbar() {
  const [categories, subcategories] = await Promise.all([
    getActiveCategories(),
    getActiveSubcategories()
  ])

  return <NavbarClient categories={categories} subcategories={subcategories} />
}
