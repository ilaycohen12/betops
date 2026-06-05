const API = import.meta.env.VITE_API_URL || ''

// Hardcoded test user until auth is built
export const TEST_USER_ID = '00000000-0000-0000-0000-000000000001'

export async function fetchMarkets() {
  const res = await fetch(`${API}/markets`)
  if (!res.ok) throw new Error('Failed to fetch markets')
  return res.json()
}

export async function placeBet({ market_id, side, amount }) {
  const res = await fetch(`${API}/bets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: TEST_USER_ID, market_id, side, amount }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to place bet')
  }
  return res.json()
}
