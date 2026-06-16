import React, { useState } from 'react'
import { register, setAuth } from '../api'

const field = { width: '100%', padding: '10px 14px', background: '#1a1a1a', border: '1px solid #333', borderRadius: 6, color: '#f0f0f0', fontSize: 14 }
const btn = { width: '100%', padding: '11px', background: '#e63946', color: '#fff', fontWeight: 700, fontSize: 14, borderRadius: 6, letterSpacing: 0.5 }

function Field({ label, hint, ...props }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <label style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</label>
        {hint && <span style={{ fontSize: 11, color: '#555' }}>{hint}</span>}
      </div>
      <input style={field} {...props} />
    </div>
  )
}

export default function SignupPage({ onLogin, onGoLogin }) {
  const [form, setForm] = useState({ first_name: '', last_name: '', username: '', email: '', password: '', nickname: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const payload = { ...form }
      if (!payload.nickname.trim()) delete payload.nickname
      const { token, user } = await register(payload)
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
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: -1 }}>
            BETOPS <span style={{ color: '#e63946' }}>DAILY</span>
          </div>
          <div style={{ color: '#888', fontSize: 13, marginTop: 6 }}>Create your account</div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="First name" value={form.first_name} onChange={set('first_name')} autoFocus required />
            <Field label="Last name" value={form.last_name} onChange={set('last_name')} required />
          </div>
          <Field label="Nickname" hint="optional" placeholder='e.g. "nicki"' value={form.nickname} onChange={set('nickname')} />
          <Field label="Username" value={form.username} onChange={set('username')} required />
          <Field label="Email" type="email" value={form.email} onChange={set('email')} required />
          <Field label="Password" type="password" value={form.password} onChange={set('password')} required />

          {form.first_name && form.last_name && (
            <div style={{ fontSize: 12, color: '#555', padding: '8px 12px', background: '#111', borderRadius: 6 }}>
              You'll appear as:{' '}
              <span style={{ color: '#f0f0f0', fontWeight: 700 }}>
                {form.first_name}{form.nickname ? ` "${form.nickname}"` : ''} {form.last_name}
              </span>
            </div>
          )}

          {error && <div style={{ color: '#e63946', fontSize: 13 }}>{error}</div>}

          <button type="submit" style={btn} disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#888' }}>
          Already have an account?{' '}
          <span onClick={onGoLogin} style={{ color: '#e63946', cursor: 'pointer', fontWeight: 700 }}>Sign in</span>
        </div>
      </div>
    </div>
  )
}
