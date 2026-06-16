import React, { useEffect, useState } from 'react'
import { getStoredUser, clearAuth } from './api'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import HomePage from './pages/HomePage'
import GroupPage from './pages/GroupPage'
import JoinPage from './pages/JoinPage'

export default function App() {
  const [user, setUser] = useState(null)
  const [authPage, setAuthPage] = useState('login')
  const [page, setPage] = useState(null)

  useEffect(() => {
    const stored = getStoredUser()
    if (stored) setUser(stored)

    const path = window.location.pathname
    if (path.startsWith('/join/')) setPage({ name: 'join', code: path.split('/join/')[1] })
    else if (path.startsWith('/group/')) setPage({ name: 'group', id: path.split('/group/')[1] })
    else setPage({ name: 'home' })
  }, [])

  const navigate = (p) => {
    setPage(p)
    window.history.pushState({}, '', p.name === 'group' ? `/group/${p.id}` : '/')
  }

  const handleLogin = (u) => setUser({ ...u, name: u.name || `${u.first_name} ${u.last_name}` })

  const handleLogout = () => {
    clearAuth()
    setUser(null)
    setAuthPage('login')
    navigate({ name: 'home' })
  }

  if (!user) {
    return (
      <>
        <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0d0f12; color: #f0f0f0; min-height: 100vh; } button { cursor: pointer; border: none; font-family: inherit; } input { font-family: inherit; }`}</style>
        {authPage === 'login'
          ? <LoginPage onLogin={handleLogin} onGoSignup={() => setAuthPage('signup')} />
          : <SignupPage onLogin={handleLogin} onGoLogin={() => setAuthPage('login')} />}
      </>
    )
  }

  if (!page) return null

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0d0f12; color: #f0f0f0; min-height: 100vh; }
        button { cursor: pointer; border: none; font-family: inherit; }
        input { font-family: inherit; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }
      `}</style>

      {page.name === 'home' && <HomePage user={user} onEnterGroup={(id) => navigate({ name: 'group', id })} onLogout={handleLogout} />}
      {page.name === 'group' && <GroupPage user={user} groupId={page.id} onBack={() => navigate({ name: 'home' })} onLogout={handleLogout} />}
      {page.name === 'join' && <JoinPage user={user} code={page.code} onDone={(id) => navigate({ name: 'group', id })} />}
    </>
  )
}
