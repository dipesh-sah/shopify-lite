'use client'

import { createContext, useContext, useEffect, useState } from 'react'

// Mock User Type
interface User {
  uid: string
  email: string | null
  displayName: string | null
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => { },
  signUp: async () => { },
  signOut: async () => { },
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check local storage for mock session
    const stored = typeof window !== 'undefined' ? localStorage.getItem('mock_user') : null
    if (stored) {
      setUser(JSON.parse(stored))
    }
    setLoading(false)
  }, [])

  const signIn = async (email: string, password: string) => {
    // Mock Sign In
    const mockUser = {
      uid: 'mock-user-123',
      email: email,
      displayName: email.split('@')[0]
    }
    setUser(mockUser)
    localStorage.setItem('mock_user', JSON.stringify(mockUser))
  }

  const signUp = async (email: string, password: string) => {
    await signIn(email, password)
  }

  const signOut = async () => {
    setUser(null)
    localStorage.removeItem('mock_user')
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
