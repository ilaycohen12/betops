import React, { useState } from 'react'

function timeLeft(closes_at) {
  if (!closes_at) return null
  const diff = new Date(closes_at) - new Date()
  if (diff <= 0) return 'Closing soon'
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  if (days > 0) return `${days}d`
  return `${hours}h`
}

export default function MarketCard({ market, onBet, onResolve, showResolve }) {
  const yesPct = Math.round(market.yes_pct ?? market.yes_price * 100)
  const noPct = 100 - yesPct
  const remaining = timeLeft(market.closes_at)
  const isOpen = market.status === 'open'
  const isSettled = market.status === 'settled'

  return (
    <div style={{
      background: '#111118',
      borderRadius: 18,
      padding: '18px 20px',
      border: '1px solid rgba(255,255,255,0.07)',
      opacity: isSettled ? 0.6 : 1,
      transition: 'all 0.2s',
    }}
      onMouseEnter={e => !isSettled && isOpen && (e.currentTarget.style.borderColor = 'rgba(168,85,247,0.25)')}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}
    >
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, gap: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.45, flex: 1 }}>
          {market.question}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
          {remaining && isOpen && (
            <span style={{ fontSize: 11, color: '#9ca3af', background: 'rgba(255,255,255,0.05)', borderRadius: 6, padding: '2px 8px' }}>
              ⏱ {remaining}
            </span>
          )}
          {isSettled && (
            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 8, background: market.result === 'yes' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: market.result === 'yes' ? '#10b981' : '#ef4444' }}>
              {market.result?.toUpperCase()} won ✓
            </span>
          )}
          {market.status === 'closed' && (
            <span style={{ fontSize: 11, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '2px 8px', borderRadius: 6 }}>
              Awaiting result
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ position: 'relative', height: 6, borderRadius: 99, background: 'rgba(239,68,68,0.25)', marginBottom: 14, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: `${yesPct}%`,
          background: 'linear-gradient(90deg, #10b981, #059669)',
          borderRadius: 99, transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
        }} />
      </div>

      {/* YES/NO buttons */}
      {isOpen && (
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => onBet(market, 'yes')} style={{
            flex: 1, padding: '11px 0', borderRadius: 12,
            background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)',
            color: '#10b981', fontSize: 13, fontWeight: 700,
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.2)'; e.currentTarget.style.transform = 'scale(1.02)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.12)'; e.currentTarget.style.transform = 'scale(1)' }}
          >
            <span style={{ display: 'block', fontSize: 20, marginBottom: 1 }}>{yesPct}%</span>
            <span style={{ opacity: 0.7, fontWeight: 500 }}>Yes 👍</span>
          </button>
          <button onClick={() => onBet(market, 'no')} style={{
            flex: 1, padding: '11px 0', borderRadius: 12,
            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)',
            color: '#ef4444', fontSize: 13, fontWeight: 700,
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; e.currentTarget.style.transform = 'scale(1.02)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.transform = 'scale(1)' }}
          >
            <span style={{ display: 'block', fontSize: 20, marginBottom: 1 }}>{noPct}%</span>
            <span style={{ opacity: 0.7, fontWeight: 500 }}>No 👎</span>
          </button>
        </div>
      )}

      {!isOpen && !isSettled && (
        <div style={{ fontSize: 13, color: '#6b7280', textAlign: 'center', padding: '8px 0' }}>Market closed — waiting for resolution</div>
      )}

      {/* Resolve */}
      {showResolve && market.status === 'closed' && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8, textAlign: 'center' }}>Who won? 🏆</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => onResolve(market.id, 'yes')} style={{ flex: 1, padding: '9px 0', borderRadius: 10, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981', fontSize: 13, fontWeight: 700 }}>
              ✅ Yes won
            </button>
            <button onClick={() => onResolve(market.id, 'no')} style={{ flex: 1, padding: '9px 0', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 13, fontWeight: 700 }}>
              ❌ No won
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
