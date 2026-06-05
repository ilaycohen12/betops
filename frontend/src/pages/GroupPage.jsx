import React, { useEffect, useState, useCallback } from 'react'
import { fetchGroup, createMarket, resolveMarket, placeBet } from '../api'
import Header from '../components/Header'
import MarketCard from '../components/MarketCard'
import BetModal from '../components/BetModal'
import Modal from '../components/Modal'
import Toast from '../components/Toast'

export default function GroupPage({ user, groupId, onBack }) {
  const [group, setGroup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeBet, setActiveBet] = useState(null)
  const [showCreateMarket, setShowCreateMarket] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [toast, setToast] = useState(null)
  const [copied, setCopied] = useState(false)
  const [newMarket, setNewMarket] = useState({ question: '', closes_at: '' })
  const [working, setWorking] = useState(false)
  const [tab, setTab] = useState('markets')

  const load = useCallback(() => {
    setLoading(true)
    fetchGroup(groupId, user.id).then(setGroup).finally(() => setLoading(false))
  }, [groupId, user.id])

  useEffect(() => { load() }, [load])

  const myBalance = group?.members?.find(m => m.id === user.id)?.balance ?? 0

  const handleCreateMarket = async () => {
    if (!newMarket.question.trim()) return
    setWorking(true)
    try {
      await createMarket(groupId, { ...newMarket, user_id: user.id })
      setShowCreateMarket(false)
      setNewMarket({ question: '', closes_at: '' })
      load()
      setToast('Market created!')
    } catch (e) { setToast(e.message) }
    setWorking(false)
  }

  const handleResolve = async (market_id, result) => {
    try {
      await resolveMarket(market_id, result, user.id)
      setToast(`Market resolved: ${result.toUpperCase()}`)
      load()
    } catch (e) { setToast(e.message) }
  }

  const handleBetDone = (msg) => {
    setActiveBet(null)
    setToast(msg)
    load()
  }

  const copyInvite = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <div style={{ color: '#6b7280', textAlign: 'center', marginTop: 100 }}>Loading...</div>
  if (!group) return <div style={{ color: '#f87171', textAlign: 'center', marginTop: 100 }}>Group not found</div>

  const inviteUrl = `${window.location.origin}/join/${group.invite_code}`
  const openMarkets = group.markets.filter(m => m.status === 'open')
  const closedMarkets = group.markets.filter(m => m.status !== 'open')

  return (
    <div>
      <Header user={user} balance={myBalance} onBack={onBack} />
      <main style={{ maxWidth: 780, margin: '32px auto', padding: '0 20px' }}>

        {/* Group header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{group.name}</div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>{group.members.length} members</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setShowInvite(true)} style={outlineBtn}>Invite</button>
            <button onClick={() => setShowCreateMarket(true)} style={primaryBtn}>+ Market</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #1e2128', paddingBottom: 0 }}>
          {['markets', 'leaderboard'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '8px 16px', fontSize: 14, fontWeight: 500, borderRadius: '8px 8px 0 0',
              background: tab === t ? '#13161b' : 'transparent',
              color: tab === t ? '#f0f0f0' : '#6b7280',
              borderBottom: tab === t ? '2px solid #6366f1' : '2px solid transparent',
            }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {tab === 'markets' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {group.markets.length === 0 && (
              <div style={{ textAlign: 'center', color: '#6b7280', marginTop: 60 }}>
                No markets yet. Create the first one!
              </div>
            )}
            {openMarkets.map(m => (
              <MarketCard key={m.id} market={m} onBet={(market, side) => setActiveBet({ market, side })}
                onResolve={handleResolve} showResolve={true} />
            ))}
            {closedMarkets.length > 0 && (
              <>
                <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, color: '#4b5563', marginTop: 12 }}>Settled</div>
                {closedMarkets.map(m => (
                  <MarketCard key={m.id} market={m} onBet={() => {}} onResolve={handleResolve}
                    showResolve={m.status === 'closed'} />
                ))}
              </>
            )}
          </div>
        )}

        {tab === 'leaderboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {group.members.map((m, i) => (
              <div key={m.id} style={{
                background: '#13161b', border: `1px solid ${m.id === user.id ? '#6366f144' : '#1e2128'}`,
                borderRadius: 12, padding: '14px 18px',
                display: 'flex', alignItems: 'center', gap: 14,
              }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: i === 0 ? '#fbbf24' : i === 1 ? '#9ca3af' : i === 2 ? '#b45309' : '#4b5563', width: 28 }}>
                  #{i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{m.name} {m.id === user.id && <span style={{ fontSize: 12, color: '#6366f1' }}>(you)</span>}</div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 17, color: parseFloat(m.balance) >= 500 ? '#4ade80' : '#f87171' }}>
                  ${parseFloat(m.balance).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {activeBet && (
        <BetModal market={activeBet.market} side={activeBet.side} groupId={groupId} user={user}
          onClose={() => setActiveBet(null)} onDone={handleBetDone} />
      )}

      {showInvite && (
        <Modal title="Invite to group" onClose={() => setShowInvite(false)}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 6 }}>Invite code</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ background: '#0d0f12', border: '1px solid #2a2d35', borderRadius: 8, padding: '10px 14px', fontSize: 18, fontWeight: 700, letterSpacing: 4, flex: 1, textAlign: 'center' }}>
                {group.invite_code}
              </div>
              <button onClick={() => copyInvite(group.invite_code)} style={outlineBtn}>
                {copied ? '✓' : 'Copy'}
              </button>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 6 }}>Invite link</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ background: '#0d0f12', border: '1px solid #2a2d35', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#9ca3af', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {inviteUrl}
              </div>
              <button onClick={() => copyInvite(inviteUrl)} style={outlineBtn}>Copy</button>
            </div>
          </div>
        </Modal>
      )}

      {showCreateMarket && (
        <Modal title="New market" onClose={() => setShowCreateMarket(false)}>
          <input placeholder="Question (e.g. Will X happen?)" value={newMarket.question}
            onChange={e => setNewMarket(p => ({ ...p, question: e.target.value }))}
            style={inputStyle} autoFocus />
          <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 6 }}>Closes at (optional)</div>
          <input type="datetime-local" value={newMarket.closes_at}
            onChange={e => setNewMarket(p => ({ ...p, closes_at: e.target.value }))}
            style={{ ...inputStyle, colorScheme: 'dark' }} />
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setShowCreateMarket(false)} style={outlineBtn}>Cancel</button>
            <button onClick={handleCreateMarket} disabled={working || !newMarket.question.trim()}
              style={{ ...primaryBtn, flex: 1, opacity: working ? 0.6 : 1 }}>
              {working ? 'Creating...' : 'Create market'}
            </button>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  )
}

const primaryBtn = { background: '#6366f1', color: '#fff', padding: '8px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600 }
const outlineBtn = { background: '#1a1d23', border: '1px solid #2a2d35', color: '#9ca3af', padding: '8px 16px', borderRadius: 8, fontSize: 14 }
const inputStyle = { width: '100%', background: '#0d0f12', border: '1px solid #2a2d35', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 15, marginBottom: 12, outline: 'none' }
