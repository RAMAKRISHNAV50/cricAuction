import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

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

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [players,        setPlayers]        = useState([]);
  const [franchises,     setFranchises]     = useState([]);
  const [activePlayer,   setActivePlayer]   = useState(null);
  const [currentBid,     setCurrentBid]     = useState(0);
  const [leadingBidder,  setLeadingBidder]  = useState(null);
  const [bidLog,         setBidLog]         = useState([]);
  const [bidCount,       setBidCount]       = useState(0);
  const [countdown,      setCountdown]      = useState(0);
  const [auctionRunning, setAuctionRunning] = useState(false);
  const [soldList,       setSoldList]       = useState([]);
  const [view,           setView]           = useState('auction');
  const [loading,        setLoading]        = useState(true);
  const [finalizing,     setFinalizing]     = useState(false);
  const [notification,   setNotification]   = useState(null);

  // ─── Single source of truth ref — prevents ALL stale closure bugs ──────────
  const S = useRef({
    currentBid: 0, leadingBidder: null, franchises: [],
    activePlayer: null, auctionRunning: false,
    bidCount: 0, bidLog: [], finalizing: false,
  });

  const bidTimerRef = useRef(null);
  const cdTimerRef  = useRef(null);
  const logEndRef   = useRef(null);

  // Keep S in sync with state
  useEffect(() => { S.current.currentBid     = currentBid;     }, [currentBid]);
  useEffect(() => { S.current.leadingBidder  = leadingBidder;  }, [leadingBidder]);
  useEffect(() => { S.current.franchises     = franchises;     }, [franchises]);
  useEffect(() => { S.current.activePlayer   = activePlayer;   }, [activePlayer]);
  useEffect(() => { S.current.auctionRunning = auctionRunning; }, [auctionRunning]);
  useEffect(() => { S.current.bidCount       = bidCount;       }, [bidCount]);
  useEffect(() => { S.current.bidLog         = bidLog;         }, [bidLog]);
  useEffect(() => { S.current.finalizing     = finalizing;     }, [finalizing]);

  const notify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const addLog = useCallback((entry) => {
    setBidLog(prev => {
      const updated = [...prev.slice(-99), entry];
      S.current.bidLog = updated;
      return updated;
    });
    setTimeout(() => logEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
  }, []);

  // ─── FETCH ────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      const [pRes, fRes] = await Promise.all([
        fetch('https://springboot-players-2.onrender.com/players'),
        fetch('https://springboot-franchises.onrender.com/franchises'),
      ]);
      const pData = await pRes.json();
      const fData = await fRes.json();
      const pList = Array.isArray(pData) ? pData : [];
      const fList = Array.isArray(fData) ? fData : [];
      setPlayers(pList);
      setFranchises(fList);
      S.current.franchises = fList;
      setSoldList(pList.filter(p => p.status === 'SOLD'));
    } catch (e) {
      console.error(e);
      notify('Failed to fetch data', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const iv = setInterval(fetchAll, 5000);
    return () => clearInterval(iv);
  }, [fetchAll]);

  // ─── TIMERS ───────────────────────────────────────────────────────────────
  const stopTimers = useCallback(() => {
    if (bidTimerRef.current) { clearTimeout(bidTimerRef.current); bidTimerRef.current = null; }
    if (cdTimerRef.current)  { clearInterval(cdTimerRef.current); cdTimerRef.current  = null; }
  }, []);

  const startCountdown = useCallback((secs) => {
    if (cdTimerRef.current) clearInterval(cdTimerRef.current);
    setCountdown(secs);
    cdTimerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(cdTimerRef.current); cdTimerRef.current = null; return 0; }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // ─── FINALIZE — reads from S.current, never stale ─────────────────────────
  const finalizeAuction = useCallback(async () => {
    const { activePlayer, leadingBidder, currentBid, finalizing } = S.current;
    if (!activePlayer || !leadingBidder) { notify('No active bid to finalize!', 'error'); return; }
    if (finalizing) return;

    S.current.finalizing    = true;
    S.current.auctionRunning = false;
    setFinalizing(true);
    stopTimers();
    setAuctionRunning(false);

    try {
      const pRes = await fetch(`https://springboot-players-2.onrender.com/players/${activePlayer.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...activePlayer, status: 'SOLD', soldPrice: currentBid, boughtBy: leadingBidder.franchiseName }),
      });
      if (!pRes.ok) throw new Error('Player update failed');

      await fetch(`https://springboot-franchises.onrender.com/franchises/${leadingBidder.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...leadingBidder, networth: (leadingBidder.networth || 0) - currentBid }),
      });

      addLog({ type: 'sold', player: activePlayer.name, franchise: leadingBidder.franchiseName, amount: currentBid, time: new Date().toLocaleTimeString() });
      notify(`🏆 ${activePlayer.name} SOLD to ${leadingBidder.franchiseName} for ${fmt(currentBid)}!`);
      setSoldList(prev => [...prev, { ...activePlayer, soldPrice: currentBid, boughtBy: leadingBidder.franchiseName }]);

      // Reset all
      S.current.activePlayer = null;  setActivePlayer(null);
      S.current.leadingBidder= null;  setLeadingBidder(null);
      S.current.currentBid   = 0;     setCurrentBid(0);
      S.current.bidCount     = 0;     setBidCount(0);
      setCountdown(0);
      fetchAll();
    } catch (e) {
      notify('❌ Finalize failed: ' + e.message, 'error');
    } finally {
      S.current.finalizing = false;
      setFinalizing(false);
    }
  }, [stopTimers, addLog, fetchAll]);

  // ─── AUTO-BID ENGINE — reads ONLY from S.current, never stale ─────────────
  const scheduleNextBid = useCallback(() => {
    if (bidTimerRef.current) clearTimeout(bidTimerRef.current);

    const delay = 3500 + Math.random() * 3000; // 3.5 – 6.5 s random
    bidTimerRef.current = setTimeout(() => {
      const { auctionRunning, activePlayer, currentBid, leadingBidder, franchises, bidCount, finalizing } = S.current;

      if (!auctionRunning || !activePlayer || finalizing) return;

      // Avoid repeating the same recent bidders
      const recentBidders = new Set(S.current.bidLog.slice(-3).map(l => l.franchise));
      const eligible = franchises.filter(f =>
        f.franchiseName !== leadingBidder?.franchiseName &&
        !recentBidders.has(f.franchiseName) &&
        (f.networth || 0) > currentBid + BID_INC(currentBid)
      );

      if (!eligible.length) {
        // Nobody can bid → if there's a leading bid, finalize; else retry
        if (leadingBidder && bidCount >= 1) {
          finalizeAuction();
        } else {
          scheduleNextBid();
        }
        return;
      }

      const bidder   = eligible[Math.floor(Math.random() * eligible.length)];
      const newBid   = currentBid + BID_INC(currentBid);
      const newCount = bidCount + 1;

      // Write to ref first (sync), then state
      S.current.currentBid    = newBid;
      S.current.leadingBidder = bidder;
      S.current.bidCount      = newCount;

      setCurrentBid(newBid);
      setLeadingBidder(bidder);
      setBidCount(newCount);

      addLog({ type: 'bid', franchise: bidder.franchiseName, amount: newBid, time: new Date().toLocaleTimeString(), bidNumber: newCount });
      startCountdown(8);

      // Auto-finalize after 12 bids
      if (newCount >= 12) {
        setTimeout(() => finalizeAuction(), 2500);
      } else {
        scheduleNextBid();
      }
    }, delay);
  }, [addLog, startCountdown, finalizeAuction]);

  // ─── START AUCTION ────────────────────────────────────────────────────────
  const startAuction = useCallback((player) => {
    stopTimers();
    const base = player.basicRemuneration || 500000;

    S.current.activePlayer   = player;
    S.current.currentBid     = base;
    S.current.leadingBidder  = null;
    S.current.bidCount       = 0;
    S.current.bidLog         = [];
    S.current.auctionRunning = true;

    setActivePlayer(player);
    setCurrentBid(base);
    setLeadingBidder(null);
    setBidLog([]);
    setBidCount(0);
    setAuctionRunning(true);

    addLog({ type: 'start', player: player.name, base, time: new Date().toLocaleTimeString() });
    startCountdown(8);
    scheduleNextBid();
  }, [stopTimers, addLog, startCountdown, scheduleNextBid]);

  // ─── ADMIN RAISE BID ─────────────────────────────────────────────────────
  const adminRaiseBid = useCallback(() => {
    const { activePlayer, auctionRunning, currentBid, franchises, bidLog, bidCount } = S.current;
    if (!activePlayer || !auctionRunning) return;

    const newBid = currentBid + BID_INC(currentBid);
    const recentBidders = new Set(bidLog.slice(-2).map(l => l.franchise));
    const eligible = franchises.filter(f => !recentBidders.has(f.franchiseName) && (f.networth || 0) > newBid);

    if (!eligible.length) { notify('No franchise has enough budget!', 'error'); return; }

    const bidder   = eligible[Math.floor(Math.random() * eligible.length)];
    const newCount = bidCount + 1;

    S.current.currentBid    = newBid;
    S.current.leadingBidder = bidder;
    S.current.bidCount      = newCount;

    setCurrentBid(newBid);
    setLeadingBidder(bidder);
    setBidCount(newCount);

    addLog({ type: 'admin', franchise: bidder.franchiseName, amount: newBid, time: new Date().toLocaleTimeString(), bidNumber: newCount });
    startCountdown(8);
    if (bidTimerRef.current) clearTimeout(bidTimerRef.current);
    scheduleNextBid();
  }, [addLog, startCountdown, scheduleNextBid]);

  // ─── MARK UNSOLD ─────────────────────────────────────────────────────────
  const markUnsold = useCallback(async () => {
    const { activePlayer } = S.current;
    if (!activePlayer) return;
    stopTimers();
    S.current.auctionRunning = false; setAuctionRunning(false);
    try {
      await fetch(`https://springboot-players-2.onrender.com/players/${activePlayer.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...activePlayer, status: 'UNSOLD' }),
      });
      addLog({ type: 'unsold', player: activePlayer.name, time: new Date().toLocaleTimeString() });
      notify(`${activePlayer.name} marked as UNSOLD.`, 'info');
      S.current.activePlayer  = null; setActivePlayer(null);
      S.current.leadingBidder = null; setLeadingBidder(null);
      S.current.currentBid    = 0;    setCurrentBid(0);
      S.current.bidCount      = 0;    setBidCount(0);
      setCountdown(0);
      fetchAll();
    } catch { notify('Failed to mark unsold', 'error'); }
  }, [stopTimers, addLog, fetchAll]);

  // ─── FULL RESET ───────────────────────────────────────────────────────────
  const handleFullReset = async () => {
    if (!window.confirm('Reset entire auction? All squads cleared, budgets restored.')) return;
    stopTimers();
    S.current.auctionRunning = false; setAuctionRunning(false);
    S.current.activePlayer   = null;  setActivePlayer(null);
    setBidLog([]);
    setLoading(true);
    try {
      await fetch('https://springboot-franchises.onrender.com/franchises/reset-auction', { method: 'POST' });
      const pRes  = await fetch('https://springboot-players-2.onrender.com/players');
      const pList = await pRes.json();
      await Promise.all(pList.map(p =>
        fetch(`https://springboot-players-2.onrender.com/players/${p.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...p, status: 'AVAILABLE', soldPrice: 0, boughtBy: null }),
        })
      ));
      notify('✅ Auction fully reset!');
      fetchAll();
    } catch { notify('Reset failed', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => () => stopTimers(), [stopTimers]);

  // ─── DERIVED ──────────────────────────────────────────────────────────────
  const leaderColor      = leadingBidder ? (TEAM_COLORS[leadingBidder.franchiseName] || '#3B82F6') : '#3B82F6';
  const availablePlayers = players.filter(p => p.status === 'AVAILABLE' || p.status === 'UNSOLD');
  const cdColor = countdown > 4
    ? 'border-blue-400 bg-blue-500/10 text-blue-400'
    : countdown > 2
    ? 'border-yellow-400 bg-yellow-500/10 text-yellow-400'
    : 'border-red-400 bg-red-500/10 text-red-400';

  const navItems = [
    { k: 'auction', l: '🔨 Auction' },
    { k: 'sold',    l: '🏆 Sold'    },
    { k: 'teams',   l: '🏟️ Teams'   },
    { k: 'reset',   l: '☢️ Reset'   },
  ];

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col">
      <style>{`
        @keyframes marquee  { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes fadeDown { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
        .notif-anim { animation: fadeDown 0.3s ease forwards; }
      `}</style>

      {/* Notification */}
      {notification && (
        <div className={`notif-anim fixed top-4 right-4 z-[9999] px-5 py-3 rounded-2xl text-sm font-bold uppercase tracking-wider shadow-2xl max-w-sm border ${
          notification.type === 'success' ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 border-emerald-500' :
          notification.type === 'error'   ? 'bg-gradient-to-r from-red-600 to-red-700 border-red-500' :
          'bg-gradient-to-r from-blue-600 to-blue-700 border-blue-500'
        }`}>
          {notification.msg}
        </div>
      )}

      {/* ── NAV ─────────────────────────────────────────────────────────────── */}
      <nav className="bg-slate-900/95 backdrop-blur-xl border-b border-slate-800/50 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-50 shadow-xl">
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center shadow-lg shrink-0">
            <span className="text-base">⚙️</span>
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black tracking-wider leading-none">CRIC<span className="text-amber-400">AUCTION</span></h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold leading-none mt-0.5">ADMIN PANEL</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 justify-center">
          {navItems.map(({ k, l }) => (
            <button key={k} onClick={() => setView(k)}
              className={`font-bold text-xs uppercase tracking-wide px-3 py-2 rounded-xl border-2 transition-all flex items-center gap-1.5 ${
                view === k
                  ? 'text-amber-400 bg-amber-400/10 border-amber-400 shadow-lg shadow-amber-400/20'
                  : 'text-slate-400 border-slate-700/50 hover:text-slate-200 hover:border-slate-600 hover:bg-slate-800/50'
              }`}>
              <span>{l.split(' ')[0]}</span>
              <span className="hidden sm:inline">{l.split(' ').slice(1).join(' ')}</span>
            </button>
          ))}
        </div>

        <button onClick={() => { localStorage.clear(); navigate('/'); }}
          className="font-bold text-xs uppercase tracking-wide text-red-400 bg-red-500/10 border-2 border-red-500/30 px-4 py-2 rounded-xl hover:bg-red-500 hover:text-white transition-all shrink-0">
          LOGOUT
        </button>
      </nav>

      {/* Sold Ticker */}
      {soldList.length > 0 && view === 'auction' && (
        <div className="bg-slate-800/50 border-b border-amber-400/20 py-2 overflow-hidden">
          <div className="flex whitespace-nowrap" style={{ animation: 'marquee 25s linear infinite' }}>
            {[...soldList, ...soldList].map((s, i) => (
              <span key={i} className="px-6 text-xs sm:text-sm text-slate-300 inline-flex items-center gap-2 shrink-0">
                🏏 <strong className="text-amber-400">{s.name}</strong>
                <span className="text-slate-400">→</span>
                <span className="font-bold text-emerald-400">{fmt(s.soldPrice)}</span>
                <span className="text-slate-500">({s.boughtBy})</span>
                <span className="text-slate-600 mx-2">•</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── MAIN ─────────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: Player Pool */}
        {view === 'auction' && (
          <div className={`w-full sm:w-80 lg:w-96 bg-slate-900/50 border-r border-slate-800/30 flex flex-col ${activePlayer ? 'hidden sm:flex' : 'flex'}`}>
            <div className="px-5 py-4 border-b border-slate-800/50">
              <p className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-1">PLAYER POOL</p>
              <h2 className="text-2xl font-black">{availablePlayers.length} <span className="text-base font-normal text-slate-400 ml-1">available</span></h2>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {loading ? (
                <div className="flex justify-center items-center h-48">
                  <div className="w-10 h-10 border-4 border-slate-700 border-t-blue-400 rounded-full animate-spin" />
                </div>
              ) : availablePlayers.length === 0 ? (
                <div className="text-center py-16 text-slate-400 font-bold">All players sold!</div>
              ) : availablePlayers.map(p => {
                const isActive = activePlayer?.id === p.id;
                return (
                  <div key={p.id} onClick={() => !auctionRunning && startAuction(p)}
                    className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-200 ${
                      isActive        ? 'bg-amber-500/10 border-amber-400 shadow-lg shadow-amber-400/20 scale-[1.02]' :
                      auctionRunning  ? 'opacity-40 cursor-not-allowed border-slate-800/20 bg-slate-800/10' :
                                        'border-slate-800/20 bg-slate-800/10 hover:border-slate-700/50 hover:bg-slate-800/30 cursor-pointer hover:scale-[1.01]'
                    }`}>
                    <div className="flex-1 min-w-0 pr-3">
                      <div className="text-base font-black truncate">{p.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{p.position} · {p.country}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-black text-amber-400">{fmt(p.basicRemuneration)}</div>
                      {p.status === 'UNSOLD' && <div className="text-[10px] font-bold text-red-400 uppercase">UNSOLD</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Right: Content */}
        <div className={`flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 ${!activePlayer && view === 'auction' ? 'hidden sm:block' : ''}`}>

          {/* ── AUCTION ── */}
          {view === 'auction' && (
            <>
              {!activePlayer ? (
                <div className="flex flex-col items-center justify-center min-h-[500px] text-center gap-6 p-4">
                  <div className="text-8xl">🔨</div>
                  <h1 className="text-4xl sm:text-6xl font-black text-slate-300 tracking-tight">SELECT A PLAYER</h1>
                  <p className="text-lg text-slate-400 max-w-md">Click any player from the left panel to start live bidding.</p>
                </div>
              ) : (
                <div className="max-w-4xl mx-auto space-y-6">

                  {/* Player spotlight */}
                  <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/30 rounded-3xl p-6 sm:p-8 shadow-2xl">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
                      <div className="flex-1">
                        <button onClick={() => { stopTimers(); S.current.auctionRunning = false; setAuctionRunning(false); S.current.activePlayer = null; setActivePlayer(null); }}
                          className="sm:hidden text-xs font-bold text-amber-400 mb-3 flex items-center gap-1">
                          ← BACK TO LIST
                        </button>
                        <p className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-2">ON AUCTION BLOCK</p>
                        <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-2 break-words">{activePlayer.name}</h1>
                        <p className="text-base sm:text-lg text-slate-400">
                          🌏 {activePlayer.country} · {activePlayer.position} · Base: <span className="text-amber-400 font-bold">{fmt(activePlayer.basicRemuneration)}</span>
                        </p>
                      </div>
                      <div className="flex gap-3 flex-wrap">
                        {auctionRunning && (
                          <button onClick={adminRaiseBid}
                            className="px-5 py-3 bg-blue-500/20 hover:bg-blue-500/30 border-2 border-blue-500/40 text-blue-300 font-bold uppercase tracking-wide rounded-xl transition-all hover:scale-105">
                            ⬆ Raise Bid
                          </button>
                        )}
                        {auctionRunning && (
                          <button onClick={markUnsold}
                            className="px-5 py-3 bg-slate-800/50 hover:bg-slate-700/50 border-2 border-slate-700 text-slate-300 font-bold uppercase tracking-wide rounded-xl transition-all hover:scale-105">
                            Mark Unsold
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { l: 'T20 Runs', v: activePlayer.t20Runs       || 0     },
                        { l: 'ODI Runs', v: activePlayer.odiRuns        || 0     },
                        { l: 'Avg',      v: activePlayer.battingAverage || 'N/A' },
                        { l: 'Wickets',  v: activePlayer.wickets        || 0     },
                      ].map(s => (
                        <div key={s.l} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 text-center">
                          <div className="text-2xl sm:text-3xl font-black text-amber-400">{s.v}</div>
                          <div className="text-xs uppercase tracking-wider text-slate-400 font-bold mt-1">{s.l}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bid + Countdown */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Current bid panel */}
                    <div className={`rounded-3xl p-6 sm:p-8 text-center border-4 shadow-2xl backdrop-blur-xl transition-all duration-300 ${
                      auctionRunning
                        ? 'bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-yellow-500/10 border-amber-400/50 shadow-amber-400/20'
                        : 'bg-slate-900/50 border-slate-800/30'
                    }`}>
                      <p className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-4">CURRENT BID</p>
                      <div className="text-5xl sm:text-6xl font-black text-amber-400 leading-none mb-6">{fmt(currentBid)}</div>

                      {/* Leading bidder — name always shown in full */}
                      {leadingBidder ? (
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-4 h-4 rounded-full shrink-0 shadow-lg ring-2 ring-white/20" style={{ backgroundColor: leaderColor }} />
                          <span className="text-xl sm:text-2xl font-black text-white">{leadingBidder.franchiseName}</span>
                        </div>
                      ) : (
                        <p className="text-lg text-slate-500 font-bold">Waiting for first bid…</p>
                      )}

                      {bidCount > 0 && (
                        <p className="text-sm text-slate-400 mt-3 font-mono">Bid #{bidCount}</p>
                      )}
                    </div>

                    {/* Countdown + SOLD */}
                    <div className="bg-slate-900/50 border border-slate-800/30 rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center gap-5 backdrop-blur-xl shadow-2xl">
                      <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 flex items-center justify-center shadow-2xl transition-all duration-300 ${cdColor}`}>
                        <span className="text-4xl sm:text-5xl font-black">{auctionRunning ? countdown : '—'}</span>
                      </div>
                      <p className="text-xs uppercase tracking-wider text-slate-400 font-bold text-center">
                        {auctionRunning ? 'Seconds to Next Bid' : 'Auction Paused'}
                      </p>
                      {leadingBidder && auctionRunning && (
                        <button onClick={finalizeAuction} disabled={finalizing}
                          className={`w-full sm:w-auto font-black text-lg uppercase tracking-widest px-10 py-4 rounded-2xl border-0 shadow-2xl transition-all duration-200 flex items-center justify-center gap-3 ${
                            finalizing
                              ? 'bg-red-500/30 text-slate-300 cursor-not-allowed'
                              : 'bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white shadow-red-500/40 hover:-translate-y-1 hover:scale-105'
                          }`}>
                          {finalizing
                            ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Finalizing...</>
                            : '🔨 SOLD!'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ── BID LOG — fixed icon+name alignment ── */}
                  <div className="bg-slate-900/50 border border-slate-800/30 rounded-3xl shadow-2xl backdrop-blur-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-800/50 bg-slate-900/80">
                      <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">LIVE BID LOG</p>
                    </div>
                    <div className="overflow-y-auto p-4 space-y-2" style={{ maxHeight: 320 }}>
                      {bidLog.length === 0 ? (
                        <div className="text-center py-10 text-slate-500 font-bold">Auction started — bids will appear here</div>
                      ) : (
                        bidLog.map((entry, i) => (
                          <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${
                            entry.type === 'sold'   ? 'bg-emerald-500/10 border-emerald-400/30' :
                            entry.type === 'start'  ? 'bg-blue-500/10   border-blue-400/30'    :
                            entry.type === 'unsold' ? 'bg-red-500/10    border-red-400/30'     :
                            entry.type === 'admin'  ? 'bg-purple-500/10 border-purple-400/30'  :
                                                      'bg-slate-800/30   border-slate-700/30'
                          }`}>
                            {/* Fixed-width icon column — prevents name misalignment */}
                            <span className="w-7 text-xl text-center leading-none mt-0.5 shrink-0">
                              {entry.type === 'bid'    ? '💰' :
                               entry.type === 'sold'   ? '🏆' :
                               entry.type === 'start'  ? '🔨' :
                               entry.type === 'admin'  ? '⬆️' : '❌'}
                            </span>

                            {/* Text — full names, never truncated */}
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-semibold leading-snug break-words ${
                                entry.type === 'sold'   ? 'text-emerald-400' :
                                entry.type === 'unsold' ? 'text-red-400'     : 'text-white'
                              }`}>
                                {entry.type === 'start' && <>Auction started for <strong className="text-amber-400">{entry.player}</strong> — Base: <span className="text-amber-400">{fmt(entry.base)}</span></>}
                                {(entry.type === 'bid' || entry.type === 'admin') && (
                                  <><strong className="text-white">{entry.franchise}</strong> bid <span className="text-amber-400 font-bold">{fmt(entry.amount)}</span>
                                  {entry.bidNumber && <span className="text-slate-500 font-mono text-xs ml-1.5">#{entry.bidNumber}</span>}</>
                                )}
                                {entry.type === 'sold' && (
                                  <><strong className="text-emerald-400">{entry.player}</strong> SOLD to <strong className="text-white">{entry.franchise}</strong> for <span className="text-emerald-400 font-bold">{fmt(entry.amount)}</span></>
                                )}
                                {entry.type === 'unsold' && <><strong className="text-red-400">{entry.player}</strong> marked UNSOLD</>}
                              </p>
                            </div>

                            {/* Timestamp */}
                            <span className="text-xs text-slate-500 font-mono shrink-0 whitespace-nowrap mt-0.5">{entry.time}</span>
                          </div>
                        ))
                      )}
                      <div ref={logEndRef} />
                    </div>
                  </div>

                </div>
              )}
            </>
          )}

          {/* ── SOLD VIEW ── */}
          {view === 'sold' && (
            <div className="max-w-6xl mx-auto">
              <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-8 flex items-center gap-4 flex-wrap">
                🏆 Sold Players <span className="text-xl text-slate-400 font-normal">({soldList.length})</span>
              </h2>
              {soldList.length === 0 ? (
                <div className="text-center py-24 text-slate-400 text-2xl font-bold">No players sold yet</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {soldList.map(p => {
                    const tc = TEAM_COLORS[p.boughtBy] || '#3B82F6';
                    return (
                      <div key={p.id} className="rounded-2xl p-5 hover:scale-105 transition-all shadow-xl border"
                        style={{ background: `linear-gradient(135deg,${tc}20,rgba(255,255,255,0.03))`, borderColor: `${tc}40` }}>
                        <div className="text-lg font-black mb-1 break-words">{p.name}</div>
                        <div className="text-xs text-slate-400 mb-3">{p.position} · {p.country}</div>
                        <div className="text-2xl font-black text-emerald-400">{fmt(p.soldPrice)}</div>
                        <div className="text-sm font-bold mt-1" style={{ color: tc }}>{p.boughtBy}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── TEAMS VIEW ── */}
          {view === 'teams' && (
            <div className="max-w-6xl mx-auto">
              <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-8">🏟️ Franchise Status</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {franchises.map(f => {
                  const tc    = TEAM_COLORS[f.franchiseName] || '#3B82F6';
                  const myP   = players.filter(p => p.boughtBy === f.franchiseName);
                  const spent = myP.reduce((a, p) => a + (p.soldPrice || 0), 0);
                  return (
                    <div key={f.id} className="rounded-2xl p-6 shadow-xl border hover:scale-[1.02] transition-all duration-200"
                      style={{ background: `linear-gradient(135deg,${tc}20,rgba(255,255,255,0.03))`, borderColor: `${tc}40` }}>
                      <div className="flex justify-between items-start mb-4 gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-xl font-black break-words">{f.franchiseName}</div>
                          <div className="text-sm text-slate-400 mt-0.5 truncate">{f.ownerName || f.name}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">Purse Left</p>
                          <div className="text-2xl font-black text-amber-400">{fmt(f.networth)}</div>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm text-slate-400">
                        <span>Players: <strong className="text-white">{myP.length}</strong></span>
                        <span>Spent: <strong className="text-red-400">{fmt(spent)}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── RESET VIEW ── */}
          {view === 'reset' && (
            <div className="max-w-lg mx-auto mt-16 text-center space-y-6 px-4">
              <div className="text-7xl">☢️</div>
              <h2 className="text-4xl sm:text-6xl font-black text-red-400 tracking-tight">FULL RESET</h2>
              <p className="text-lg text-slate-400 leading-relaxed">
                Clears all squads, resets all franchise purses, and marks all players as AVAILABLE.
                <strong className="text-red-400 block mt-3 text-xl">Cannot be undone.</strong>
              </p>
              <div className="bg-red-500/10 border-2 border-red-500/30 rounded-3xl p-8">
                <button onClick={handleFullReset} disabled={loading}
                  className={`w-full font-black text-xl uppercase tracking-widest py-6 rounded-2xl border-0 shadow-2xl transition-all flex items-center justify-center gap-4 ${
                    loading
                      ? 'bg-red-500/30 text-slate-300 cursor-not-allowed'
                      : 'bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white shadow-red-500/50 hover:-translate-y-1 hover:scale-105'
                  }`}>
                  {loading
                    ? <><div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /> Resetting...</>
                    : '☢️ CONFIRM FULL RESET'}
                </button>
              </div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Only accessible by auction administrator</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;