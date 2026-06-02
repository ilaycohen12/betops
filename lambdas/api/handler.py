def lambda_handler(event, context):
    html = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>BetOps</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0f0f13;
      color: #f0f0f0;
      min-height: 100vh;
    }

    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 18px 32px;
      border-bottom: 1px solid #222;
    }
    .logo { font-size: 20px; font-weight: 700; color: #fff; letter-spacing: -0.5px; }
    .logo span { color: #7c6dfa; }
    .balance-pill {
      background: #1e1e2a;
      border: 1px solid #333;
      border-radius: 20px;
      padding: 6px 16px;
      font-size: 14px;
      color: #aaa;
    }
    .balance-pill b { color: #fff; }

    .markets {
      max-width: 700px;
      margin: 40px auto;
      padding: 0 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .section-title {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #555;
      margin-bottom: 4px;
    }

    .card {
      background: #16161f;
      border: 1px solid #222;
      border-radius: 14px;
      padding: 20px;
      transition: border-color 0.2s;
    }
    .card:hover { border-color: #7c6dfa44; }

    .card-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    }
    .card-question { font-size: 15px; font-weight: 600; line-height: 1.4; max-width: 75%; }
    .card-volume { font-size: 12px; color: #555; text-align: right; }
    .card-volume b { color: #888; }

    .options { display: flex; gap: 10px; }
    .opt-btn {
      flex: 1;
      padding: 10px;
      border-radius: 10px;
      border: none;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      transition: opacity 0.15s, transform 0.1s;
    }
    .opt-btn:active { transform: scale(0.97); }
    .opt-yes {
      background: #1a3a2a;
      color: #4ade80;
      border: 1px solid #2a5a3a;
    }
    .opt-yes:hover { background: #1f4a32; }
    .opt-no {
      background: #3a1a1a;
      color: #f87171;
      border: 1px solid #5a2a2a;
    }
    .opt-no:hover { background: #4a2020; }
    .opt-pct { display: block; font-size: 18px; margin-bottom: 2px; }
    .opt-label { font-size: 11px; opacity: 0.7; font-weight: 400; }

    /* Modal */
    .modal-overlay {
      display: none;
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.7);
      backdrop-filter: blur(4px);
      z-index: 100;
      align-items: center;
      justify-content: center;
    }
    .modal-overlay.open { display: flex; }
    .modal {
      background: #16161f;
      border: 1px solid #333;
      border-radius: 16px;
      padding: 28px;
      width: 340px;
    }
    .modal h3 { font-size: 15px; margin-bottom: 6px; }
    .modal .sub { font-size: 13px; color: #666; margin-bottom: 20px; }
    .modal input {
      width: 100%;
      background: #0f0f13;
      border: 1px solid #333;
      border-radius: 8px;
      padding: 10px 14px;
      color: #fff;
      font-size: 15px;
      margin-bottom: 14px;
      outline: none;
    }
    .modal input:focus { border-color: #7c6dfa; }
    .modal-btns { display: flex; gap: 10px; }
    .btn-cancel {
      flex: 1; padding: 10px; border-radius: 8px;
      background: #222; border: none; color: #aaa;
      cursor: pointer; font-size: 14px;
    }
    .btn-confirm {
      flex: 2; padding: 10px; border-radius: 8px;
      border: none; cursor: pointer; font-size: 14px;
      font-weight: 600;
    }
    .btn-yes-confirm { background: #4ade80; color: #0a1f14; }
    .btn-no-confirm  { background: #f87171; color: #1f0a0a; }

    .toast {
      position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
      background: #1e1e2a; border: 1px solid #333; border-radius: 10px;
      padding: 12px 20px; font-size: 13px; color: #ccc;
      opacity: 0; transition: opacity 0.3s;
      pointer-events: none; white-space: nowrap;
    }
    .toast.show { opacity: 1; }
  </style>
</head>
<body>

<header>
  <div class="logo">Bet<span>Ops</span></div>
  <div class="balance-pill">Balance: <b id="balance">$500.00</b></div>
</header>

<div class="markets">
  <div class="section-title">Open Markets</div>

  <div class="card" data-market="0">
    <div class="card-top">
      <div class="card-question">Will Israel reach a ceasefire deal before July 2025?</div>
      <div class="card-volume">Vol <b>$12.4k</b></div>
    </div>
    <div class="options">
      <button class="opt-btn opt-yes" onclick="openBet(0,'YES')">
        <span class="opt-pct" id="yes-0">67%</span>
        <span class="opt-label">Yes</span>
      </button>
      <button class="opt-btn opt-no" onclick="openBet(0,'NO')">
        <span class="opt-pct" id="no-0">33%</span>
        <span class="opt-label">No</span>
      </button>
    </div>
  </div>

  <div class="card" data-market="1">
    <div class="card-top">
      <div class="card-question">Will Man City finish top 4 this Premier League season?</div>
      <div class="card-volume">Vol <b>$8.1k</b></div>
    </div>
    <div class="options">
      <button class="opt-btn opt-yes" onclick="openBet(1,'YES')">
        <span class="opt-pct" id="yes-1">54%</span>
        <span class="opt-label">Yes</span>
      </button>
      <button class="opt-btn opt-no" onclick="openBet(1,'NO')">
        <span class="opt-pct" id="no-1">46%</span>
        <span class="opt-label">No</span>
      </button>
    </div>
  </div>

  <div class="card" data-market="2">
    <div class="card-top">
      <div class="card-question">Will GPT-5 be released before end of 2025?</div>
      <div class="card-volume">Vol <b>$21.9k</b></div>
    </div>
    <div class="options">
      <button class="opt-btn opt-yes" onclick="openBet(2,'YES')">
        <span class="opt-pct" id="yes-2">81%</span>
        <span class="opt-label">Yes</span>
      </button>
      <button class="opt-btn opt-no" onclick="openBet(2,'NO')">
        <span class="opt-pct" id="no-2">19%</span>
        <span class="opt-label">No</span>
      </button>
    </div>
  </div>
</div>

<!-- Bet Modal -->
<div class="modal-overlay" id="modal">
  <div class="modal">
    <h3 id="modal-title">Place Bet</h3>
    <div class="sub" id="modal-sub">Enter amount</div>
    <input type="number" id="bet-amount" placeholder="$0" min="1" />
    <div class="modal-btns">
      <button class="btn-cancel" onclick="closeModal()">Cancel</button>
      <button class="btn-confirm" id="confirm-btn" onclick="confirmBet()">Confirm</button>
    </div>
  </div>
</div>

<div class="toast" id="toast"></div>

<script>
  const markets = [
    { yes: 67, no: 33 },
    { yes: 54, no: 46 },
    { yes: 81, no: 19 },
  ];
  let balance = 500;
  let currentMarket = null;
  let currentSide = null;

  function openBet(marketIdx, side) {
    currentMarket = marketIdx;
    currentSide = side;
    const titles = [
      "Ceasefire deal before July?",
      "Man City top 4?",
      "GPT-5 before 2026?"
    ];
    document.getElementById('modal-title').textContent = titles[marketIdx];
    document.getElementById('modal-sub').textContent = `Betting: ${side}`;
    document.getElementById('bet-amount').value = '';
    const btn = document.getElementById('confirm-btn');
    btn.className = 'btn-confirm ' + (side === 'YES' ? 'btn-yes-confirm' : 'btn-no-confirm');
    btn.textContent = `Bet ${side}`;
    document.getElementById('modal').classList.add('open');
    setTimeout(() => document.getElementById('bet-amount').focus(), 100);
  }

  function closeModal() {
    document.getElementById('modal').classList.remove('open');
  }

  function confirmBet() {
    const amount = parseFloat(document.getElementById('bet-amount').value);
    if (!amount || amount <= 0) return;
    if (amount > balance) { showToast('Insufficient balance'); return; }

    balance -= amount;
    document.getElementById('balance').textContent = '$' + balance.toFixed(2);

    // Slightly shift odds
    const m = markets[currentMarket];
    if (currentSide === 'YES') {
      m.yes = Math.min(95, m.yes + Math.round(amount / 50));
      m.no = 100 - m.yes;
    } else {
      m.no = Math.min(95, m.no + Math.round(amount / 50));
      m.yes = 100 - m.no;
    }
    document.getElementById('yes-' + currentMarket).textContent = m.yes + '%';
    document.getElementById('no-' + currentMarket).textContent = m.no + '%';

    closeModal();
    showToast(`Bet placed: $${amount.toFixed(2)} on ${currentSide}`);
  }

  function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
  }

  document.getElementById('modal').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
  });
</script>
</body>
</html>"""
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "text/html"},
        "body": html,
    }
