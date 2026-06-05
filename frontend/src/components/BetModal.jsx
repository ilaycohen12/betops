import React, { useState } from 'react'
import { placeBet } from '../api'

const QUICK = [10, 25, 50, 100]

export default function BetModal({ market, side, groupId, user, onClose, onDone }) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const isYes = side === 'yes'
  const color = isYes ? '#4ade80' : '#f87171'
  const price = isYes ? parseFloat(market.yes_price) : 1 - parseFloat(market.yes_price)
  const pct = Math.round(price * 100)
  const payout = amount && parseFloat(amount) > 0 ? (parseFloat(amount) / price).toFixed(2) : null

  const handleConfirm = async () => {
    if (!amount || parseFloat(amount) <= 0) return
    setLoading(true); setError(null)
    try {
      await placeBet({ market_id: market.id, group_id: groupId, side, amount: parseFloat(amount), user_id: user.id })
      onDone(`✓ Bet placed — $${parseFloat(amount).toFixed(2)} on ${side.toUpperCase()}`)
    } catch (e) { setError(e.message); setLoading(false) }
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#13161b', border: '1px solid #2a2d35', borderRadius: 16, padding: 28, width: 360 }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, lineHeight: 1.4 }}>{market.question}</div>
        <div style={{ fontSize: 13, color, marginBottom: 20, fontWeight: 600 }}>{side.toUpperCase()} @ {pct}%</div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {QUICK.map(q => (
            <button key={q} onClick={() => setAmount(String(q))} style={{
              flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 13,
              background: parseFloat(amount) === q ? '#2a2d35' : '#1a1d23',
              border: `1px solid ${parseFloat(amount) === q ? '#6366f1' : '#2a2d35'}`,
              color: parseFloat(amount) === q ? '#fff' : '#9ca3af',
            }}>
              ${q}
            </button>
          ))}
        </div>

        <input type="number" placeholder="Or enter amount ($)" value={amount}
          onChange={e => setAmount(e.target.value)}
          style={{ width: '100%', background: '#0d0f12', border: '1px solid #2a2d35', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 15, marginBottom: 10, outline: 'none' }} />

        {payout && (
          <div style={{ background: '#1a1d23', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#9ca3af', marginBottom: 14, display: 'flex', justifyContent: 'space-between' }}>
            <span>Potential payout</span>
            <span style={{ color, fontWeight: 600 }}>${payout}</span>
          </div>
        )}

        {error && <div style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 10, borderRadius: 8, background: '#1a1d23', color: '#9ca3af', fontSize: 14 }}>Cancel</button>
          <button onClick={handleConfirm} disabled={loading || !amount || parseFloat(amount) <= 0}
            style={{ flex: 2, padding: 10, borderRadius: 8, fontSize: 14, fontWeight: 600, background: color, color: isYes ? '#0a1f14' : '#1f0a0a', opacity: loading || !amount ? 0.5 : 1 }}>
            {loading ? 'Placing...' : `Bet ${side.toUpperCase()}`}
          </button>
        </div>
      </div>
    </div>
  )
}
