/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, type ReactNode } from 'react'
import { GoogleLogin } from '@react-oauth/google'

interface AuthContextType {
  user: string | null
  login: (credential: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<string | null>(null)

  const login = (credential: string) => setUser(credential)
  const logout = () => setUser(null)

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <GoogleLogin
          onSuccess={(cred) => login(cred.credential ?? '')}
          onError={() => console.log('Login Failed')}
        />
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
