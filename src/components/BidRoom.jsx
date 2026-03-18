import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const TEAM_COLORS = {
  'Mumbai Indians':              '#004BA0',
  'Chennai Super Kings':         '#F9CD05',
  'Royal Challengers Bengaluru': '#EC1C24',
  'Kolkata Knight Riders':       '#3A225D',
  'Delhi Capitals':              '#00008B',
  'Rajasthan Royals':            '#FF4E9F',
  'Punjab Kings':                '#ED1B24',
  'Sunrisers Hyderabad':         '#F26522',
};

const BID_INC = (cur) => {
  if (cur < 1_000_000)  return 50_000;
  if (cur < 5_000_000)  return 100_000;
  if (cur < 10_000_000) return 250_000;
  return 500_000;
};

const AUCTION_SECS = 60;

const BidRoom = () => {
  const { playerId, franchiseId, passkey } = useParams();
  const navigate = useNavigate();

  const [player,        setPlayer]        = useState(null);
  const [franchise,     setFranchise]     = useState(null);
  const [allBids,       setAllBids]       = useState([]);
  const [allFranchises, setAllFranchises] = useState([]);
  const [bidAmount,     setBidAmount]     = useState('');
  const [loading,       setLoading]       = useState(true);
  const [bidLoading,    setBidLoading]    = useState(false);
  const [notification,  setNotification]  = useState(null);
  const [accessError,   setAccessError]   = useState('');
  const [countdown,     setCountdown]     = useState(AUCTION_SECS);
  const [isSold,        setIsSold]        = useState(false);

  const prevBidCountRef = useRef(0);
  const countdownRef    = useRef(null);
  const bidLogRef       = useRef(null);

  const notify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // ── START / RESET 60s COUNTDOWN ───────────────────────────────────────────
  const startCountdown = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setCountdown(AUCTION_SECS);
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(countdownRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  // ── FETCH ALL DATA — every 2s ─────────────────────────────────────────────
  const fetchAll = async () => {
    try {
      const [pRes, fRes, allFRes] = await Promise.all([
        fetch(`https://springboot-players-2.onrender.com/players/${playerId}`),
        fetch(`https://springboot-franchises.onrender.com/franchises/${franchiseId}`),
        fetch('https://springboot-franchises.onrender.com/franchises'),
      ]);
      const pData   = await pRes.json();
      const fData   = await fRes.json();
      const allData = await allFRes.json();

      setPlayer(pData);
      setFranchise(fData);
      setAllFranchises(Array.isArray(allData) ? allData : []);

      if (pData.status === 'SOLD') {
        setIsSold(true);
        if (countdownRef.current) clearInterval(countdownRef.current);
        setCountdown(0);
      }

      try {
        const bids = JSON.parse(pData.bidHistory || '[]');
        if (Array.isArray(bids)) {
          const sorted = [...bids].sort((a, b) =>
            b.amount !== a.amount ? b.amount - a.amount : a.timestamp - b.timestamp
          );
          setAllBids(sorted);

          if (bids.length > prevBidCountRef.current) {
            prevBidCountRef.current = bids.length;
            startCountdown();
          }
        }
      } catch { /* ignore */ }

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // ── Init — validate passkey from DB, then start polling ──────────────────
  useEffect(() => {
    const init = async () => {
      try {
        // ── KEY FIX: Fetch player from DB and validate passkey from sessionPasskeys
        // This works on ANY browser/device because the data lives in the database,
        // not in the admin's localStorage.
        const res    = await fetch(`https://springboot-players-2.onrender.com/players/${playerId}`);
        const player = await res.json();

        if (!player || !player.id) {
          setAccessError('Player not found.');
          setLoading(false);
          return;
        }

        // Parse sessionPasskeys from the player record
        let keys = {};
        try { keys = JSON.parse(player.sessionPasskeys || '{}'); } catch { keys = {}; }

        const validKey = keys[franchiseId];

        if (!validKey) {
          setAccessError('No active bidding session for this player.');
          setLoading(false);
          return;
        }

        if (validKey !== passkey) {
          setAccessError('Invalid passkey. This link may have expired.');
          setLoading(false);
          return;
        }

        // Access granted — set up the room
        setPlayer(player);
        startCountdown();

        // Start polling every 2s
        await fetchAll();
        const iv = setInterval(fetchAll, 2000);

        // Cleanup on unmount
        return () => {
          clearInterval(iv);
          if (countdownRef.current) clearInterval(countdownRef.current);
        };

      } catch (e) {
        setAccessError('Could not connect to the server. Please try again.');
        setLoading(false);
      }
    };

    const cleanup = init();
    return () => { cleanup.then(fn => fn && fn()); };
  }, []);

  // Auto scroll bid log
  useEffect(() => {
    if (bidLogRef.current) bidLogRef.current.scrollTop = bidLogRef.current.scrollHeight;
  }, [allBids]);

  // ── PLACE BID ─────────────────────────────────────────────────────────────
  const placeBid = async () => {
    if (!player || !franchise || isSold) return;

    const existingTopBid = allBids[0]?.amount || 0;
    const basePrice      = player.basicRemuneration || 0;
    const currentHighest = Math.max(existingTopBid, basePrice);
    const minBid         = currentHighest + BID_INC(currentHighest);
    const amount         = Number(bidAmount);

    if (!amount || amount < minBid) { notify(`Minimum bid is ${fmt(minBid)}`, 'error'); return; }
    if (amount > (franchise.networth || 0)) { notify('Insufficient purse!', 'error'); return; }

    setBidLoading(true);
    const bidTimestamp = Date.now();

    const newBid = {
      franchiseId,
      franchiseName: franchise.franchiseName,
      amount,
      timestamp:   bidTimestamp,
      timeDisplay: new Date(bidTimestamp).toLocaleTimeString('en-IN', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      msDisplay:   String(bidTimestamp).slice(-6),
    };

    try {
      // Get latest player to avoid race condition
      const latestRes = await fetch(`https://springboot-players-2.onrender.com/players/${playerId}`);
      const latest    = await latestRes.json();

      if (latest.status === 'SOLD') {
        notify('This player has already been sold!', 'error');
        setBidLoading(false);
        return;
      }

      const existingBids = JSON.parse(latest.bidHistory || '[]');

      // Tie-break: same amount + earlier timestamp wins
      const sameBid = existingBids.find(b => b.amount === amount);
      if (sameBid && sameBid.timestamp < bidTimestamp) {
        notify(`${sameBid.franchiseName} already bid ${fmt(amount)} — they were ${bidTimestamp - sameBid.timestamp}ms earlier!`, 'error');
        setBidLoading(false);
        return;
      }

      const updatedBids = [...existingBids, newBid];

      const topBid = updatedBids.reduce((best, b) => {
        if (!best) return b;
        if (b.amount > best.amount) return b;
        if (b.amount === best.amount && b.timestamp < best.timestamp) return b;
        return best;
      }, null);

      // ── Write bid to DB — AdminDashboard polls this every 2s ─────────────
      await fetch(`https://springboot-players-2.onrender.com/players/${playerId}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...latest,
          soldPrice:  topBid.amount,       // live top bid tracker
          boughtBy:   topBid.franchiseName,
          status:     'AVAILABLE',          // stays AVAILABLE until admin finalizes
          bidHistory: JSON.stringify(updatedBids),
          // sessionPasskeys is preserved from latest — don't overwrite it
          sessionPasskeys: latest.sessionPasskeys,
        }),
      });

      notify(`✅ Bid of ${fmt(amount)} placed!`);
      setBidAmount('');
      fetchAll();

    } catch (e) {
      notify('Bid failed. Try again.', 'error');
      console.error(e);
    } finally {
      setBidLoading(false);
    }
  };

  // ── DERIVED ───────────────────────────────────────────────────────────────
  const topBid      = allBids[0] || null;
  const isLeading   = topBid?.franchiseName === franchise?.franchiseName;
  const leaderColor = TEAM_COLORS[topBid?.franchiseName] || '#3B82F6';
  const currentBid  = topBid?.amount || player?.basicRemuneration || 0;
  const nextMin     = currentBid + BID_INC(currentBid);
  const myBids      = allBids.filter(b => b.franchiseId === franchiseId);

  const cdColor = countdown > 30
    ? 'border-green-400 bg-green-400/10 text-green-400'
    : countdown > 10
    ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400'
    : 'border-red-400 bg-red-400/10 text-red-400';
  const cdPulse = countdown <= 10 && countdown > 0;

  // ── ACCESS ERROR ──────────────────────────────────────────────────────────
  if (!loading && accessError) {
    return (
      <div className="min-h-screen bg-[#04091c] flex items-center justify-center p-6">
        <style>{`.font-bc{font-family:'Barlow Condensed',sans-serif}`}</style>
        <div className="text-center max-w-sm">
          <div className="text-7xl mb-5">🔒</div>
          <h1 className="font-bc text-3xl font-black text-red-400 mb-3">ACCESS DENIED</h1>
          <p className="text-white/50 text-sm mb-6">{accessError}</p>
          <button onClick={() => navigate('/')} className="font-bc font-black text-sm tracking-widest text-white bg-blue-600 px-8 py-3 rounded-xl border-0 cursor-pointer">
            GO HOME
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#04091c] flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=Barlow:wght@400;500;600&display=swap');
        .font-bc{font-family:'Barlow Condensed',sans-serif}
        .font-b{font-family:'Barlow',sans-serif}
        @keyframes slideIn{from{transform:translateY(-14px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes livePulse{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes cdPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
      `}</style>

      <div className="min-h-screen bg-[#020810] text-white font-b">

        {notification && (
          <div className={`fixed top-4 right-4 z-[9999] px-5 py-3 rounded-2xl text-sm font-bold shadow-2xl max-w-sm border ${
            notification.type === 'success' ? 'bg-emerald-600 border-emerald-500' :
            notification.type === 'error'   ? 'bg-red-600 border-red-500' :
                                              'bg-blue-600 border-blue-500'
          }`} style={{ animation: 'slideIn .3s ease' }}>
            {notification.msg}
          </div>
        )}

        {/* Header */}
        <div className="bg-[#04091c]/90 backdrop-blur-xl border-b border-white/[.06] px-5 py-4 flex items-center justify-between gap-4 flex-wrap sticky top-0 z-50">
          <div>
            <p className="font-bc text-[10px] text-white/30 tracking-[3px] mb-0.5">FRANCHISE BID ROOM</p>
            <h1 className="font-bc text-2xl font-black text-white leading-none">
              {franchise?.franchiseName || 'Loading…'}
            </h1>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-right">
              <p className="font-bc text-[10px] text-white/30 tracking-[2px]">PURSE</p>
              <p className="font-bc text-xl font-black text-yellow-400">{fmt(franchise?.networth)}</p>
            </div>
            {!isSold && (
              <div className={`font-bc font-black text-xl px-4 py-2 rounded-xl border-2 ${cdColor}`}
                style={cdPulse ? { animation: 'cdPulse .6s ease-in-out infinite' } : {}}>
                ⏱ {countdown}s
              </div>
            )}
          </div>
        </div>

        {/* SOLD banner */}
        {isSold && (
          <div className="bg-emerald-500/15 border-b-2 border-emerald-400/40 text-center py-4">
            <p className="font-bc text-2xl font-black text-emerald-400">
              🏆 {player?.name} SOLD to {player?.boughtBy} for {fmt(player?.soldPrice)}
            </p>
          </div>
        )}

        <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">

          {/* ══ LEFT COLUMN ══ */}
          <div className="flex-1 flex flex-col gap-5">

            {/* Player card */}
            <div className="bg-white/[.03] border border-white/[.08] rounded-2xl p-6">
              <p className="font-bc text-[10px] text-white/30 tracking-[3px] mb-3">ON THE BLOCK</p>
              <h2 className="font-bc text-[clamp(28px,5vw,48px)] font-black text-white leading-none mb-1">
                {player?.name || 'Loading…'}
              </h2>
              <p className="font-b text-sm text-white/40">{player?.position} · {player?.country}</p>
              <div className="mt-3 inline-flex items-center gap-1.5 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-1.5">
                <span className="font-bc text-[10px] text-amber-400/70 tracking-[2px]">BASE PRICE</span>
                <span className="font-bc text-sm font-black text-amber-400">{fmt(player?.basicRemuneration)}</span>
              </div>
            </div>

            {/* Current highest bid */}
            <div className={`rounded-2xl p-6 border-2 text-center ${isSold ? 'border-emerald-400/40 bg-emerald-400/5' : 'border-white/[.08] bg-white/[.03]'}`}>
              <p className="font-bc text-[10px] text-white/30 tracking-[3px] mb-2">CURRENT HIGHEST BID</p>
              <div className="font-bc text-[clamp(36px,7vw,60px)] font-black text-yellow-400 tracking-tight leading-none mb-3">
                {fmt(currentBid)}
              </div>
              {topBid ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: leaderColor }} />
                  <span className={`font-bc text-xl font-black ${isLeading ? 'text-green-400' : 'text-white'}`}>
                    {isLeading ? '✅ YOU ARE LEADING!' : topBid.franchiseName}
                  </span>
                </div>
              ) : (
                <p className="text-white/30 text-sm">No bids yet — be the first!</p>
              )}
            </div>

            {/* Bid form */}
            {!isSold && (
              <div className="bg-white/[.03] border border-white/[.08] rounded-2xl p-6">
                <p className="font-bc text-[10px] text-white/30 tracking-[3px] mb-4">PLACE YOUR BID</p>

                <div className="flex gap-2 flex-wrap mb-3">
                  {[nextMin, nextMin + BID_INC(nextMin), nextMin + BID_INC(nextMin) * 2].map(amt => (
                    <button key={amt} onClick={() => setBidAmount(String(amt))}
                      className={`font-bc font-black text-sm tracking-wide px-4 py-2.5 rounded-xl border transition-all cursor-pointer ${
                        String(bidAmount) === String(amt)
                          ? 'bg-blue-500/20 border-blue-400/60 text-blue-300'
                          : 'bg-white/[.04] border-white/[.1] text-white/70 hover:border-blue-400/40 hover:text-white'
                      }`}>
                      {fmt(amt)}
                    </button>
                  ))}
                </div>

                <p className="font-b text-[11px] text-white/25 mb-3">
                  Min: <span className="text-yellow-400 font-bold">{fmt(nextMin)}</span>
                  &nbsp;· Purse: <span className="text-green-400 font-bold">{fmt(franchise?.networth)}</span>
                </p>

                <div className="flex gap-3">
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={e => setBidAmount(e.target.value)}
                    placeholder={`Min ${fmt(nextMin)}`}
                    onKeyDown={e => e.key === 'Enter' && placeBid()}
                    className="flex-1 bg-white/[.05] border border-white/[.12] rounded-xl px-4 py-3.5 text-white text-xl font-bc font-black outline-none focus:border-yellow-400/60 transition-all"
                  />
                  <button onClick={placeBid} disabled={bidLoading || !bidAmount}
                    className={`font-bc font-black text-sm tracking-[2px] text-white border-0 px-6 rounded-xl transition-all ${
                      bidLoading || !bidAmount
                        ? 'bg-blue-800/40 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-500 to-blue-800 cursor-pointer hover:-translate-y-0.5 shadow-[0_4px_16px_rgba(59,130,246,0.35)]'
                    }`}>
                    {bidLoading
                      ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full" style={{ animation: 'spin .7s linear infinite' }} />
                      : '⚡ BID'}
                  </button>
                </div>

                <p className="font-b text-[11px] text-white/20 mt-2 text-center">
                  Same amount? Earliest bid (ms) wins the tie
                </p>
              </div>
            )}

            {/* My bids */}
            {myBids.length > 0 && (
              <div className="bg-white/[.03] border border-white/[.08] rounded-2xl p-5">
                <p className="font-bc text-[10px] text-white/30 tracking-[3px] mb-3">YOUR BID HISTORY</p>
                {myBids.map((b, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-white/[.05] last:border-0">
                    <div>
                      <span className="font-bc font-black text-base text-white">{fmt(b.amount)}</span>
                      <span className="font-b text-[11px] text-white/30 ml-2">{b.timeDisplay}</span>
                    </div>
                    <span className="font-b text-[10px] text-white/20 font-mono">ms:{b.msDisplay}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ══ RIGHT COLUMN ══ */}
          <div className="w-full lg:w-[320px] flex flex-col gap-5">

            {/* Live bid log */}
            <div className="bg-white/[.03] border border-white/[.08] rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[.06] flex items-center justify-between">
                <p className="font-bc text-[10px] text-white/30 tracking-[3px]">
                  LIVE BIDS {allBids.length > 0 && `(${allBids.length})`}
                </p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full" style={{ animation: 'livePulse 1.2s ease-in-out infinite' }} />
                  <span className="font-bc text-[10px] text-white/30 tracking-[2px]">LIVE · 2s</span>
                </div>
              </div>

              <div ref={bidLogRef} className="overflow-y-auto p-3 flex flex-col gap-1.5" style={{ maxHeight: 360 }}>
                {allBids.length === 0 ? (
                  <div className="text-center py-10 text-white/20 text-sm font-bc">No bids yet — be the first!</div>
                ) : allBids.map((b, i) => {
                  const isMe  = b.franchiseId === franchiseId;
                  const isTop = i === 0;
                  const tc    = TEAM_COLORS[b.franchiseName] || '#3B82F6';
                  return (
                    <div key={i} className={`flex items-start gap-3 px-3 py-2.5 rounded-xl border ${
                      isTop ? 'bg-yellow-400/[.08] border-yellow-400/30'
                      : isMe ? 'bg-blue-500/[.08] border-blue-500/20'
                             : 'bg-white/[.02] border-white/[.05]'
                    }`}>
                      <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: tc }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-bc text-sm font-bold ${isMe ? 'text-blue-300' : 'text-white'}`}>
                            {isMe ? `YOU (${b.franchiseName})` : b.franchiseName}
                          </span>
                          {isTop && <span className="font-bc text-[9px] font-black text-yellow-400 bg-yellow-400/15 px-1.5 py-0.5 rounded">TOP</span>}
                        </div>
                        <div className="font-bc text-lg font-black text-yellow-400 leading-tight">{fmt(b.amount)}</div>
                        <div className="font-b text-[10px] text-white/25 font-mono">{b.timeDisplay}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Franchise purses */}
            <div className="bg-white/[.03] border border-white/[.08] rounded-2xl p-4">
              <p className="font-bc text-[10px] text-white/30 tracking-[3px] mb-3">FRANCHISE PURSES</p>
              {allFranchises.map(f => {
                const tc     = TEAM_COLORS[f.franchiseName] || '#3B82F6';
                const isMe   = f.id == franchiseId;
                const hasBid = allBids.some(b => b.franchiseName === f.franchiseName);
                return (
                  <div key={f.id} className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-1.5 last:mb-0"
                    style={{ background: isMe ? `${tc}18` : 'rgba(255,255,255,.02)', border: `1px solid ${isMe ? tc + '40' : 'rgba(255,255,255,.05)'}` }}>
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: tc }} />
                    <span className={`font-bc text-[13px] flex-1 ${isMe ? 'font-bold text-white' : 'text-white/60'}`}>
                      {f.franchiseName}
                      {isMe && <span className="text-[10px] text-white/25 ml-1">(YOU)</span>}
                      {hasBid && !isMe && <span className="font-bc text-[9px] text-yellow-400/70 ml-1">BID</span>}
                    </span>
                    <span className="font-bc text-sm font-black text-yellow-400">{fmt(f.networth)}</span>
                  </div>
                );
              })}
            </div>

            {/* Tie-break info */}
            <div className="bg-blue-500/[.06] border border-blue-500/20 rounded-2xl p-4">
              <p className="font-bc text-[10px] text-blue-400/70 tracking-[3px] mb-2">TIE-BREAK RULE</p>
              <p className="font-b text-sm text-white/50 leading-relaxed">
                Same bid amount? The franchise that bid <strong className="text-blue-300">first (milliseconds)</strong> wins.
              </p>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default BidRoom;