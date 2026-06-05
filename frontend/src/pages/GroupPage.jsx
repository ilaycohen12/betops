import React, { useEffect, useState, useCallback } from 'react'
import { fetchGroup, createMarket, resolveMarket } from '../api'
import Header from '../components/Header'
import MarketCard from '../components/MarketCard'
import BetModal from '../components/BetModal'
import Modal from '../components/Modal'
import Toast from '../components/Toast'

const MEDAL = ['🥇', '🥈', '🥉']
const COLORS = ['#7c3aed', '#ec4899', '#f59e0b', '#10b981', '#3b82f6']
const avatarColor = (name) => COLORS[name.charCodeAt(0) % COLORS.length]

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
      setToast('🎯 Market created! Let the bets begin.')
    } catch (e) { setToast('❌ ' + e.message) }
    setWorking(false)
  }

  const handleResolve = async (market_id, result) => {
    try {
      await resolveMarket(market_id, result, user.id)
      setToast(`🏆 Market resolved — ${result.toUpperCase()} won!`)
      load()
    } catch (e) { setToast('❌ ' + e.message) }
  }

  const copy = (text, key) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  if (loading && !group) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#6b7280' }}>
      Loading...
    </div>
  )
  if (!group) return null

  const openMarkets = group.markets.filter(m => m.status === 'open')
  const otherMarkets = group.markets.filter(m => m.status !== 'open')
  const inviteUrl = `${window.location.origin}/join/${group.invite_code}`

  return (
    <div style={{ minHeight: '100vh' }}>
      <Header user={user} balance={myBalance} onBack={onBack} />

      <main style={{ maxWidth: 780, margin: '0 auto', padding: '28px 20px' }}>
        {/* Group header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, animation: 'fadeUp 0.3s ease' }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>{group.name}</div>
            <div style={{ fontSize: 14, color: '#6b7280' }}>
              {group.members.length} member{group.members.length !== 1 ? 's' : ''} · {openMarkets.length} open market{openMarkets.length !== 1 ? 's' : ''}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setShowInvite(true)} style={{ padding: '9px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#d1d5db', fontSize: 14, fontWeight: 600 }}>
              🔗 Invite
            </button>
            <button onClick={() => setShowCreateMarket(true)} style={{ padding: '9px 16px', borderRadius: 12, background: 'linear-gradient(135deg, #7c3aed, #ec4899)', color: '#fff', fontSize: 14, fontWeight: 700, boxShadow: '0 4px 16px rgba(124,58,237,0.35)' }}>
              + Market
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
          {['markets', 'leaderboard'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '8px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600,
              background: tab === t ? 'rgba(168,85,247,0.15)' : 'transparent',
              border: `1px solid ${tab === t ? 'rgba(168,85,247,0.4)' : 'transparent'}`,
              color: tab === t ? '#a855f7' : '#6b7280',
              transition: 'all 0.15s',
            }}>
              {t === 'markets' ? '🎯 Markets' : '🏆 Leaderboard'}
            </button>
          ))}
        </div>

        {tab === 'markets' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, animation: 'fadeUp 0.3s ease' }}>
            {group.markets.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>No markets yet</div>
                <div style={{ fontSize: 14 }}>Create the first one and get the group betting!</div>
              </div>
            )}
            {openMarkets.map((m, i) => (
              <div key={m.id} style={{ animation: `fadeUp 0.3s ease ${i * 0.05}s both` }}>
                <MarketCard market={m} onBet={(market, side) => setActiveBet({ market, side })}
                  onResolve={handleResolve} showResolve />
              </div>
            ))}
            {otherMarkets.length > 0 && (
              <>
                <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.5, color: '#4b5563', margin: '8px 0 4px', fontWeight: 700 }}>Past markets</div>
                {otherMarkets.map(m => (
                  <MarketCard key={m.id} market={m} onBet={() => {}} onResolve={handleResolve} showResolve={m.status === 'closed'} />
                ))}
              </>
            )}
          </div>
        )}

        {tab === 'leaderboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, animation: 'fadeUp 0.3s ease' }}>
            {group.members.map((m, i) => {
              const isMe = m.id === user.id
              const bal = parseFloat(m.balance)
              const diff = bal - 500
              return (
                <div key={m.id} style={{
                  background: isMe ? 'rgba(168,85,247,0.08)' : '#111118',
                  border: `1px solid ${isMe ? 'rgba(168,85,247,0.3)' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 16, padding: '14px 18px',
                  display: 'flex', alignItems: 'center', gap: 14,
                  animation: `fadeUp 0.3s ease ${i * 0.05}s both`,
                }}>
                  <div style={{ fontSize: 22, width: 32, textAlign: 'center' }}>
                    {MEDAL[i] || `#${i + 1}`}
                  </div>
                  <div style={{
                    width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                    background: `linear-gradient(135deg, ${avatarColor(m.name)}, ${avatarColor(m.name)}88)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 15, fontWeight: 800, color: '#fff',
                  }}>
                    {m.name[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>
                      {m.name} {isMe && <span style={{ fontSize: 11, color: '#a855f7', fontWeight: 600 }}>you</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: 18 }}>${bal.toFixed(0)}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: diff >= 0 ? '#10b981' : '#ef4444' }}>
                      {diff >= 0 ? '+' : ''}{diff.toFixed(0)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {activeBet && (
        <BetModal market={activeBet.market} side={activeBet.side} groupId={groupId} user={user}
          onClose={() => setActiveBet(null)} onDone={(msg) => { setActiveBet(null); setToast(msg); load() }} />
      )}

      {showInvite && (
        <Modal title="🎉 Invite friends" onClose={() => setShowInvite(false)}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Invite code</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 16px', fontSize: 22, fontWeight: 900, letterSpacing: 6, textAlign: 'center', color: '#a855f7' }}>
                {group.invite_code}
              </div>
              <button onClick={() => copy(group.invite_code, 'code')} style={{ padding: '12px 16px', borderRadius: 12, background: copied === 'code' ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: copied === 'code' ? '#10b981' : '#9ca3af', fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap' }}>
                {copied === 'code' ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Or share link</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 12px', fontSize: 12, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {inviteUrl}
              </div>
              <button onClick={() => copy(inviteUrl, 'url')} style={{ padding: '10px 14px', borderRadius: 10, background: copied === 'url' ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: copied === 'url' ? '#10b981' : '#9ca3af', fontWeight: 600, fontSize: 14 }}>
                {copied === 'url' ? '✓' : 'Copy'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showCreateMarket && (
        <Modal title="🎯 New market" onClose={() => setShowCreateMarket(false)}>
          <textarea placeholder="What are you betting on? e.g. Will Arsenal win the league?" value={newMarket.question}
            onChange={e => setNewMarket(p => ({ ...p, question: e.target.value }))}
            rows={3} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 16px', color: '#f0f0f8', fontSize: 15, outline: 'none', marginBottom: 12, resize: 'none' }} autoFocus />
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>Close date (optional)</div>
          <input type="datetime-local" value={newMarket.closes_at}
            onChange={e => setNewMarket(p => ({ ...p, closes_at: e.target.value }))}
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 14px', color: '#f0f0f8', fontSize: 14, outline: 'none', marginBottom: 16, colorScheme: 'dark' }} />
          <button onClick={handleCreateMarket} disabled={working || !newMarket.question.trim()} style={{
            width: '100%', padding: '13px', borderRadius: 12, fontSize: 15, fontWeight: 700,
            background: working || !newMarket.question.trim() ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #7c3aed, #ec4899)',
            color: working || !newMarket.question.trim() ? '#4b5563' : '#fff',
            boxShadow: working || !newMarket.question.trim() ? 'none' : '0 4px 20px rgba(124,58,237,0.35)',
          }}>
            {working ? 'Creating...' : 'Create market 🚀'}
          </button>
        </Modal>
      )}

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  )
}
