import React from 'react'

export default function Header({ user, balance, onBack }) {
  return (
    <header style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '14px 24px', borderBottom: '1px solid #1e2128',
      position: 'sticky', top: 0, background: '#0d0f12', zIndex: 50,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {onBack && (
          <button onClick={onBack} style={{ background: 'none', color: '#6b7280', fontSize: 20, padding: '0 4px' }}>←</button>
        )}
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.5px' }}>
          Bet<span style={{ color: '#6366f1' }}>Ops</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {balance !== undefined && (
          <div style={{ fontSize: 14, color: '#9ca3af' }}>
            Balance: <span style={{ color: '#f0f0f0', fontWeight: 600 }}>${parseFloat(balance).toFixed(2)}</span>
          </div>
        )}
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, color: '#fff',
        }}>
          {user.name[0]}
        </div>
      </div>
    </header>
  )
}
