import React, { useState } from 'react'
import { login, setAuth } from '../api'

const field = { width: '100%', padding: '10px 14px', background: '#1a1a1a', border: '1px solid #333', borderRadius: 6, color: '#f0f0f0', fontSize: 14 }
const btn = { width: '100%', padding: '11px', background: '#e63946', color: '#fff', fontWeight: 700, fontSize: 14, borderRadius: 6, letterSpacing: 0.5 }

export default function LoginPage({ onLogin, onGoSignup }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { token, user } = await login(username, password)
      setAuth(token, user)
      onLogin(user)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: -1 }}>
            BETOPS <span style={{ color: '#e63946' }}>DAILY</span>
          </div>
          <div style={{ color: '#888', fontSize: 13, marginTop: 6 }}>Friends Prediction Market</div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }}>Username</label>
            <input style={field} value={username} onChange={e => setUsername(e.target.value)} autoFocus required />
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }}>Password</label>
            <input style={field} type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>

          {error && <div style={{ color: '#e63946', fontSize: 13 }}>{error}</div>}

          <button type="submit" style={btn} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#888' }}>
          No account?{' '}
          <span onClick={onGoSignup} style={{ color: '#e63946', cursor: 'pointer', fontWeight: 700 }}>Sign up</span>
        </div>
      </div>
    </div>
  )
}
