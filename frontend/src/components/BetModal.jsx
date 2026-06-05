import React, { useState } from 'react'
import { placeBet } from '../api'

const QUICK = [10, 25, 50, 100]

export default function BetModal({ market, side, groupId, user, onClose, onDone }) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const isYes = side === 'yes'
  const color = isYes ? '#10b981' : '#ef4444'
  const bgColor = isYes ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)'
  const borderColor = isYes ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'
  const price = isYes ? parseFloat(market.yes_price) : 1 - parseFloat(market.yes_price)
  const pct = Math.round(price * 100)
  const payout = amount && parseFloat(amount) > 0 ? (parseFloat(amount) / price).toFixed(2) : null
  const profit = payout ? (parseFloat(payout) - parseFloat(amount)).toFixed(2) : null

  const handleConfirm = async () => {
    if (!amount || parseFloat(amount) <= 0) return
    setLoading(true); setError(null)
    try {
      await placeBet({ market_id: market.id, group_id: groupId, side, amount: parseFloat(amount), user_id: user.id })
      onDone(`${isYes ? '🟢' : '🔴'} $${parseFloat(amount).toFixed(0)} on ${side.toUpperCase()} — let's gooo!`)
    } catch (e) { setError(e.message); setLoading(false) }
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#111118', border: `1px solid ${borderColor}`, borderRadius: 22, padding: 26, width: '100%', maxWidth: 380, boxShadow: `0 20px 60px rgba(0,0,0,0.7), 0 0 40px ${color}11`, animation: 'fadeUp 0.2s ease' }}>

        {/* Side indicator */}
        <div style={{ background: bgColor, border: `1px solid ${borderColor}`, borderRadius: 12, padding: '10px 16px', marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13, color: '#9ca3af' }}>Betting on</div>
          <div style={{ fontWeight: 800, fontSize: 16, color }}>{isYes ? '👍 YES' : '👎 NO'} @ {pct}%</div>
        </div>

        <div style={{ fontSize: 14, color: '#9ca3af', marginBottom: 16, lineHeight: 1.4 }}>{market.question}</div>

        {/* Quick amounts */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
          {QUICK.map(q => (
            <button key={q} onClick={() => setAmount(String(q))} style={{
              padding: '9px 0', borderRadius: 10, fontSize: 14, fontWeight: 700,
              background: parseFloat(amount) === q ? color : 'rgba(255,255,255,0.05)',
              border: `1px solid ${parseFloat(amount) === q ? color : 'rgba(255,255,255,0.08)'}`,
              color: parseFloat(amount) === q ? (isYes ? '#022c22' : '#2d0a0a') : '#9ca3af',
              transition: 'all 0.15s',
            }}>
              ${q}
            </button>
          ))}
        </div>

        <input type="number" placeholder="Custom amount..." value={amount}
          onChange={e => setAmount(e.target.value)}
          style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '11px 14px', color: '#f0f0f8', fontSize: 16, outline: 'none', marginBottom: 12 }} />

        {/* Payout preview */}
        {payout && (
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>Win payout</div>
              <div style={{ fontWeight: 800, fontSize: 20, color }}>${payout}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>Profit</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#10b981' }}>+${profit}</div>
            </div>
          </div>
        )}

        {error && <div style={{ color: '#f43f5e', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{error}</div>}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.05)', color: '#9ca3af', fontSize: 14, fontWeight: 600 }}>Cancel</button>
          <button onClick={handleConfirm} disabled={loading || !amount || parseFloat(amount) <= 0} style={{
            flex: 2, padding: 12, borderRadius: 12, fontSize: 15, fontWeight: 800,
            background: loading || !amount ? 'rgba(255,255,255,0.05)' : `linear-gradient(135deg, ${color}, ${color}cc)`,
            color: loading || !amount ? '#4b5563' : (isYes ? '#022c22' : '#2d0a0a'),
            transition: 'all 0.15s',
            boxShadow: loading || !amount ? 'none' : `0 4px 16px ${color}44`,
          }}>
            {loading ? 'Placing...' : `Bet ${isYes ? '👍' : '👎'} ${side.toUpperCase()}`}
          </button>
        </div>
      </div>
    </div>
  )
}
