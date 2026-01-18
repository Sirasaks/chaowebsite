// src/context/AuthContext.tsx
"use client"

import { createContext, useContext, useState, useEffect, ReactNode, Dispatch, SetStateAction, useMemo, useCallback, useRef } from "react"

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
  refreshEndpoint: string
}

// Token refresh interval (refresh before access token expires)
const TOKEN_REFRESH_INTERVAL = 14 * 60 * 1000 // 14 minutes (access token expires at 15m)

function BaseAuthProvider({ children, endpoint, refreshEndpoint }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isRefreshingRef = useRef(false)

  // ✅ Token Refresh Function
  const refreshToken = useCallback(async (): Promise<boolean> => {
    // Prevent concurrent refresh calls
    if (isRefreshingRef.current) return false
    isRefreshingRef.current = true

    try {
      const res = await fetch(refreshEndpoint, { method: "POST" })
      if (res.ok) {
        console.log("[Auth] Token refreshed successfully")
        return true
      } else {
        console.log("[Auth] Token refresh failed, logging out")
        setUser(null)
        return false
      }
    } catch (err) {
      console.error("[Auth] Token refresh error:", err)
      return false
    } finally {
      isRefreshingRef.current = false
    }
  }, [refreshEndpoint])

  // ✅ Fetch User with Auto-Retry on 401
  const fetchUser = useCallback(async (isRetry = false) => {
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
      } else if (res.status === 401 && !isRetry) {
        // Token expired, try to refresh
        console.log("[Auth] Access token expired, attempting refresh...")
        const refreshed = await refreshToken()
        if (refreshed) {
          // Retry fetching user after refresh
          return fetchUser(true)
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
  }, [endpoint, refreshToken])

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

  // ✅ Setup Auto-Refresh Interval
  useEffect(() => {
    if (user) {
      // Start auto-refresh interval when user is logged in
      refreshIntervalRef.current = setInterval(async () => {
        console.log("[Auth] Auto-refreshing token...")
        await refreshToken()
      }, TOKEN_REFRESH_INTERVAL)
    }

    return () => {
      // Cleanup interval on unmount or user logout
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
        refreshIntervalRef.current = null
      }
    }
  }, [user, refreshToken])

  const value = useMemo(() => ({
    user, setUser, loading, error, refreshAuth
  }), [user, loading, error, refreshAuth])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function ShopAuthProvider({ children }: { children: ReactNode }) {
  return (
    <BaseAuthProvider
      endpoint="/api/shop/auth/me"
      refreshEndpoint="/api/shop/auth/refresh"
    >
      {children}
    </BaseAuthProvider>
  )
}

export function MasterAuthProvider({ children }: { children: ReactNode }) {
  return (
    <BaseAuthProvider
      endpoint="/api/master/auth/me"
      refreshEndpoint="/api/master/auth/refresh"
    >
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

