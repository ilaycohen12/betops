import React, { useState } from 'react'
import { placeBet } from '../api'

const QUICK = [10, 25, 50, 100]

export default function BetModal({ market, side, groupId, user, onClose, onDone }) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const isYes = side === 'yes'
  const color = isYes ? '#4caf50' : '#e63946'
  const price = isYes ? parseFloat(market.yes_price) : 1 - parseFloat(market.yes_price)
  const pct = Math.round(price * 100)
  const payout = amount && parseFloat(amount) > 0 ? (parseFloat(amount) / price).toFixed(2) : null
  const profit = payout ? (parseFloat(payout) - parseFloat(amount)).toFixed(2) : null

  const handleConfirm = async () => {
    if (!amount || parseFloat(amount) <= 0) return
    setLoading(true); setError(null)
    try {
      await placeBet({ market_id: market.id, group_id: groupId, side, amount: parseFloat(amount) })
      onDone(`Bet placed — $${parseFloat(amount).toFixed(0)} on ${side.toUpperCase()}`)
    } catch (e) { setError(e.message); setLoading(false) }
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#0c0c0c', border: `3px solid ${color}`, width: '100%', maxWidth: 400, animation: 'fadeUp 0.2s ease' }}>

        {/* Header */}
        <div style={{ background: color, color: '#0c0c0c', padding: '10px 20px' }}>
          <div className="display" style={{ fontSize: 22 }}>BET {side.toUpperCase()} — {pct}%</div>
        </div>

        <div style={{ padding: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, lineHeight: 1.4, color: '#aaa' }}>
            {market.question}
          </div>

          {/* Quick amounts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 10 }}>
            {QUICK.map(q => (
              <button key={q} onClick={() => setAmount(String(q))} style={{
                padding: '10px 0', fontSize: 14, fontWeight: 800,
                background: parseFloat(amount) === q ? color : '#161616',
                border: `2px solid ${parseFloat(amount) === q ? color : '#2a2a2a'}`,
                color: parseFloat(amount) === q ? '#0c0c0c' : '#888',
                transition: 'all 0.1s',
              }}>
                ${q}
              </button>
            ))}
          </div>

          <input type="number" placeholder="Custom amount" value={amount}
            onChange={e => setAmount(e.target.value)}
            style={{ width: '100%', background: '#161616', border: '2px solid #2a2a2a', padding: '11px 14px', color: '#f5f5f5', fontSize: 16, outline: 'none', marginBottom: 12 }} />

          {/* Payout */}
          {payout && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: '1px solid #2a2a2a', borderBottom: '1px solid #2a2a2a', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>Payout if win</div>
                <div className="display" style={{ fontSize: 28, color }}>${payout}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>Profit</div>
                <div className="display" style={{ fontSize: 28, color: '#4caf50' }}>+${profit}</div>
              </div>
            </div>
          )}

          {error && <div style={{ color: '#e63946', fontSize: 13, fontWeight: 700, marginBottom: 12 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} style={{ padding: '11px 20px', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', background: 'none', border: '2px solid #2a2a2a', color: '#888' }}>
              Cancel
            </button>
            <button onClick={handleConfirm} disabled={loading || !amount || parseFloat(amount) <= 0} style={{
              flex: 1, padding: '11px 0', fontSize: 13, fontWeight: 800,
              textTransform: 'uppercase', letterSpacing: 0.5,
              background: loading || !amount ? '#1a1a1a' : color,
              color: loading || !amount ? '#444' : '#0c0c0c',
              border: 'none', transition: 'all 0.1s',
            }}>
              {loading ? 'Placing...' : `Confirm bet`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
