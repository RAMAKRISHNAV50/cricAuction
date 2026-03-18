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

const generatePasskey = (franchiseId, playerId) =>
  btoa(`${franchiseId}-${playerId}-${Date.now()}`).replace(/=/g, '').substring(0, 20);

const AUCTION_SECS = 60;

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [players,      setPlayers]      = useState([]);
  const [franchises,   setFranchises]   = useState([]);
  const [activePlayer, setActivePlayer] = useState(null);
  const [soldList,     setSoldList]     = useState([]);
  const [view,         setView]         = useState('auction');
  const [loading,      setLoading]      = useState(true);
  const [finalizing,   setFinalizing]   = useState(false);
  const [notification, setNotification] = useState(null);
  const [bidUrls,      setBidUrls]      = useState({});
  const [copiedUrl,    setCopiedUrl]    = useState('');

  const [liveBids,  setLiveBids]  = useState([]);
  const [topBid,    setTopBid]    = useState(null);
  const [countdown, setCountdown] = useState(0);

  const activePRef       = useRef(null);
  const topBidRef        = useRef(null);
  const finalizingRef    = useRef(false);
  const prevBidCountRef  = useRef(0);
  const countdownRef     = useRef(null);
  const autoSellRef      = useRef(null);
  const franchisesRef    = useRef([]);

  useEffect(() => { franchisesRef.current = franchises; }, [franchises]);

  const notify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 5000);
  };

  useEffect(() => { topBidRef.current = topBid; }, [topBid]);

  const stopTimers = useCallback(() => {
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    if (autoSellRef.current)  { clearTimeout(autoSellRef.current);   autoSellRef.current  = null; }
  }, []);

  // ── FINALIZE — auto or manual ─────────────────────────────────────────────
  const finalizeAuction = useCallback(async () => {
    if (finalizingRef.current) return;
    finalizingRef.current = true;
    setFinalizing(true);
    stopTimers();
    setCountdown(0);

    const ap  = activePRef.current;
    const top = topBidRef.current;

    if (!ap) { finalizingRef.current = false; setFinalizing(false); return; }

    try {
      if (!top) {
        // No bids → UNSOLD
        await fetch(`https://springboot-players-2.onrender.com/players/${ap.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...ap,
            status:          'UNSOLD',
            soldPrice:       0,
            boughtBy:        null,
            bidHistory:      '[]',
            sessionPasskeys: '{}',
          }),
        });
        notify(`⏱ Time up! ${ap.name} had no bids — marked UNSOLD.`, 'info');
      } else {
        // Sell to highest bidder
        const fRes   = await fetch('https://springboot-franchises.onrender.com/franchises');
        const fList  = await fRes.json();
        const winner = (Array.isArray(fList) ? fList : []).find(f => f.franchiseName === top.franchiseName);

        await fetch(`https://springboot-players-2.onrender.com/players/${ap.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...ap,
            status:          'SOLD',
            soldPrice:       top.amount,
            boughtBy:        top.franchiseName,
            bidHistory:      '[]',
            sessionPasskeys: '{}',
          }),
        });

        if (winner) {
          await fetch(`https://springboot-franchises.onrender.com/franchises/${winner.id}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...winner, networth: (winner.networth || 0) - top.amount }),
          });
        }

        notify(`🏆 ${ap.name} SOLD to ${top.franchiseName} for ${fmt(top.amount)}!`);
      }

    } catch (e) {
      notify('Finalize failed: ' + e.message, 'error');
    } finally {
      finalizingRef.current   = false;
      prevBidCountRef.current = 0;
      activePRef.current      = null;
      topBidRef.current       = null;
      setFinalizing(false);
      setActivePlayer(null);
      setBidUrls({});
      setLiveBids([]);
      setTopBid(null);
      setView('auction');

      try {
        const pRes  = await fetch('https://springboot-players-2.onrender.com/players');
        const fRes2 = await fetch('https://springboot-franchises.onrender.com/franchises');
        const pd    = await pRes.json();
        const fd    = await fRes2.json();
        const pl    = Array.isArray(pd) ? pd : [];
        setPlayers(pl);
        setSoldList(pl.filter(p => p.status === 'SOLD'));
        setFranchises(Array.isArray(fd) ? fd : []);
      } catch { /* ignore */ }
      setLoading(false);
    }
  }, [stopTimers]);

  // ── START 60s COUNTDOWN ───────────────────────────────────────────────────
  const startCountdown = useCallback(() => {
    stopTimers();
    setCountdown(AUCTION_SECS);

    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    autoSellRef.current = setTimeout(() => {
      finalizeAuction();
    }, AUCTION_SECS * 1000);
  }, [stopTimers, finalizeAuction]);

  // ── POLL every 2s — reads bidHistory from DB ──────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      const [pRes, fRes] = await Promise.all([
        fetch('https://springboot-players-2.onrender.com/players'),
        fetch('https://springboot-franchises.onrender.com/franchises'),
      ]);
      const pd    = await pRes.json();
      const fd    = await fRes.json();
      const pList = Array.isArray(pd) ? pd : [];
      const fList = Array.isArray(fd) ? fd : [];
      setPlayers(pList);
      setFranchises(fList);
      setSoldList(pList.filter(p => p.status === 'SOLD'));

      const ap = activePRef.current;
      if (ap) {
        const liveP = pList.find(p => p.id === ap.id);
        if (liveP) {
          try {
            const bids = JSON.parse(liveP.bidHistory || '[]');
            if (Array.isArray(bids) && bids.length > 0) {
              const sorted = [...bids].sort((a, b) =>
                b.amount !== a.amount ? b.amount - a.amount : a.timestamp - b.timestamp
              );
              setLiveBids(sorted);
              setTopBid(sorted[0]);
              topBidRef.current = sorted[0];

              if (bids.length > prevBidCountRef.current) {
                prevBidCountRef.current = bids.length;
                startCountdown();
              }
            } else if (bids.length === 0 && prevBidCountRef.current === 0) {
              setLiveBids([]);
              setTopBid(null);
              topBidRef.current = null;
            }
          } catch { /* ignore */ }
        }
      }
    } catch (e) {
      console.error('fetchAll error:', e);
    } finally {
      setLoading(false);
    }
  }, [startCountdown]);

  useEffect(() => {
    fetchAll();
    const iv = setInterval(fetchAll, 2000);
    return () => clearInterval(iv);
  }, [fetchAll]);

  // ── START AUCTION ─────────────────────────────────────────────────────────
  const startAuction = useCallback(async (player) => {
    stopTimers();
    finalizingRef.current   = false;
    prevBidCountRef.current = 0;
    topBidRef.current       = null;

    activePRef.current = player;
    setActivePlayer(player);
    setLiveBids([]);
    setTopBid(null);

    const passkeys = {};
    const urls     = {};
    const baseUrl  = window.location.origin;

    franchisesRef.current.forEach(f => {
      const key             = generatePasskey(f.id, player.id);
      passkeys[f.id]        = key;
      urls[f.franchiseName] = `${baseUrl}/bid/${player.id}/${f.id}/${key}`;
    });

    // ── KEY FIX: Write sessionPasskeys to DB (not localStorage) ──────────────
    // Any browser on any device can now validate the passkey by fetching
    // the player record from the DB and checking sessionPasskeys.
    await fetch(`https://springboot-players-2.onrender.com/players/${player.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...player,
        bidHistory:      '[]',
        soldPrice:       player.basicRemuneration,
        boughtBy:        null,
        status:          'AVAILABLE',
        sessionPasskeys: JSON.stringify(passkeys),
      }),
    }).catch(console.error);

    setBidUrls(urls);
    notify(`🔨 ${player.name} is LIVE! 60 seconds on the clock.`);
    setView('bidurls');
    startCountdown();
  }, [stopTimers, startCountdown]);

  const copyUrl = (name, url) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedUrl(name);
      setTimeout(() => setCopiedUrl(''), 2000);
    });
  };

  // ── MARK UNSOLD MANUALLY ──────────────────────────────────────────────────
  const markUnsold = useCallback(async () => {
    if (!activePlayer) return;
    if (!window.confirm(`Mark ${activePlayer.name} as UNSOLD?`)) return;
    stopTimers();
    try {
      await fetch(`https://springboot-players-2.onrender.com/players/${activePlayer.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...activePlayer,
          status:          'UNSOLD',
          soldPrice:       0,
          boughtBy:        null,
          bidHistory:      '[]',
          sessionPasskeys: '{}',
        }),
      });
      notify(`${activePlayer.name} marked UNSOLD.`, 'info');
    } catch { notify('Failed', 'error'); }
    prevBidCountRef.current = 0;
    activePRef.current      = null;
    topBidRef.current       = null;
    setActivePlayer(null);
    setBidUrls({});
    setLiveBids([]);
    setTopBid(null);
    setCountdown(0);
    setView('auction');
    fetchAll();
  }, [activePlayer, stopTimers, fetchAll]);

  // ── FULL RESET ────────────────────────────────────────────────────────────
  const handleFullReset = async () => {
    if (!window.confirm('Reset entire auction? Cannot be undone.')) return;
    stopTimers();
    setLoading(true);
    prevBidCountRef.current = 0;
    activePRef.current      = null;
    topBidRef.current       = null;
    setActivePlayer(null);
    setBidUrls({});
    setLiveBids([]);
    setTopBid(null);
    setCountdown(0);
    try {
      await fetch('https://springboot-franchises.onrender.com/franchises/reset-auction', { method: 'POST' });
      const pList = await (await fetch('https://springboot-players-2.onrender.com/players')).json();
      await Promise.all((Array.isArray(pList) ? pList : []).map(p =>
        fetch(`https://springboot-players-2.onrender.com/players/${p.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...p,
            status:          'AVAILABLE',
            soldPrice:       0,
            boughtBy:        null,
            bidHistory:      '[]',
            sessionPasskeys: '{}',
          }),
        })
      ));
      notify('✅ Auction fully reset!');
      fetchAll();
    } catch { notify('Reset failed', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => () => stopTimers(), [stopTimers]);

  const cdColor = countdown > 30
    ? 'border-green-400 bg-green-500/10 text-green-400'
    : countdown > 10
    ? 'border-yellow-400 bg-yellow-500/10 text-yellow-400'
    : 'border-red-400 bg-red-500/10 text-red-400';

  const cdPulse  = countdown <= 10 && countdown > 0;
  const topColor = topBid ? (TEAM_COLORS[topBid.franchiseName] || '#3B82F6') : '#3B82F6';
  const availablePlayers = players.filter(p => p.status === 'AVAILABLE' || p.status === 'UNSOLD');

  const navItems = [
    { k: 'auction',  l: '🔨 Auction'  },
    { k: 'bidurls',  l: '🔗 Bid URLs' },
    { k: 'livebids', l: `📊 Live Bids${liveBids.length > 0 ? ` (${liveBids.length})` : ''}` },
    { k: 'sold',     l: '🏆 Sold'     },
    { k: 'teams',    l: '🏟️ Teams'    },
    { k: 'reset',    l: '☢️ Reset'    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col">
      <style>{`
        @keyframes marquee  { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes fadeDown { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes livePulse{ 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes cdPulse  { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
        .notif-anim { animation: fadeDown .3s ease forwards; }
      `}</style>

      {notification && (
        <div className={`notif-anim fixed top-4 right-4 z-[9999] px-5 py-3 rounded-2xl text-sm font-bold uppercase tracking-wider shadow-2xl max-w-sm border ${
          notification.type === 'success' ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 border-emerald-500' :
          notification.type === 'error'   ? 'bg-gradient-to-r from-red-600 to-red-700 border-red-500' :
                                            'bg-gradient-to-r from-blue-600 to-blue-700 border-blue-500'
        }`}>{notification.msg}</div>
      )}

      <nav className="bg-slate-900/95 backdrop-blur-xl border-b border-slate-800/50 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-50 shadow-xl">
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center">⚙️</div>
          <div>
            <h1 className="text-xl font-black tracking-wider leading-none">CRIC<span className="text-amber-400">AUCTION</span></h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold leading-none mt-0.5">ADMIN PANEL</p>
          </div>
        </div>

        {activePlayer && countdown > 0 && (
          <div className={`font-black text-xl px-4 py-1.5 rounded-xl border-2 ${cdColor}`}
            style={cdPulse ? { animation: 'cdPulse .6s ease-in-out infinite' } : {}}>
            ⏱ {countdown}s
          </div>
        )}

        <div className="flex flex-wrap gap-1.5 justify-center">
          {navItems.map(({ k, l }) => (
            <button key={k} onClick={() => setView(k)}
              className={`font-bold text-xs uppercase tracking-wide px-3 py-2 rounded-xl border-2 transition-all ${
                view === k
                  ? 'text-amber-400 bg-amber-400/10 border-amber-400'
                  : 'text-slate-400 border-slate-700/50 hover:text-slate-200 hover:border-slate-600'
              }`}>
              {l}
            </button>
          ))}
        </div>

        <button onClick={() => { localStorage.clear(); navigate('/'); }}
          className="font-bold text-xs uppercase tracking-wide text-red-400 bg-red-500/10 border-2 border-red-500/30 px-4 py-2 rounded-xl hover:bg-red-500 hover:text-white transition-all shrink-0">
          LOGOUT
        </button>
      </nav>

      {soldList.length > 0 && (
        <div className="bg-slate-800/50 border-b border-amber-400/20 py-2 overflow-hidden">
          <div className="flex whitespace-nowrap" style={{ animation: 'marquee 25s linear infinite' }}>
            {[...soldList, ...soldList].map((s, i) => (
              <span key={i} className="px-6 text-xs text-slate-300 inline-flex items-center gap-2 shrink-0">
                🏏 <strong className="text-amber-400">{s.name}</strong>
                → <span className="text-emerald-400 font-bold">{fmt(s.soldPrice)}</span>
                <span className="text-slate-500">({s.boughtBy})</span>
                <span className="text-slate-600 mx-2">•</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">

        <div className={`w-full sm:w-72 lg:w-80 bg-slate-900/50 border-r border-slate-800/30 flex flex-col shrink-0 ${activePlayer ? 'hidden sm:flex' : 'flex'}`}>
          <div className="px-5 py-4 border-b border-slate-800/50">
            <p className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-1">PLAYER POOL</p>
            <h2 className="text-2xl font-black">{availablePlayers.length} <span className="text-base font-normal text-slate-400">available</span></h2>
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
                <div key={p.id} onClick={() => !activePlayer && startAuction(p)}
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                    isActive      ? 'bg-amber-500/10 border-amber-400 scale-[1.02]' :
                    activePlayer  ? 'opacity-40 cursor-not-allowed border-slate-800/20 bg-slate-800/10' :
                                    'border-slate-800/20 bg-slate-800/10 hover:border-slate-600 hover:bg-slate-800/30 cursor-pointer'
                  }`}>
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="text-base font-black truncate">{p.name}</div>
                    <div className="text-xs text-slate-400">{p.position} · {p.country}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-black text-amber-400">{fmt(p.basicRemuneration)}</div>
                    {p.status === 'UNSOLD' && <div className="text-[10px] font-bold text-red-400">UNSOLD</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">

          {view === 'auction' && (
            <div className="max-w-4xl mx-auto">
              {activePlayer ? (
                <div className="space-y-6">
                  <div className="rounded-3xl p-8 border-2 text-center shadow-2xl"
                    style={{ background: `linear-gradient(135deg,${topColor}20,rgba(255,255,255,0.03))`, borderColor: `${topColor}60` }}>
                    <div className="inline-flex items-center gap-2 bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-5">
                      <div className="w-2 h-2 bg-red-400 rounded-full" style={{ animation: 'livePulse 1s ease-in-out infinite' }} />
                      LIVE AUCTION
                    </div>
                    <h2 className="text-5xl sm:text-6xl font-black tracking-tight mb-2">{activePlayer.name}</h2>
                    <p className="text-slate-400 text-lg mb-6">{activePlayer.position} · {activePlayer.country}</p>
                    {topBid ? (
                      <div>
                        <p className="text-slate-400 text-sm mb-1">Current highest bid</p>
                        <div className="text-5xl font-black text-yellow-400 mb-2">{fmt(topBid.amount)}</div>
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ background: topColor }} />
                          <span className="font-bold text-lg" style={{ color: topColor }}>{topBid.franchiseName}</span>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-slate-400 text-sm mb-1">Base price</p>
                        <div className="text-4xl font-black text-slate-300">{fmt(activePlayer.basicRemuneration)}</div>
                        <p className="text-slate-500 text-sm mt-2">Waiting for first bid…</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 flex-wrap">
                    <button onClick={() => setView('livebids')}
                      className="flex-1 font-black text-sm uppercase tracking-wider bg-blue-600 hover:bg-blue-700 border-0 text-white py-4 rounded-2xl transition-all cursor-pointer">
                      📊 Live Bids {liveBids.length > 0 && `(${liveBids.length})`}
                    </button>
                    <button onClick={() => setView('bidurls')}
                      className="flex-1 font-black text-sm uppercase tracking-wider bg-slate-700 hover:bg-slate-600 border-0 text-white py-4 rounded-2xl transition-all cursor-pointer">
                      🔗 Bid URLs
                    </button>
                    {topBid && (
                      <button onClick={finalizeAuction} disabled={finalizing}
                        className={`flex-1 font-black text-sm uppercase tracking-wider border-0 text-white py-4 rounded-2xl transition-all ${
                          finalizing ? 'bg-emerald-800/40 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-500 to-emerald-700 cursor-pointer shadow-lg'
                        }`}>
                        {finalizing ? '⏳ Finalizing…' : `🏆 SELL to ${topBid.franchiseName}`}
                      </button>
                    )}
                    <button onClick={markUnsold}
                      className="font-black text-sm uppercase tracking-wider bg-red-500/20 border-2 border-red-500/40 text-red-400 hover:bg-red-500 hover:text-white px-6 py-4 rounded-2xl transition-all cursor-pointer">
                      ❌ UNSOLD
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-24">
                  <div className="text-8xl mb-6">🔨</div>
                  <h2 className="text-4xl font-black mb-3">Ready to Auction</h2>
                  <p className="text-slate-400 text-lg">Select a player from the left panel to start bidding</p>
                </div>
              )}
            </div>
          )}

          {view === 'bidurls' && (
            <div className="max-w-3xl mx-auto">
              <h2 className="text-4xl font-black tracking-tight mb-2">🔗 Franchise Bid URLs</h2>
              {activePlayer ? (
                <>
                  <p className="text-slate-400 mb-6">Share with each franchise for <strong className="text-amber-400">{activePlayer.name}</strong></p>
                  <div className="space-y-3">
                    {Object.entries(bidUrls).map(([name, url]) => {
                      const tc = TEAM_COLORS[name] || '#3B82F6';
                      return (
                        <div key={name} className="rounded-2xl p-4 border flex items-center gap-4 flex-wrap"
                          style={{ background: `${tc}15`, borderColor: `${tc}40` }}>
                          <div className="flex items-center gap-2 min-w-[200px]">
                            <div className="w-3 h-3 rounded-full shrink-0" style={{ background: tc }} />
                            <span className="font-black text-base">{name}</span>
                          </div>
                          <p className="flex-1 font-mono text-xs text-slate-400 truncate hidden sm:block">{url}</p>
                          <button onClick={() => copyUrl(name, url)}
                            className={`font-black text-xs uppercase tracking-wide px-4 py-2 rounded-xl border transition-all cursor-pointer shrink-0 ${
                              copiedUrl === name
                                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                                : 'bg-white/5 border-white/20 text-slate-300 hover:border-white/50 hover:text-white'
                            }`}>
                            {copiedUrl === name ? '✅ Copied!' : '📋 Copy'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="text-slate-400 mt-4">No active auction. Start from the player panel.</p>
              )}
            </div>
          )}

          {view === 'livebids' && (
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <div>
                  <h2 className="text-4xl font-black tracking-tight">
                    📊 Live Bids
                    {liveBids.length > 0 && <span className="text-xl font-normal text-slate-400 ml-3">{liveBids.length}</span>}
                  </h2>
                  <p className="text-slate-400 mt-1">Updates every 2 seconds</p>
                </div>
                {activePlayer && countdown > 0 && (
                  <div className={`font-black text-4xl px-6 py-3 rounded-2xl border-4 ${cdColor}`}
                    style={cdPulse ? { animation: 'cdPulse .6s ease-in-out infinite' } : {}}>
                    ⏱ {countdown}s
                  </div>
                )}
              </div>

              {activePlayer && (
                <div className="mb-4 bg-amber-400/10 border border-amber-400/30 rounded-xl px-4 py-3 text-sm">
                  🔨 <strong className="text-amber-400">{activePlayer.name}</strong> is on the block
                  {topBid && <> · Leading: <strong className="text-emerald-400">{topBid.franchiseName}</strong> at <strong className="text-yellow-400">{fmt(topBid.amount)}</strong></>}
                </div>
              )}

              {liveBids.length === 0 ? (
                <div className="text-center py-24 text-slate-400">
                  <div className="text-6xl mb-4">📭</div>
                  <p className="text-xl font-bold">No bids yet</p>
                  <p className="text-sm mt-2">Bids appear here when franchises place them via their Bid URL.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {liveBids.map((b, i) => {
                    const tc    = TEAM_COLORS[b.franchiseName] || '#3B82F6';
                    const isTop = i === 0;
                    return (
                      <div key={i} className={`rounded-2xl p-5 border ${isTop ? 'border-yellow-400/40 bg-yellow-400/5' : 'border-slate-700/30 bg-slate-800/20'}`}>
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full" style={{ background: tc }} />
                            <div>
                              <p className="font-black text-lg text-white">{b.franchiseName}</p>
                              <p className="font-mono text-xs text-slate-400">{b.timeDisplay} · ms:{b.msDisplay}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {isTop && <span className="bg-yellow-400/15 text-yellow-400 border border-yellow-400/30 text-xs font-black px-2 py-1 rounded-lg">🏆 HIGHEST</span>}
                            <span className="text-2xl font-black text-yellow-400">{fmt(b.amount)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {view === 'sold' && (
            <div className="max-w-6xl mx-auto">
              <h2 className="text-5xl font-black tracking-tight mb-8">🏆 Sold Players <span className="text-xl text-slate-400 font-normal">({soldList.length})</span></h2>
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

          {view === 'teams' && (
            <div className="max-w-6xl mx-auto">
              <h2 className="text-5xl font-black tracking-tight mb-8">🏟️ Franchise Status</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {franchises.map(f => {
                  const tc    = TEAM_COLORS[f.franchiseName] || '#3B82F6';
                  const myP   = players.filter(p => p.boughtBy === f.franchiseName);
                  const spent = myP.reduce((a, p) => a + (p.soldPrice || 0), 0);
                  return (
                    <div key={f.id} className="rounded-2xl p-6 shadow-xl border hover:scale-[1.02] transition-all"
                      style={{ background: `linear-gradient(135deg,${tc}20,rgba(255,255,255,0.03))`, borderColor: `${tc}40` }}>
                      <div className="flex justify-between items-start mb-4 gap-3">
                        <div>
                          <div className="text-xl font-black break-words">{f.franchiseName}</div>
                          <div className="text-sm text-slate-400">{f.ownerName || f.name}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Purse Left</p>
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

          {view === 'reset' && (
            <div className="max-w-lg mx-auto mt-16 text-center space-y-6 px-4">
              <div className="text-7xl">☢️</div>
              <h2 className="text-6xl font-black text-red-400">FULL RESET</h2>
              <p className="text-lg text-slate-400 leading-relaxed">
                Clears all squads, resets purses, marks all players AVAILABLE.
                <strong className="text-red-400 block mt-3 text-xl">Cannot be undone.</strong>
              </p>
              <div className="bg-red-500/10 border-2 border-red-500/30 rounded-3xl p-8">
                <button onClick={handleFullReset} disabled={loading}
                  className={`w-full font-black text-xl uppercase tracking-widest py-6 rounded-2xl border-0 shadow-2xl transition-all flex items-center justify-center gap-4 ${
                    loading ? 'bg-red-500/30 text-slate-300 cursor-not-allowed' : 'bg-gradient-to-r from-red-500 to-red-700 text-white cursor-pointer hover:-translate-y-1'
                  }`}>
                  {loading ? <><div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /> Resetting...</> : '☢️ CONFIRM FULL RESET'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;