// src/context/AuthContext.tsx
"use client"

import { createContext, useContext, useState, useEffect, ReactNode, Dispatch, SetStateAction, useMemo, useCallback } from "react"

interface User {
  username: string
  credit: number
  role?: string
  agent_discount?: number
}

interface AuthContextType {
  user: User | null
  setUser: Dispatch<SetStateAction<User | null>>
  loading: boolean
  error: string | null
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
  endpoint: string
}

function BaseAuthProvider({ children, endpoint }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ✅ Fetch User
  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch(endpoint)

      if (res.ok) {
        const data = await res.json()
        if (data.user) {
          setUser({
            username: data.user.username,
            credit: Number(data.user.credit || 0),
            role: data.user.role,
            agent_discount: Number(data.user.agent_discount || 0)
          })
          return true
        }
      }

      setUser(null)
      return false
    } catch (err) {
      console.error("Failed to fetch user:", err)
      setError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้")
      setUser(null)
      return false
    }
  }, [endpoint])

  // ✅ Manual Refresh Function (for external use)
  const refreshAuth = useCallback(async () => {
    setLoading(true)
    await fetchUser()
    setLoading(false)
  }, [fetchUser])

  // ✅ Initial Load
  useEffect(() => {
    const init = async () => {
      setLoading(true)
      setError(null)
      await fetchUser()
      setLoading(false)
    }
    init()
  }, [fetchUser])

  const value = useMemo(() => ({
    user, setUser, loading, error, refreshAuth
  }), [user, loading, error, refreshAuth])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function ShopAuthProvider({ children }: { children: ReactNode }) {
  return (
    <BaseAuthProvider endpoint="/api/shop/auth/me">
      {children}
    </BaseAuthProvider>
  )
}

export function MasterAuthProvider({ children }: { children: ReactNode }) {
  return (
    <BaseAuthProvider endpoint="/api/master/auth/me">
      {children}
    </BaseAuthProvider>
  )
}


export const useAuth = () => {
  const context = useContext(AuthContext)
  // Return fallback values if used outside AuthProvider (e.g., in SSR or isolated components)
  if (context === undefined) {
    return { user: null, setUser: () => { }, loading: false, error: null, refreshAuth: async () => { } }
  }
  return context
}
