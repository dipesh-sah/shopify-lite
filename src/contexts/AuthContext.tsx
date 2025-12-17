'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { getSessionAction, logoutAction } from "@/actions/customer-auth"

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => { },
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function initAuth() {
      try {
        const sessionUser = await getSessionAction()
        setUser(sessionUser)
      } catch (error) {
        console.error("Failed to fetch session:", error)
      } finally {
        setLoading(false)
      }
    }
    initAuth()
  }, [])

  const signOut = async () => {
    await logoutAction()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
