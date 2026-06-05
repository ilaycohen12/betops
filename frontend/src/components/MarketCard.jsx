import React from 'react'

export default function MarketCard({ market, onBet }) {
  const yesPct = Math.round(market.yes_pct ?? market.yes_price * 100)
  const noPct = 100 - yesPct

  return (
    <div style={{
      background: '#13161b', border: '1px solid #1e2128', borderRadius: 14,
      padding: 20, transition: 'border-color 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f144'}
      onMouseLeave={e => e.currentTarget.style.borderColor = '#1e2128'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
        <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.4, maxWidth: '75%' }}>
          {market.question}
        </div>
        {market.closes_at && (
          <div style={{ fontSize: 12, color: '#6b7280', textAlign: 'right' }}>
            Closes<br />
            {new Date(market.closes_at).toLocaleDateString()}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={() => onBet(market, 'yes')}
          style={{
            flex: 1, padding: '10px 0', borderRadius: 10,
            background: '#0f2d1f', border: '1px solid #1a4a2e', color: '#4ade80',
            fontSize: 13, fontWeight: 600, transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#163d29'}
          onMouseLeave={e => e.currentTarget.style.background = '#0f2d1f'}
        >
          <span style={{ display: 'block', fontSize: 18, marginBottom: 2 }}>{yesPct}%</span>
          <span style={{ opacity: 0.7, fontWeight: 400 }}>Yes</span>
        </button>

        <button
          onClick={() => onBet(market, 'no')}
          style={{
            flex: 1, padding: '10px 0', borderRadius: 10,
            background: '#2d0f0f', border: '1px solid #4a1a1a', color: '#f87171',
            fontSize: 13, fontWeight: 600, transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#3d1616'}
          onMouseLeave={e => e.currentTarget.style.background = '#2d0f0f'}
        >
          <span style={{ display: 'block', fontSize: 18, marginBottom: 2 }}>{noPct}%</span>
          <span style={{ opacity: 0.7, fontWeight: 400 }}>No</span>
        </button>
      </div>
    </div>
  )
}
