import React, { useEffect, useState } from 'react'
import { joinGroup } from '../api'

export default function JoinPage({ user, code, onDone }) {
  const [status, setStatus] = useState('joining')

  useEffect(() => {
    joinGroup(code, user.id)
      .then(g => onDone(g.group_id))
      .catch(e => setStatus(e.message))
  }, [])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#9ca3af' }}>
      {status === 'joining' ? 'Joining group...' : `Error: ${status}`}
    </div>
  )
}
