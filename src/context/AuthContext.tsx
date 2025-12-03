// src/context/AuthContext.tsx
"use client"

import { createContext, useContext, useState, useEffect, ReactNode, Dispatch, SetStateAction, useMemo } from "react"

interface User {
  username: string
  credit: number
  role?: string
}

interface AuthContextType {
  user: User | null
  setUser: Dispatch<SetStateAction<User | null>>
  loading: boolean
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch("/api/shop/auth/me")
        if (res.ok) {
          const data = await res.json()
          if (data.user) {
            setUser({ username: data.user.username, credit: Number(data.user.credit || 0), role: data.user.role })
          }
        } else {
          // กรณี API ตอบกลับมาว่าไม่สำเร็จ (เช่น 401 Unauthorized)
          setUser(null)
        }
      } catch (err) {
        console.error("Failed to fetch user:", err)
        setError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้")
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [])

  // ใช้ useMemo เพื่อป้องกันการสร้าง object value ใหม่ทุกครั้งที่ re-render
  const value = useMemo(() => ({
    user, setUser, loading, error
  }), [user, loading, error])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
