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
    <div>
      <Header user={user} />

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
        {/* Section header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 6 }}>
          <div className="display" style={{ fontSize: 42, lineHeight: 1 }}>YOUR GROUPS</div>
          <div style={{ display: 'flex', gap: 8, paddingBottom: 4 }}>
            <button onClick={() => { setShowJoin(true); setError(null) }} style={ghostBtn}>
              Join group
            </button>
            <button onClick={() => { setShowCreate(true); setError(null) }} style={solidBtn}>
              New group
            </button>
          </div>
        </div>
        <div style={{ borderTop: '3px solid #f5f5f5', marginBottom: 24 }} />

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[1, 2].map(i => <div key={i} style={{ height: 72, background: '#161616', borderBottom: '1px solid #2a2a2a' }} />)}
          </div>
        )}

        {!loading && groups.length === 0 && (
          <div style={{ borderTop: '1px solid #2a2a2a', padding: '48px 0', textAlign: 'center' }}>
            <div className="display" style={{ fontSize: 28, color: '#444', marginBottom: 8 }}>NO GROUPS YET</div>
            <div style={{ fontSize: 14, color: '#666' }}>Create one or ask a friend for their invite code</div>
          </div>
        )}

        {/* Groups list */}
        <div style={{ borderTop: '1px solid #2a2a2a' }}>
          {groups.map((g, i) => {
            const bal = parseFloat(g.balance)
            const diff = bal - 500
            return (
              <div key={g.id} onClick={() => onEnterGroup(g.id)} style={{
                display: 'flex', alignItems: 'center', gap: 20,
                padding: '16px 0', borderBottom: '1px solid #2a2a2a',
                cursor: 'pointer', transition: 'background 0.1s',
                animation: `fadeUp 0.25s ease ${i * 0.04}s both`,
              }}
                onMouseEnter={e => e.currentTarget.style.paddingLeft = '8px'}
                onMouseLeave={e => e.currentTarget.style.paddingLeft = '0'}
              >
                <div style={{ width: 4, height: 40, background: '#e63946', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="display" style={{ fontSize: 24, lineHeight: 1.1 }}>{g.name.toUpperCase()}</div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {g.member_count} member{g.member_count !== 1 ? 's' : ''} &nbsp;/&nbsp; {g.open_markets} open
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="display" style={{ fontSize: 28 }}>${bal.toFixed(0)}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: diff >= 0 ? '#4caf50' : '#e63946' }}>
                    {diff >= 0 ? '+' : ''}{diff.toFixed(0)}
                  </div>
                </div>
                <div style={{ color: '#555', fontSize: 20, paddingLeft: 8 }}>›</div>
              </div>
            )
          })}
        </div>
      </main>

      {showCreate && (
        <Modal title="New group" onClose={() => setShowCreate(false)}>
          <input autoFocus placeholder="Group name" value={groupName}
            onChange={e => setGroupName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreate()}
            style={inputStyle} />
          {error && <div style={{ color: '#e63946', fontSize: 13, fontWeight: 700 }}>{error}</div>}
          <button onClick={handleCreate} disabled={working || !groupName.trim()} style={solidBtn}>
            {working ? 'Creating...' : 'Create'}
          </button>
        </Modal>
      )}

      {showJoin && (
        <Modal title="Join a group" onClose={() => setShowJoin(false)}>
          <input autoFocus placeholder="Invite code" value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase())} onKeyDown={e => e.key === 'Enter' && handleJoin()}
            style={{ ...inputStyle, textTransform: 'uppercase', letterSpacing: 4, fontSize: 20, fontWeight: 800, textAlign: 'center' }} />
          {error && <div style={{ color: '#e63946', fontSize: 13, fontWeight: 700 }}>{error}</div>}
          <button onClick={handleJoin} disabled={working || !joinCode.trim()} style={solidBtn}>
            {working ? 'Joining...' : 'Join'}
          </button>
        </Modal>
      )}
    </div>
  )
}

const solidBtn = { background: '#f5f5f5', color: '#0c0c0c', padding: '9px 18px', fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }
const ghostBtn = { background: 'none', border: '2px solid #f5f5f5', color: '#f5f5f5', padding: '7px 16px', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }
const inputStyle = { width: '100%', background: '#161616', border: '2px solid #2a2a2a', padding: '11px 14px', color: '#f5f5f5', fontSize: 15, outline: 'none' }
