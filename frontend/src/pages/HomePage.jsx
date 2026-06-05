import React, { useEffect, useState } from 'react'
import { fetchGroups, createGroup, joinGroup } from '../api'
import Header from '../components/Header'
import Modal from '../components/Modal'

const GROUP_COLORS = [
  ['#7c3aed', '#a855f7'],
  ['#ec4899', '#f43f5e'],
  ['#f59e0b', '#f97316'],
  ['#10b981', '#06b6d4'],
  ['#3b82f6', '#6366f1'],
]

const groupColor = (name) => GROUP_COLORS[name.charCodeAt(0) % GROUP_COLORS.length]

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
      setShowCreate(false); setGroupName(''); load(); onEnterGroup(g.id)
    } catch (e) { setError(e.message) }
    setWorking(false)
  }

  const handleJoin = async () => {
    if (!joinCode.trim()) return
    setWorking(true); setError(null)
    try {
      const g = await joinGroup(joinCode.trim(), user.id)
      setShowJoin(false); setJoinCode(''); load(); onEnterGroup(g.group_id)
    } catch (e) { setError(e.message) }
    setWorking(false)
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <Header user={user} />

      <main style={{ maxWidth: 680, margin: '0 auto', padding: '32px 20px' }}>
        {/* Hero */}
        <div style={{ marginBottom: 36, animation: 'fadeUp 0.3s ease' }}>
          <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 6 }}>
            Hey {user.name}! 👋
          </div>
          <div style={{ fontSize: 16, color: '#6b7280' }}>
            Where are your friends betting today?
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
          <button onClick={() => { setShowJoin(true); setError(null) }} style={{
            flex: 1, padding: '14px 20px', borderRadius: 14, fontSize: 15, fontWeight: 600,
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#d1d5db', transition: 'all 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          >
            🔗 Join a group
          </button>
          <button onClick={() => { setShowCreate(true); setError(null) }} style={{
            flex: 1, padding: '14px 20px', borderRadius: 14, fontSize: 15, fontWeight: 700,
            background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
            color: '#fff', boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
          }}>
            ✨ New group
          </button>
        </div>

        {/* Groups */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2].map(i => (
              <div key={i} style={{ height: 90, borderRadius: 18, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }} />
            ))}
          </div>
        )}

        {!loading && groups.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', animation: 'fadeUp 0.3s ease' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎰</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No groups yet</div>
            <div style={{ fontSize: 14, color: '#6b7280' }}>Create one or join a friend's group</div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {groups.map((g, i) => {
            const [c1, c2] = groupColor(g.name)
            return (
              <div key={g.id} onClick={() => onEnterGroup(g.id)}
                style={{
                  background: '#111118', borderRadius: 18, padding: '18px 20px',
                  border: '1px solid rgba(255,255,255,0.07)',
                  cursor: 'pointer', transition: 'all 0.2s',
                  animation: `fadeUp 0.3s ease ${i * 0.05}s both`,
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = `${c1}44` }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 46, height: 46, borderRadius: 14, flexShrink: 0,
                    background: `linear-gradient(135deg, ${c1}, ${c2})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, boxShadow: `0 4px 14px ${c1}33`,
                  }}>
                    {g.name[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 3 }}>{g.name}</div>
                    <div style={{ fontSize: 13, color: '#6b7280' }}>
                      {g.member_count} member{g.member_count !== 1 ? 's' : ''} · {g.open_markets} open
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>balance</div>
                    <div style={{ fontWeight: 800, fontSize: 18, color: parseFloat(g.balance) >= 500 ? '#10b981' : '#f43f5e' }}>
                      ${parseFloat(g.balance).toFixed(0)}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {showCreate && (
        <Modal title="🎉 Create a group" onClose={() => setShowCreate(false)}>
          <input autoFocus placeholder="e.g. The Lads, Fantasy Bros..." value={groupName}
            onChange={e => setGroupName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreate()}
            style={inputStyle} />
          {error && <div style={errStyle}>{error}</div>}
          <button onClick={handleCreate} disabled={working || !groupName.trim()} style={submitBtn(working || !groupName.trim())}>
            {working ? 'Creating...' : 'Let\'s go 🚀'}
          </button>
        </Modal>
      )}

      {showJoin && (
        <Modal title="🔗 Join a group" onClose={() => setShowJoin(false)}>
          <input autoFocus placeholder="Paste invite code (e.g. ABC123)" value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase())} onKeyDown={e => e.key === 'Enter' && handleJoin()}
            style={{ ...inputStyle, textTransform: 'uppercase', letterSpacing: 3, fontSize: 18, fontWeight: 700, textAlign: 'center' }} />
          {error && <div style={errStyle}>{error}</div>}
          <button onClick={handleJoin} disabled={working || !joinCode.trim()} style={submitBtn(working || !joinCode.trim())}>
            {working ? 'Joining...' : 'Join group'}
          </button>
        </Modal>
      )}
    </div>
  )
}

const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 16px', color: '#f0f0f8', fontSize: 15, outline: 'none', marginBottom: 12 }
const errStyle = { color: '#f43f5e', fontSize: 13, marginBottom: 10 }
const submitBtn = (disabled) => ({ width: '100%', padding: '13px', borderRadius: 12, fontSize: 15, fontWeight: 700, background: disabled ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #7c3aed, #ec4899)', color: disabled ? '#4b5563' : '#fff', opacity: disabled ? 0.6 : 1, transition: 'all 0.15s', boxShadow: disabled ? 'none' : '0 4px 20px rgba(124,58,237,0.35)' })
