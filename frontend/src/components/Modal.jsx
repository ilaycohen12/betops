import React, { useEffect } from 'react'

export default function Modal({ title, onClose, children }) {
  useEffect(() => {
    const handler = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100, padding: 20,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#111118',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20,
        padding: 28,
        width: '100%', maxWidth: 400,
        boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
        animation: 'fadeUp 0.2s ease both',
      }}>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 20 }}>{title}</div>
        {children}
      </div>
    </div>
  )
}
