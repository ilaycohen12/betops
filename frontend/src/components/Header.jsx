import React from 'react'

const COLORS = ['#7c3aed', '#ec4899', '#f59e0b', '#10b981', '#3b82f6']
const avatarColor = (name) => COLORS[name.charCodeAt(0) % COLORS.length]

export default function Header({ user, balance, onBack }) {
  return (
    <header style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '14px 24px',
      background: 'rgba(8,8,15,0.9)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      position: 'sticky', top: 0, zIndex: 50,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {onBack && (
          <button onClick={onBack} style={{
            background: 'rgba(255,255,255,0.07)', color: '#9ca3af',
            fontSize: 18, width: 34, height: 34, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>←</button>
        )}
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>
          <span style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Bet</span>
          <span style={{ color: '#f0f0f8' }}>Ops</span>
          <span style={{ fontSize: 14, marginLeft: 6 }}>🎲</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {balance !== undefined && (
          <div style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 20, padding: '5px 14px', fontSize: 13,
          }}>
            💰 <span style={{ fontWeight: 700, color: '#f0f0f8' }}>${parseFloat(balance).toFixed(2)}</span>
          </div>
        )}
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: `linear-gradient(135deg, ${avatarColor(user.name)}, ${avatarColor(user.name)}99)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 800, color: '#fff',
          boxShadow: `0 0 12px ${avatarColor(user.name)}44`,
        }}>
          {user.name[0]}
        </div>
      </div>
    </header>
  )
}
