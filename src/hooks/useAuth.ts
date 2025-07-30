import { useState } from 'react'

export function useAuth() {
  const [user, setUser] = useState(null)

  return {
    user,
    login: () => setUser({ id: 1, name: 'Demo' }),
    logout: () => setUser(null),
  }
}