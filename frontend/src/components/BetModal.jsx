import React, { useState } from 'react'
import { placeBet } from '../api'

export default function BetModal({ market, side, onClose, onDone }) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const isYes = side === 'yes'
  const color = isYes ? '#4ade80' : '#f87171'
  const pct = isYes
    ? Math.round(market.yes_pct ?? market.yes_price * 100)
    : 100 - Math.round(market.yes_pct ?? market.yes_price * 100)

  const handleConfirm = async () => {
    if (!amount || parseFloat(amount) <= 0) return
    setLoading(true)
    setError(null)
    try {
      await placeBet({ market_id: market.id, side, amount: parseFloat(amount) })
      setSuccess(true)
      setTimeout(onDone, 1200)
    } catch (e) {
      setError(e.message)
      setLoading(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', zIndex: 100,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#13161b', border: '1px solid #2a2d35',
          borderRadius: 16, padding: 28, width: 340,
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
          {market.question}
        </div>
        <div style={{ fontSize: 13, color: color, marginBottom: 20, fontWeight: 600 }}>
          Betting {side.toUpperCase()} @ {pct}%
        </div>

        {success ? (
          <div style={{ textAlign: 'center', color: '#4ade80', padding: '16px 0', fontSize: 15 }}>
            ✓ Bet placed!
          </div>
        ) : (
          <>
            <input
              type="number"
              placeholder="Amount ($)"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              autoFocus
              style={{
                width: '100%', background: '#0d0f12', border: '1px solid #2a2d35',
                borderRadius: 8, padding: '10px 14px', color: '#fff',
                fontSize: 15, marginBottom: 14, outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = '#6366f1'}
              onBlur={e => e.target.style.borderColor = '#2a2d35'}
            />

            {error && (
              <div style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{error}</div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1, padding: 10, borderRadius: 8,
                  background: '#1a1d23', color: '#9ca3af', fontSize: 14,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading || !amount}
                style={{
                  flex: 2, padding: 10, borderRadius: 8, fontSize: 14,
                  fontWeight: 600, background: color,
                  color: isYes ? '#0a1f14' : '#1f0a0a',
                  opacity: loading || !amount ? 0.6 : 1,
                }}
              >
                {loading ? 'Placing...' : `Bet ${side.toUpperCase()}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
