import React, { useEffect } from 'react'

export default function Toast({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div style={{
      position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
      background: '#f5f5f5', color: '#0c0c0c',
      padding: '12px 24px', fontSize: 13, fontWeight: 700,
      letterSpacing: 0.5, textTransform: 'uppercase',
      zIndex: 200, whiteSpace: 'nowrap', border: '2px solid #0c0c0c',
      boxShadow: '4px 4px 0 #e63946',
      animation: 'fadeUp 0.2s ease',
    }}>
      {message}
    </div>
  )
}
