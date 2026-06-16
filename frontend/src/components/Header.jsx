import React from 'react'
import { displayName } from '../api'

export default function Header({ user, balance, onBack, onLogout }) {
  return (
    <header style={{ background: '#0c0c0c', borderBottom: '3px solid #f5f5f5', padding: '0 24px' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #2a2a2a', fontSize: 11, color: '#888', letterSpacing: 1, textTransform: 'uppercase' }}>
        <div>Friends Prediction Market</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {balance !== undefined && <span>${parseFloat(balance).toFixed(2)}</span>}
          {onLogout && (
            <span onClick={onLogout} style={{ cursor: 'pointer', color: '#555', letterSpacing: 1 }}>Sign out</span>
          )}
        </div>
      </div>

      {/* Main header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {onBack && (
            <button onClick={onBack} style={{ background: 'none', color: '#888', fontSize: 14, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', padding: 0 }}>
              Back
            </button>
          )}
          <div className="display" style={{ fontSize: 38, lineHeight: 1, color: '#f5f5f5' }}>
            BETOPS <span style={{ color: '#e63946', fontSize: 28 }}>DAILY</span>
          </div>
        </div>
        <div style={{ textAlign: 'right', borderLeft: '2px solid #f5f5f5', paddingLeft: 16 }}>
          <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Signed in as</div>
          <div style={{ fontWeight: 800, fontSize: 15 }}>{displayName(user)}</div>
        </div>
      </div>
    </header>
  )
}
