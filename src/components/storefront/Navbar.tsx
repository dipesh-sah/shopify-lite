import { getActiveCollections } from '@/lib/collections'
import { getSessionAction } from '@/actions/customer-auth'
import { NavbarClient } from './NavbarClient'
import { AuthStatus } from './AuthStatus'

export const dynamic = 'force-dynamic'

export async function Navbar() {
  const [collections, user] = await Promise.all([
    getActiveCollections(),
    getSessionAction()
  ])

  const formattedCollections = collections.map(c => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
  }))

  return (
    <NavbarClient collections={formattedCollections}>
      <AuthStatus initialUser={user} />
    </NavbarClient>
  )
}
