import React, { useEffect } from 'react'

export default function Toast({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div style={{
      position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
      background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
      border: '1px solid rgba(168,85,247,0.3)',
      borderRadius: 14, padding: '12px 22px',
      fontSize: 14, fontWeight: 500, color: '#f0f0f8',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      zIndex: 200, whiteSpace: 'nowrap',
      animation: 'fadeUp 0.25s ease both',
    }}>
      {message}
    </div>
  )
}
