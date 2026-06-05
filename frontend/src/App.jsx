import React, { useEffect, useState, useCallback } from 'react'
import MarketCard from './components/MarketCard'
import BetModal from './components/BetModal'
import { fetchMarkets } from './api'

function SkeletonCard() {
  return (
    <div style={{ background: '#13161b', border: '1px solid #1e2128', borderRadius: 14, padding: 20 }}>
      <div style={{ height: 16, background: '#1e2128', borderRadius: 6, width: '70%', marginBottom: 12 }} />
      <div style={{ height: 12, background: '#1e2128', borderRadius: 6, width: '40%', marginBottom: 20 }} />
      <div style={{ height: 6, background: '#1e2128', borderRadius: 999, marginBottom: 14 }} />
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1, height: 56, background: '#1e2128', borderRadius: 10 }} />
        <div style={{ flex: 1, height: 56, background: '#1e2128', borderRadius: 10 }} />
      </div>
    </div>
  )
}

function Toast({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div style={{
      position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
      background: '#1a1d23', border: '1px solid #2a2d35', borderRadius: 10,
      padding: '12px 20px', fontSize: 14, color: '#d1d5db',
      boxShadow: '0 4px 24px rgba(0,0,0,0.4)', zIndex: 200,
      animation: 'fadeIn 0.2s ease',
    }}>
      {message}
    </div>
  )
}

export default function App() {
  const [markets, setMarkets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeBet, setActiveBet] = useState(null)
  const [toast, setToast] = useState(null)

  const loadMarkets = useCallback(async () => {
    try {
      const data = await fetchMarkets()
      setMarkets(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadMarkets() }, [loadMarkets])

  const handleBetDone = (msg) => {
    setActiveBet(null)
    setToast(msg)
    loadMarkets()
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0d0f12' }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateX(-50%) translateY(8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.4 } }
        * { animation-fill-mode: both; }
      `}</style>

      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 32px', borderBottom: '1px solid #1e2128',
        position: 'sticky', top: 0, background: '#0d0f12', zIndex: 50,
      }}>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.5px' }}>
          Bet<span style={{ color: '#6366f1' }}>Ops</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 14, color: '#9ca3af' }}>
            Balance: <span style={{ color: '#f0f0f0', fontWeight: 600 }}>$500.00</span>
          </div>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: '#fff',
          }}>
            A
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 780, margin: '40px auto', padding: '0 20px' }}>
        <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, color: '#4b5563', marginBottom: 16 }}>
          Open Markets
        </div>

        {error && <div style={{ color: '#f87171', textAlign: 'center', marginTop: 60 }}>{error}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loading
            ? [1, 2, 3].map(i => <SkeletonCard key={i} />)
            : markets.length === 0
              ? <div style={{ color: '#6b7280', textAlign: 'center', marginTop: 60 }}>No open markets yet.</div>
              : markets.map(m => <MarketCard key={m.id} market={m} onBet={(market, side) => setActiveBet({ market, side })} />)
          }
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

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  )
}
