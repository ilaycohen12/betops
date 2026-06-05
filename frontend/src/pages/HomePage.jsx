import React, { useEffect, useState } from 'react'
import { fetchGroups, createGroup, joinGroup } from '../api'
import Header from '../components/Header'
import Modal from '../components/Modal'

export default function HomePage({ user, onEnterGroup }) {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [working, setWorking] = useState(false)
  const [error, setError] = useState(null)

  const load = () => fetchGroups(user.id).then(setGroups).catch(() => {}).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    if (!groupName.trim()) return
    setWorking(true); setError(null)
    try {
      const g = await createGroup(groupName.trim(), user.id)
      setShowCreate(false); setGroupName(''); load()
      onEnterGroup(g.id)
    } catch (e) { setError(e.message) }
    setWorking(false)
  }

  const handleJoin = async () => {
    if (!joinCode.trim()) return
    setWorking(true); setError(null)
    try {
      const g = await joinGroup(joinCode.trim(), user.id)
      setShowJoin(false); setJoinCode(''); load()
      onEnterGroup(g.group_id)
    } catch (e) { setError(e.message) }
    setWorking(false)
  }

  return (
    <div>
      <Header user={user} />
      <main style={{ maxWidth: 680, margin: '40px auto', padding: '0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>Your Groups</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { setShowJoin(true); setError(null) }} style={outlineBtn}>Join group</button>
            <button onClick={() => { setShowCreate(true); setError(null) }} style={primaryBtn}>+ New group</button>
          </div>
        </div>

        {loading && <Skeleton />}

        {!loading && groups.length === 0 && (
          <div style={{ textAlign: 'center', color: '#6b7280', marginTop: 80 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎲</div>
            <div style={{ fontSize: 16, marginBottom: 8 }}>No groups yet</div>
            <div style={{ fontSize: 14 }}>Create one or ask a friend for their invite code</div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {groups.map(g => (
            <div key={g.id} onClick={() => onEnterGroup(g.id)} style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{g.name}</div>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>
                    {g.member_count} member{g.member_count !== 1 ? 's' : ''} · {g.open_markets} open market{g.open_markets !== 1 ? 's' : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, color: '#9ca3af' }}>Your balance</div>
                  <div style={{ fontWeight: 700, fontSize: 18, color: '#f0f0f0' }}>${parseFloat(g.balance).toFixed(2)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {showCreate && (
        <Modal title="Create a group" onClose={() => setShowCreate(false)}>
          <input placeholder="Group name" value={groupName} onChange={e => setGroupName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()} style={input} autoFocus />
          {error && <div style={errStyle}>{error}</div>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setShowCreate(false)} style={outlineBtn}>Cancel</button>
            <button onClick={handleCreate} disabled={working || !groupName.trim()} style={{ ...primaryBtn, flex: 1, opacity: working ? 0.6 : 1 }}>
              {working ? 'Creating...' : 'Create'}
            </button>
          </div>
        </Modal>
      )}

      {showJoin && (
        <Modal title="Join a group" onClose={() => setShowJoin(false)}>
          <input placeholder="Invite code (e.g. ABC123)" value={joinCode} onChange={e => setJoinCode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleJoin()} style={input} autoFocus />
          {error && <div style={errStyle}>{error}</div>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setShowJoin(false)} style={outlineBtn}>Cancel</button>
            <button onClick={handleJoin} disabled={working || !joinCode.trim()} style={{ ...primaryBtn, flex: 1, opacity: working ? 0.6 : 1 }}>
              {working ? 'Joining...' : 'Join'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

const card = {
  background: '#13161b', border: '1px solid #1e2128', borderRadius: 14,
  padding: '18px 20px', cursor: 'pointer', transition: 'border-color 0.2s',
  onMouseEnter: e => e.currentTarget.style.borderColor = '#6366f144',
}
const primaryBtn = { background: '#6366f1', color: '#fff', padding: '8px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600 }
const outlineBtn = { background: '#1a1d23', border: '1px solid #2a2d35', color: '#9ca3af', padding: '8px 16px', borderRadius: 8, fontSize: 14 }
const input = { width: '100%', background: '#0d0f12', border: '1px solid #2a2d35', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 15, marginBottom: 12, outline: 'none' }
const errStyle = { color: '#f87171', fontSize: 13, marginBottom: 10 }
const Skeleton = () => <div style={{ background: '#13161b', border: '1px solid #1e2128', borderRadius: 14, padding: 20, height: 80 }} />
