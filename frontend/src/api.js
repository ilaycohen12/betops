const API = import.meta.env.VITE_API_URL || ''

export const displayName = (user) => {
  if (!user) return ''
  if (user.first_name && user.last_name) {
    const nick = user.nickname ? ` "${user.nickname}"` : ''
    return `${user.first_name}${nick} ${user.last_name}`
  }
  return user.name || user.username || ''
}

const getToken = () => localStorage.getItem('token')

export const setAuth = (token, user) => {
  localStorage.setItem('token', token)
  localStorage.setItem('user', JSON.stringify({ ...user, name: displayName(user) }))
}

export const clearAuth = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export const getStoredUser = () => {
  try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
}

const call = async (path, opts = {}) => {
  const token = getToken()
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${API}${path}`, { ...opts, headers })
  if (res.status === 401) {
    clearAuth()
    window.location.reload()
    return
  }
  const body = await res.json()
  if (!res.ok) throw new Error(body.error || 'Request failed')
  return body
}

export const register = (data) =>
  call('/auth/register', { method: 'POST', body: JSON.stringify(data) })

export const login = (username, password) =>
  call('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) })

export const fetchGroups = () => call('/groups')
export const createGroup = (name) => call('/groups', { method: 'POST', body: JSON.stringify({ name }) })
export const joinGroup = (invite_code) => call('/groups/join', { method: 'POST', body: JSON.stringify({ invite_code }) })
export const fetchGroup = (group_id) => call(`/groups/${group_id}`)
export const createMarket = (group_id, data) => call(`/groups/${group_id}/markets`, { method: 'POST', body: JSON.stringify(data) })
export const resolveMarket = (market_id, result) => call(`/markets/${market_id}/resolve`, { method: 'POST', body: JSON.stringify({ result }) })
export const placeBet = ({ market_id, group_id, side, amount }) =>
  call('/bets', { method: 'POST', body: JSON.stringify({ market_id, group_id, side, amount }) })
