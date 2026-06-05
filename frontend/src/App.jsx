import React, { useState } from 'react'
import HomePage from './pages/HomePage'
import GroupPage from './pages/GroupPage'
import JoinPage from './pages/JoinPage'
import { TEST_USER } from './api'

export default function App() {
  const path = window.location.pathname
  const [page, setPage] = useState(
    path.startsWith('/join/') ? { name: 'join', code: path.split('/join/')[1] }
    : path.startsWith('/group/') ? { name: 'group', id: path.split('/group/')[1] }
    : { name: 'home' }
  )

  const navigate = (p) => {
    setPage(p)
    window.history.pushState({}, '', p.name === 'home' ? '/' : p.name === 'group' ? `/group/${p.id}` : '/')
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0d0f12; color: #f0f0f0; min-height: 100vh; }
        button { cursor: pointer; border: none; font-family: inherit; }
        input { font-family: inherit; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }
      `}</style>

      {page.name === 'home' && <HomePage user={TEST_USER} onEnterGroup={(id) => navigate({ name: 'group', id })} />}
      {page.name === 'group' && <GroupPage user={TEST_USER} groupId={page.id} onBack={() => navigate({ name: 'home' })} />}
      {page.name === 'join' && <JoinPage user={TEST_USER} code={page.code} onDone={(id) => navigate({ name: 'group', id })} />}
    </>
  )
}
