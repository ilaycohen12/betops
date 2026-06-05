import React, { useEffect } from 'react'

export default function Modal({ title, onClose, children }) {
  useEffect(() => {
    const h = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#0c0c0c', border: '3px solid #f5f5f5', width: '100%', maxWidth: 420, animation: 'fadeUp 0.2s ease' }}>
        <div style={{ background: '#f5f5f5', color: '#0c0c0c', padding: '10px 20px' }}>
          <div className="display" style={{ fontSize: 22 }}>{title.toUpperCase()}</div>
        </div>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {children}
        </div>
      </div>
    </div>
  )
}
