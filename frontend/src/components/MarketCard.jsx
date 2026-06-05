import React, { useState } from 'react'

function timeLeft(closes_at) {
  if (!closes_at) return null
  const diff = new Date(closes_at) - new Date()
  if (diff <= 0) return 'Closing soon'
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  if (days > 0) return `${days}d left`
  return `${hours}h left`
}

export default function MarketCard({ market, onBet, onResolve, showResolve }) {
  const [resolving, setResolving] = useState(false)
  const yesPct = Math.round(market.yes_pct ?? market.yes_price * 100)
  const noPct = 100 - yesPct
  const remaining = timeLeft(market.closes_at)
  const isOpen = market.status === 'open'
  const isSettled = market.status === 'settled'

  return (
    <div style={{
      background: '#13161b', border: `1px solid ${isSettled ? '#1e2128' : '#1e2128'}`,
      borderRadius: 14, padding: 20, opacity: isSettled ? 0.7 : 1,
      transition: 'border-color 0.2s',
    }}
      onMouseEnter={e => !isSettled && (e.currentTarget.style.borderColor = '#6366f144')}
      onMouseLeave={e => e.currentTarget.style.borderColor = '#1e2128'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.4, maxWidth: '78%' }}>
          {market.question}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          {remaining && isOpen && (
            <div style={{ fontSize: 11, color: '#6b7280', background: '#1a1d23', border: '1px solid #2a2d35', borderRadius: 6, padding: '3px 8px' }}>
              {remaining}
            </div>
          )}
          {isSettled && (
            <div style={{ fontSize: 11, fontWeight: 600, color: market.result === 'yes' ? '#4ade80' : '#f87171', background: '#1a1d23', border: '1px solid #2a2d35', borderRadius: 6, padding: '3px 8px' }}>
              {market.result?.toUpperCase()} won
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 5, borderRadius: 999, background: '#1e2128', marginBottom: 14, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${yesPct}%`, background: 'linear-gradient(90deg, #4ade80, #22c55e)', borderRadius: 999, transition: 'width 0.4s ease' }} />
      </div>

      {/* YES/NO buttons */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={() => isOpen && onBet(market, 'yes')}
          disabled={!isOpen}
          style={{ flex: 1, padding: '10px 0', borderRadius: 10, background: '#0f2d1f', border: '1px solid #1a4a2e', color: '#4ade80', fontSize: 13, fontWeight: 600, opacity: isOpen ? 1 : 0.5, cursor: isOpen ? 'pointer' : 'default' }}
        >
          <span style={{ display: 'block', fontSize: 18, marginBottom: 2 }}>{yesPct}%</span>
          <span style={{ opacity: 0.7, fontWeight: 400 }}>Yes</span>
        </button>
        <button
          onClick={() => isOpen && onBet(market, 'no')}
          disabled={!isOpen}
          style={{ flex: 1, padding: '10px 0', borderRadius: 10, background: '#2d0f0f', border: '1px solid #4a1a1a', color: '#f87171', fontSize: 13, fontWeight: 600, opacity: isOpen ? 1 : 0.5, cursor: isOpen ? 'pointer' : 'default' }}
        >
          <span style={{ display: 'block', fontSize: 18, marginBottom: 2 }}>{noPct}%</span>
          <span style={{ opacity: 0.7, fontWeight: 400 }}>No</span>
        </button>
      </div>

      {/* Resolve buttons */}
      {showResolve && market.status === 'closed' && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>Resolve this market:</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => !resolving && onResolve(market.id, 'yes')} style={{ flex: 1, padding: '8px 0', borderRadius: 8, background: '#0f2d1f', border: '1px solid #1a4a2e', color: '#4ade80', fontSize: 13, fontWeight: 600 }}>
              YES won
            </button>
            <button onClick={() => !resolving && onResolve(market.id, 'no')} style={{ flex: 1, padding: '8px 0', borderRadius: 8, background: '#2d0f0f', border: '1px solid #4a1a1a', color: '#f87171', fontSize: 13, fontWeight: 600 }}>
              NO won
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
