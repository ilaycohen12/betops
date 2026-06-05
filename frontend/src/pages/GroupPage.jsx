import React, { useEffect, useState, useCallback } from 'react'
import { fetchGroup, createMarket, resolveMarket } from '../api'
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
  const [copied, setCopied] = useState(null)
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
      setShowCreateMarket(false); setNewMarket({ question: '', closes_at: '' }); load()
      setToast('Market created')
    } catch (e) { setToast(e.message) }
    setWorking(false)
  }

  const handleResolve = async (market_id, result) => {
    try {
      await resolveMarket(market_id, result, user.id)
      setToast(`Market resolved — ${result.toUpperCase()} won`)
      load()
    } catch (e) { setToast(e.message) }
  }

  const copy = (text, key) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  if (loading && !group) return (
    <div><Header user={user} onBack={onBack} />
      <div style={{ textAlign: 'center', padding: 60, color: '#555', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>Loading...</div>
    </div>
  )
  if (!group) return null

  const openMarkets = group.markets.filter(m => m.status === 'open')
  const otherMarkets = group.markets.filter(m => m.status !== 'open')
  const inviteUrl = `${window.location.origin}/join/${group.invite_code}`

  return (
    <div>
      <Header user={user} balance={myBalance} onBack={onBack} />

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>

        {/* Group name + actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 6 }}>
          <div>
            <div className="display" style={{ fontSize: 48, lineHeight: 1 }}>{group.name.toUpperCase()}</div>
            <div style={{ fontSize: 12, color: '#666', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>
              {group.members.length} members &nbsp;/&nbsp; {openMarkets.length} open markets
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, paddingBottom: 8 }}>
            <button onClick={() => setShowInvite(true)} style={ghostBtn}>Invite</button>
            <button onClick={() => setShowCreateMarket(true)} style={solidBtn}>+ Market</button>
          </div>
        </div>
        <div style={{ borderTop: '3px solid #f5f5f5', marginBottom: 0 }} />

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #2a2a2a', marginBottom: 24 }}>
          {['markets', 'leaderboard'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '14px 20px', fontSize: 12, fontWeight: 800,
              textTransform: 'uppercase', letterSpacing: 1,
              background: 'none', color: tab === t ? '#f5f5f5' : '#555',
              borderBottom: `3px solid ${tab === t ? '#e63946' : 'transparent'}`,
              marginBottom: -1, transition: 'all 0.15s',
            }}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'markets' && (
          <div style={{ animation: 'fadeUp 0.25s ease' }}>
            {group.markets.length === 0 && (
              <div style={{ padding: '48px 0', textAlign: 'center' }}>
                <div className="display" style={{ fontSize: 28, color: '#333', marginBottom: 8 }}>NO MARKETS YET</div>
                <div style={{ fontSize: 14, color: '#555' }}>Create the first one and get the group going</div>
              </div>
            )}
            {openMarkets.map(m => (
              <MarketCard key={m.id} market={m} onBet={(market, side) => setActiveBet({ market, side })} onResolve={handleResolve} showResolve />
            ))}
            {otherMarkets.length > 0 && (
              <>
                <div style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 700, padding: '20px 0 8px' }}>Past markets</div>
                {otherMarkets.map(m => (
                  <MarketCard key={m.id} market={m} onBet={() => {}} onResolve={handleResolve} showResolve={m.status === 'closed'} />
                ))}
              </>
            )}
          </div>
        )}

        {tab === 'leaderboard' && (
          <div style={{ animation: 'fadeUp 0.25s ease' }}>
            {/* Column headers */}
            <div style={{ display: 'flex', padding: '8px 0', borderBottom: '1px solid #2a2a2a', fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
              <div style={{ width: 32 }}>#</div>
              <div style={{ flex: 1 }}>Player</div>
              <div style={{ width: 80, textAlign: 'right' }}>Balance</div>
              <div style={{ width: 60, textAlign: 'right' }}>P&L</div>
            </div>

            {group.members.map((m, i) => {
              const isMe = m.id === user.id
              const bal = parseFloat(m.balance)
              const diff = bal - 500
              return (
                <div key={m.id} style={{
                  display: 'flex', alignItems: 'center',
                  padding: '14px 0', borderBottom: '1px solid #2a2a2a',
                  background: isMe ? 'rgba(230,57,70,0.05)' : 'none',
                  animation: `fadeUp 0.25s ease ${i * 0.04}s both`,
                }}>
                  <div style={{ width: 32, fontSize: 13, color: '#555', fontWeight: 700 }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 800, fontSize: 15 }}>{m.name}</span>
                    {isMe && <span style={{ fontSize: 11, color: '#e63946', fontWeight: 700, marginLeft: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>you</span>}
                  </div>
                  <div className="display" style={{ width: 80, textAlign: 'right', fontSize: 22 }}>${bal.toFixed(0)}</div>
                  <div style={{ width: 60, textAlign: 'right', fontSize: 13, fontWeight: 700, color: diff >= 0 ? '#4caf50' : '#e63946' }}>
                    {diff >= 0 ? '+' : ''}{diff.toFixed(0)}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {activeBet && (
        <BetModal market={activeBet.market} side={activeBet.side} groupId={groupId} user={user}
          onClose={() => setActiveBet(null)}
          onDone={(msg) => { setActiveBet(null); setToast(msg); load() }} />
      )}

      {showInvite && (
        <Modal title="Invite friends" onClose={() => setShowInvite(false)}>
          <div>
            <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Invite code</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div className="display" style={{ flex: 1, background: '#161616', border: '2px solid #2a2a2a', padding: '12px 16px', fontSize: 32, letterSpacing: 8, textAlign: 'center', color: '#e63946' }}>
                {group.invite_code}
              </div>
              <button onClick={() => copy(group.invite_code, 'code')} style={{ padding: '12px 16px', background: copied === 'code' ? '#4caf50' : '#f5f5f5', color: '#0c0c0c', fontSize: 13, fontWeight: 800, textTransform: 'uppercase' }}>
                {copied === 'code' ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Or share link</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, background: '#161616', border: '2px solid #2a2a2a', padding: '10px 12px', fontSize: 12, color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {inviteUrl}
              </div>
              <button onClick={() => copy(inviteUrl, 'url')} style={{ padding: '10px 14px', background: copied === 'url' ? '#4caf50' : '#f5f5f5', color: '#0c0c0c', fontSize: 12, fontWeight: 800, textTransform: 'uppercase' }}>
                {copied === 'url' ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showCreateMarket && (
        <Modal title="New market" onClose={() => setShowCreateMarket(false)}>
          <textarea placeholder="What are you betting on?" value={newMarket.question}
            onChange={e => setNewMarket(p => ({ ...p, question: e.target.value }))}
            rows={3} autoFocus
            style={{ width: '100%', background: '#161616', border: '2px solid #2a2a2a', padding: '11px 14px', color: '#f5f5f5', fontSize: 15, outline: 'none', resize: 'none' }} />
          <div>
            <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Close date (optional)</div>
            <input type="datetime-local" value={newMarket.closes_at}
              onChange={e => setNewMarket(p => ({ ...p, closes_at: e.target.value }))}
              style={{ width: '100%', background: '#161616', border: '2px solid #2a2a2a', padding: '10px 14px', color: '#f5f5f5', fontSize: 14, outline: 'none', colorScheme: 'dark' }} />
          </div>
          <button onClick={handleCreateMarket} disabled={working || !newMarket.question.trim()}
            style={{ ...solidBtn, opacity: working || !newMarket.question.trim() ? 0.4 : 1, width: '100%', padding: '12px' }}>
            {working ? 'Creating...' : 'Create market'}
          </button>
        </Modal>
      )}

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  )
}

const solidBtn = { background: '#f5f5f5', color: '#0c0c0c', padding: '9px 18px', fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, border: 'none' }
const ghostBtn = { background: 'none', border: '2px solid #f5f5f5', color: '#f5f5f5', padding: '7px 16px', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }
