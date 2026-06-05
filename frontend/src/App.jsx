import React, { useEffect, useState } from 'react'
import MarketCard from './components/MarketCard'
import BetModal from './components/BetModal'
import { fetchMarkets } from './api'

export default function App() {
  const [markets, setMarkets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeBet, setActiveBet] = useState(null) // { market, side }

  const loadMarkets = async () => {
    try {
      const data = await fetchMarkets()
      setMarkets(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadMarkets() }, [])

  const handleBetClick = (market, side) => setActiveBet({ market, side })

  const handleBetDone = () => {
    setActiveBet(null)
    loadMarkets()
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0d0f12' }}>
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 32px', borderBottom: '1px solid #1e2128',
      }}>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.5px' }}>
          Bet<span style={{ color: '#6366f1' }}>Ops</span>
        </div>
        <div style={{
          background: '#1a1d23', border: '1px solid #2a2d35', borderRadius: 20,
          padding: '6px 16px', fontSize: 13, color: '#9ca3af',
        }}>
          Alice
        </div>
      </header>

      <main style={{ maxWidth: 780, margin: '40px auto', padding: '0 20px' }}>
        <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, color: '#4b5563', marginBottom: 16 }}>
          Open Markets
        </div>

        {loading && <div style={{ color: '#6b7280', textAlign: 'center', marginTop: 60 }}>Loading markets...</div>}
        {error && <div style={{ color: '#f87171', textAlign: 'center', marginTop: 60 }}>{error}</div>}
        {!loading && !error && markets.length === 0 && (
          <div style={{ color: '#6b7280', textAlign: 'center', marginTop: 60 }}>No open markets yet.</div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {markets.map(m => (
            <MarketCard key={m.id} market={m} onBet={handleBetClick} />
          ))}
        </div>
      </main>

      {activeBet && (
        <BetModal
          market={activeBet.market}
          side={activeBet.side}
          onClose={() => setActiveBet(null)}
          onDone={handleBetDone}
        />
      )}
    </div>
  )
}
