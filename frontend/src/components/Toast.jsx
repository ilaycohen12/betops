import React, { useEffect } from 'react'

export default function Toast({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div style={{
      position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
      background: '#1a1d23', border: '1px solid #2a2d35', borderRadius: 10,
      padding: '12px 20px', fontSize: 14, color: '#d1d5db',
      boxShadow: '0 4px 24px rgba(0,0,0,0.4)', zIndex: 200, whiteSpace: 'nowrap',
    }}>
      {message}
    </div>
  )
}
