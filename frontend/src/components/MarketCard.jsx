import React from 'react'

function timeLeft(closes_at) {
  if (!closes_at) return null
  const diff = new Date(closes_at) - new Date()
  if (diff <= 0) return 'Closed'
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  if (days > 0) return `${days}d left`
  return `${hours}h left`
}

export default function MarketCard({ market, onBet, onResolve, showResolve }) {
  const isOverUnder = market.type === 'over_under'
  const sideA = isOverUnder ? 'over' : 'yes'
  const sideB = isOverUnder ? 'under' : 'no'
  const labelA = isOverUnder ? `Over ${market.threshold}` : 'Yes'
  const labelB = isOverUnder ? `Under ${market.threshold}` : 'No'

  const yesPct = Math.round(market.yes_pct ?? market.yes_price * 100)
  const noPct = 100 - yesPct
  const remaining = timeLeft(market.closes_at)
  const isOpen = market.status === 'open'
  const isSettled = market.status === 'settled'

  const resultLabel = isSettled
    ? (isOverUnder
        ? (market.result === 'over' ? `Over ${market.threshold}` : `Under ${market.threshold}`)
        : market.result?.toUpperCase())
    : null

  return (
    <div style={{
      borderBottom: '1px solid #2a2a2a',
      padding: '20px 0',
      opacity: isSettled ? 0.55 : 1,
    }}>
      {/* Meta row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
            {isSettled ? `Settled — ${resultLabel} won` : isOpen ? 'Open' : 'Awaiting result'}
          </div>
          {isOverUnder && (
            <div style={{ fontSize: 10, color: '#888', background: '#1e1e1e', border: '1px solid #333', padding: '2px 7px', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
              Over/Under
            </div>
          )}
        </div>
        {remaining && isOpen && (
          <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}>{remaining}</div>
        )}
      </div>

      {/* Question */}
      <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.3, marginBottom: 14, letterSpacing: -0.3 }}>
        {market.question}
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 13, fontWeight: 700 }}>
          <span style={{ color: '#4caf50' }}>{labelA.toUpperCase()} {yesPct}%</span>
          <span style={{ color: '#e63946' }}>{labelB.toUpperCase()} {noPct}%</span>
        </div>
        <div style={{ height: 8, background: '#1e1e1e', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${yesPct}%`, background: '#4caf50', transition: 'width 0.4s ease' }} />
        </div>
      </div>

      {/* Bet buttons */}
      {isOpen && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => onBet(market, sideA)} style={{
            flex: 1, padding: '11px 0', fontSize: 13, fontWeight: 800,
            textTransform: 'uppercase', letterSpacing: 0.5,
            background: 'none', border: '2px solid #4caf50', color: '#4caf50',
            transition: 'all 0.1s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = '#4caf50'; e.currentTarget.style.color = '#0c0c0c' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#4caf50' }}
          >
            Bet {labelA}
          </button>
          <button onClick={() => onBet(market, sideB)} style={{
            flex: 1, padding: '11px 0', fontSize: 13, fontWeight: 800,
            textTransform: 'uppercase', letterSpacing: 0.5,
            background: 'none', border: '2px solid #e63946', color: '#e63946',
            transition: 'all 0.1s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = '#e63946'; e.currentTarget.style.color = '#0c0c0c' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#e63946' }}
          >
            Bet {labelB}
          </button>
        </div>
      )}

      {/* Resolve */}
      {showResolve && market.status === 'closed' && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Mark result</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => onResolve(market.id, sideA)} style={{ flex: 1, padding: '9px 0', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, background: '#4caf50', color: '#0c0c0c', border: 'none' }}>
              {labelA} won
            </button>
            <button onClick={() => onResolve(market.id, sideB)} style={{ flex: 1, padding: '9px 0', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, background: '#e63946', color: '#0c0c0c', border: 'none' }}>
              {labelB} won
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
