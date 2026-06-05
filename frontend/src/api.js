const API = import.meta.env.VITE_API_URL || ''

export const TEST_USER = { id: '00000000-0000-0000-0000-000000000001', name: 'Alice' }

const call = async (path, opts = {}) => {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  })
  const body = await res.json()
  if (!res.ok) throw new Error(body.error || 'Request failed')
  return body
}

export const fetchGroups = (user_id) => call(`/groups?user_id=${user_id}`)
export const createGroup = (name, user_id) => call('/groups', { method: 'POST', body: JSON.stringify({ name, user_id }) })
export const joinGroup = (invite_code, user_id) => call('/groups/join', { method: 'POST', body: JSON.stringify({ invite_code, user_id }) })
export const fetchGroup = (group_id, user_id) => call(`/groups/${group_id}?user_id=${user_id}`)
export const createMarket = (group_id, data) => call(`/groups/${group_id}/markets`, { method: 'POST', body: JSON.stringify(data) })
export const resolveMarket = (market_id, result, user_id) => call(`/markets/${market_id}/resolve`, { method: 'POST', body: JSON.stringify({ result, user_id }) })
export const placeBet = ({ market_id, group_id, side, amount, user_id }) =>
  call('/bets', { method: 'POST', body: JSON.stringify({ user_id, market_id, group_id, side, amount }) })
