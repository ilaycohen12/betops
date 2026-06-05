import React from 'react'

export default function Modal({ title, children, onClose }) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(4px)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#13161b', border: '1px solid #2a2d35',
        borderRadius: 16, padding: 28, width: 380,
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{title}</div>
        {children}
      </div>
    </div>
  )
}
