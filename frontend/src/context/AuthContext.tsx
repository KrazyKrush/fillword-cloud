import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '../types'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isAdmin: boolean
  login: (u: User, t: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const u = localStorage.getItem('user')
    const t = localStorage.getItem('accessToken')
    if (u && t) {
      try { setUser(JSON.parse(u)) } catch { localStorage.clear() }
    }
  }, [])

  const login = (u: User, t: string) => {
    localStorage.setItem('user', JSON.stringify(u))
    localStorage.setItem('accessToken', t)
    setUser(u)
  }

  const logout = () => {
    localStorage.clear()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{
      user, isAuthenticated: !!user, isAdmin: user?.role === 'admin', login, logout
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}