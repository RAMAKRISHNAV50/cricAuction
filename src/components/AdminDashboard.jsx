import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const TEAM_COLORS = {
  'Mumbai Indians': '#004BA0',
  'Chennai Super Kings': '#F9CD05', 
  'Royal Challengers Bengaluru': '#EC1C24',
  'Kolkata Knight Riders': '#3A225D',
  'Delhi Capitals': '#00008B',
  'Rajasthan Royals': '#FF4E9F',
  'Punjab Kings': '#ED1B24',
  'Sunrisers Hyderabad': '#F26522',
};

const BID_INC = (cur) => {
  if (cur < 1_000_000) return 50_000;
  if (cur < 5_000_000) return 100_000;
  if (cur < 10_000_000) return 250_000;
  return 500_000;
};

const AdminDashboard = () => {
  const navigate = useNavigate();

  // States
  const [players, setPlayers] = useState([]);
  const [franchises, setFranchises] = useState([]);
  const [activePlayer, setActivePlayer] = useState(null);
  const [currentBid, setCurrentBid] = useState(0);
  const [leadingBidder, setLeadingBidder] = useState(null);
  const [bidLog, setBidLog] = useState([]);
  const [bidCount, setBidCount] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [auctionRunning, setAuctionRunning] = useState(false);
  const [soldList, setSoldList] = useState([]);
  const [view, setView] = useState('auction');
  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);
  const [notification, setNotification] = useState(null);

  // Refs
  const bidTimerRef = useRef(null);
  const cdTimerRef = useRef(null);
  const logEndRef = useRef(null);
  const currentStateRef = useRef({ currentBid: 0, leadingBidder: null, franchises: [] });

  const notify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const addLog = (entry) => {
    setBidLog(prev => [...prev.slice(-99), entry]);
    setTimeout(() => logEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  // Update current state ref
  useEffect(() => {
    currentStateRef.current.currentBid = currentBid;
    currentStateRef.current.leadingBidder = leadingBidder;
    currentStateRef.current.franchises = franchises;
  }, [currentBid, leadingBidder, franchises]);

  const fetchAll = useCallback(async () => {
    try {
      const [pRes, fRes] = await Promise.all([
        fetch('https://springboot-players-2.onrender.com/players'),
        fetch('https://springboot-franchises.onrender.com/franchises'),
      ]);
      const pData = await pRes.json();
      const fData = await fRes.json();
      setPlayers(Array.isArray(pData) ? pData : []);
      setFranchises(Array.isArray(fData) ? fData : []);
      setSoldList((Array.isArray(pData) ? pData : []).filter(p => p.status === 'SOLD'));
    } catch (e) { 
      console.error(e); 
      notify('Failed to fetch data', 'error');
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchAll();
    const iv = setInterval(fetchAll, 5000);
    return () => clearInterval(iv);
  }, [fetchAll]);

  const stopTimers = () => {
    if (bidTimerRef.current) {
      clearInterval(bidTimerRef.current);
      bidTimerRef.current = null;
    }
    if (cdTimerRef.current) {
      clearInterval(cdTimerRef.current);
      cdTimerRef.current = null;
    }
  };

  const startCountdown = (secs) => {
    stopTimers();
    setCountdown(secs);
    cdTimerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(cdTimerRef.current);
          cdTimerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 🔥 PERFECT AUTO-BID - NO STALE CLOSURES
  const triggerAutoBid = useCallback(() => {
    console.log('🔄 Auto-bid triggered');
    
    const { currentBid, leadingBidder, franchises } = currentStateRef.current;
    const recentBidders = new Set(bidLog.slice(-3).map(log => log.franchise || log.bidder));
    
    const eligible = franchises.filter(f => 
      f.franchiseName !== leadingBidder?.franchiseName && 
      !recentBidders.has(f.franchiseName) && 
      (f.networth || 0) > currentBid + BID_INC(currentBid)
    );
    
    if (!eligible.length) {
      if (bidCount >= 10 && leadingBidder) {
        console.log('🏆 AUTO-SELL after 10 bids');
        finalizeAuction();
      }
      return;
    }

    const bidder = eligible[Math.floor(Math.random() * eligible.length)];
    const newBid = currentBid + BID_INC(currentBid);
    
    setCurrentBid(newBid);
    setLeadingBidder(bidder);
    setBidCount(prev => prev + 1);
    
    addLog({
      type: 'bid',
      franchise: bidder.franchiseName,
      amount: newBid,
      time: new Date().toLocaleTimeString(),
      bidNumber: bidCount + 1
    });
    
    console.log(`✅ ${bidder.franchiseName} bids ${fmt(newBid)} | Bid #${bidCount + 1}`);
    
    if (bidCount >= 9) {
      setTimeout(() => auctionRunning && finalizeAuction(), 3000);
    } else {
      startCountdown(8);
    }
  }, [bidLog, bidCount, auctionRunning]);

  // 🔥 PERFECT AUCTION STARTER
  const startAuction = useCallback((player) => {
    console.log('🎯 AUCTION START:', player.name);
    
    stopTimers();
    
    const basePrice = player.basicRemuneration || 500000;
    
    setActivePlayer(player);
    setCurrentBid(basePrice);
    setLeadingBidder(null);
    setBidLog([]);
    setBidCount(0);
    setAuctionRunning(true);
    
    addLog({
      type: 'start',
      player: player.name,
      base: basePrice,
      time: new Date().toLocaleTimeString()
    });
    
    startCountdown(8);
    
    // Start auto-bidding every 5 seconds
    bidTimerRef.current = setInterval(() => {
      if (!auctionRunning || !activePlayer) {
        stopTimers();
        return;
      }
      triggerAutoBid();
    }, 5000);
  }, [auctionRunning, activePlayer]);

  const adminRaiseBid = useCallback(() => {
    if (!activePlayer || !auctionRunning) return;
    
    const newBid = currentBid + BID_INC(currentBid);
    const recentBidders = new Set(bidLog.slice(-2).map(log => log.franchise));
    const eligible = franchises.filter(f => 
      !recentBidders.has(f.franchiseName) && 
      (f.networth || 0) > newBid
    );
    
    if (!eligible.length) {
      notify('No franchise has enough budget!', 'error');
      return;
    }
    
    const bidder = eligible[Math.floor(Math.random() * eligible.length)];
    setCurrentBid(newBid);
    setLeadingBidder(bidder);
    setBidCount(prev => prev + 1);
    
    addLog({
      type: 'admin',
      franchise: bidder.franchiseName,
      amount: newBid,
      time: new Date().toLocaleTimeString(),
      bidNumber: bidCount + 1
    });
    
    startCountdown(8);
  }, [currentBid, franchises, bidLog, bidCount, auctionRunning, activePlayer]);

  const finalizeAuction = async () => {
    if (!activePlayer || !leadingBidder) {
      notify('No active bid!', 'error');
      return;
    }
    
    setFinalizing(true);
    stopTimers();
    setAuctionRunning(false);
    
    try {
      const pRes = await fetch(`https://springboot-players-2.onrender.com/players/${activePlayer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...activePlayer,
          status: 'SOLD',
          soldPrice: currentBid,
          boughtBy: leadingBidder.franchiseName
        }),
      });
      
      if (!pRes.ok) throw new Error('Player update failed');
      
      await fetch(`https://springboot-franchises.onrender.com/franchises/${leadingBidder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...leadingBidder,
          networth: (leadingBidder.networth || 0) - currentBid
        }),
      });
      
      addLog({
        type: 'sold',
        player: activePlayer.name,
        franchise: leadingBidder.franchiseName,
        amount: currentBid,
        time: new Date().toLocaleTimeString(),
        bidNumber: bidCount + 1
      });
      
      notify(`🏆 ${activePlayer.name} SOLD to ${leadingBidder.franchiseName} for ${fmt(currentBid)}!`);
      setSoldList(prev => [...prev, {
        ...activePlayer,
        soldPrice: currentBid,
        boughtBy: leadingBidder.franchiseName
      }]);
      
      // Reset
      setActivePlayer(null);
      setLeadingBidder(null);
      setCurrentBid(0);
      setCountdown(0);
      setBidCount(0);
      fetchAll();
    } catch (e) {
      notify('❌ Finalize failed: ' + e.message, 'error');
    } finally {
      setFinalizing(false);
    }
  };

  const markUnsold = async () => {
    if (!activePlayer) return;
    stopTimers();
    setAuctionRunning(false);
    try {
      await fetch(`https://springboot-players-2.onrender.com/players/${activePlayer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...activePlayer, status: 'UNSOLD' }),
      });
      addLog({ type: 'unsold', player: activePlayer.name, time: new Date().toLocaleTimeString() });
      notify(`${activePlayer.name} marked as UNSOLD.`, 'info');
      setActivePlayer(null);
      setLeadingBidder(null);
      setCurrentBid(0);
      setCountdown(0);
      setBidCount(0);
      fetchAll();
    } catch {
      notify('Failed to mark unsold', 'error');
    }
  };

  const handleFullReset = async () => {
    if (!window.confirm('Reset entire auction? All squads cleared, budgets restored.')) return;
    stopTimers();
    setAuctionRunning(false);
    setActivePlayer(null);
    setBidLog([]);
    setLoading(true);
    try { 
      await fetch('https://springboot-franchises.onrender.com/franchises/reset-auction', { method: 'POST' });
      const pRes = await fetch('https://springboot-players-2.onrender.com/players');
      const pList = await pRes.json();
      await Promise.all(pList.map(p => fetch(`https://springboot-players-2.onrender.com/players/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...p, status: 'AVAILABLE', soldPrice: 0, boughtBy: null }),
      })));
      notify('✅ Auction fully reset!');
      fetchAll();
    } catch {
      notify('Reset failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Cleanup
  useEffect(() => () => stopTimers(), []);

  const leaderColor = leadingBidder ? (TEAM_COLORS[leadingBidder.franchiseName] || '#3B82F6') : '#3B82F6';
  const availablePlayers = players.filter(p => p.status === 'AVAILABLE' || p.status === 'UNSOLD');
  
  const cdColor = countdown > 4 ? 'border-blue-400 bg-blue-500/10 text-blue-400' :
                  countdown > 2 ? 'border-yellow-400 bg-yellow-500/10 text-yellow-400' :
                  'border-red-400 bg-red-500/10 text-red-400';

  const navItems = [
    { k: 'auction', l: '🔨 Auction' },
    { k: 'sold', l: '🏆 Sold' },
    { k: 'teams', l: '🏟️ Teams' },
    { k: 'reset', l: '☢️ Reset' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white font-sans flex flex-col">
      
      {/* Notification */}
      {notification && (
        <div className={`
          fixed top-4 right-4 sm:top-6 sm:right-6 z-[9999] px-6 py-3 rounded-2xl text-sm font-bold uppercase tracking-wider shadow-2xl max-w-sm border max-w-[90vw] mx-2
          ${notification.type === 'success' 
            ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 border-emerald-500' 
            : notification.type === 'error' 
            ? 'bg-gradient-to-r from-red-600 to-red-700 border-red-500'
            : 'bg-gradient-to-r from-blue-600 to-blue-700 border-blue-500'
          } animate-in slide-in-from-right-4 duration-300
        `}>
          {notification.msg}
        </div>
      )}

      {/* Top Nav - Fully Responsive */}
      <nav className="bg-slate-900/95 backdrop-blur-xl border-b border-slate-800/50 px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between sticky top-0 z-50 shadow-xl">
        <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto mb-3 sm:mb-0">
          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
            <span className="text-lg">⚙️</span>
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl font-black tracking-wider leading-tight">CRIC<span className="text-amber-400">AUCTION</span></h1>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">ADMIN PANEL</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 sm:gap-1 w-full sm:w-auto justify-center sm:justify-end">
          {navItems.map(({ k, l }) => (
            <button 
              key={k} 
              onClick={() => setView(k)}
              className={`
                font-bold text-xs sm:text-sm uppercase tracking-wider px-4 sm:px-6 py-2.5 rounded-xl border-2 transition-all duration-200 flex items-center gap-2 min-w-[100px] justify-center
                ${view === k 
                  ? 'text-amber-400 bg-amber-400/10 border-amber-400 shadow-amber-400/25 shadow-lg' 
                  : 'text-slate-400 border-slate-700/50 hover:text-slate-200 hover:border-slate-600 hover:bg-slate-800/50'
                }
              `}
            >
              <span className="text-lg sm:text-xl">{l.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        <button 
          onClick={() => { localStorage.clear(); navigate('/'); }}
          className="font-bold text-xs sm:text-sm uppercase tracking-wider text-red-400 bg-red-500/10 border-2 border-red-500/30 px-4 sm:px-6 py-2.5 rounded-xl hover:bg-red-500 hover:text-white hover:shadow-lg hover:shadow-red-500/25 transition-all duration-200 mt-2 sm:mt-0 ml-auto sm:ml-0"
        >
          LOGOUT
        </button>
      </nav>

      {/* Sold Ticker */}
      {soldList.length > 0 && view === 'auction' && (
        <div className="bg-slate-800/50 border-b border-amber-400/20 py-2 sm:py-3 overflow-hidden">
          <div className="flex whitespace-nowrap" style={{ animation: 'marquee 25s linear infinite' }}>
            {[...soldList, ...soldList].map((s, i) => (
              <span key={i} className="px-4 sm:px-8 text-xs sm:text-sm text-slate-300 inline-flex items-center gap-1 sm:gap-2 min-w-[200px]">
                🏏 <strong className="text-amber-400">{s.name}</strong> → 
                <span className="font-bold text-emerald-400">{fmt(s.soldPrice)}</span> 
                <span className="text-slate-400">({s.boughtBy})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar - Mobile Hidden */}
        {view === 'auction' && (
          <div className={`w-full sm:w-80 lg:w-96 bg-slate-900/50 border-r border-slate-800/30 flex-col ${activePlayer ? 'hidden sm:flex' : 'flex'}`}>
            <div className="p-6 border-b border-slate-800/50">
              <p className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-2">PLAYER POOL</p>
              <h2 className="text-3xl font-black">
                {availablePlayers.length} 
                <span className="text-xl font-normal text-slate-400 ml-2">Available</span>
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="w-12 h-12 border-4 border-slate-700 border-t-blue-400 rounded-full animate-spin" />
                </div>
              ) : availablePlayers.length === 0 ? (
                <div className="text-center py-20 text-slate-400 text-lg font-bold">All players sold!</div>
              ) : (
                availablePlayers.map(p => {
                  const isActive = activePlayer?.id === p.id;
                  return (
                    <div 
                      key={p.id} 
                      onClick={() => !auctionRunning && startAuction(p)}
                      className={`
                        flex items-center justify-between p-5 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] hover:shadow-xl border-2
                        ${isActive 
                          ? 'bg-amber-500/10 border-amber-400 shadow-amber-400/30 shadow-lg scale-[1.02]' 
                          : auctionRunning 
                          ? 'opacity-50 cursor-not-allowed border-slate-800/30' 
                          : 'border-slate-800/20 hover:border-slate-700/50 hover:bg-slate-800/30 bg-slate-800/10'
                        }
                      `}
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="text-xl font-black tracking-tight truncate">{p.name}</div>
                        <div className="text-sm text-slate-400 mt-1">{p.position} · {p.country}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-lg font-black text-amber-400">{fmt(p.basicRemuneration)}</div>
                        {p.status === 'UNSOLD' && (
                          <div className="text-xs font-bold text-red-400 uppercase tracking-wider mt-1">UNSOLD</div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Main Content - Perfect Mobile Responsive */}
        <div className={`flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 ${!activePlayer && view === 'auction' ? 'hidden sm:block' : ''}`}>
          
          {/* AUCTION VIEW */}
          {view === 'auction' && (
            <>
              {!activePlayer ? (
                <div className="flex flex-col items-center justify-center min-h-[60vh] sm:min-h-[500px] text-center space-y-4 sm:space-y-6 p-4">
                  <div className="text-6xl sm:text-9xl animate-bounce">🔨</div>
                  <h1 className="text-3xl sm:text-6xl font-black text-slate-300 tracking-tight leading-tight">SELECT A PLAYER</h1>
                  <p className="text-lg sm:text-xl text-slate-400 max-w-md sm:max-w-2xl mx-auto leading-relaxed px-4">
                    {window.innerWidth < 640 ? 'Tap any player to start auction' : 'Click any player from the left panel to bring them to the auction block and start live bidding.'}
                  </p>
                </div>
              ) : (
                <div className="max-w-full sm:max-w-4xl mx-auto space-y-6 sm:space-y-8">
                  
                  {/* Player Spotlight - Mobile Responsive */}
                  <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/30 rounded-2xl sm:rounded-3xl p-6 sm:p-10 shadow-2xl">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:gap-8">
                      <div className="flex-1 mb-6 lg:mb-0">
                        <button 
                          onClick={() => setActivePlayer(null)}
                          className="sm:hidden text-xs font-bold text-amber-400 mb-4 flex items-center gap-1"
                        >
                          ← BACK TO LIST
                        </button>
                        <p className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-4">ON AUCTION BLOCK</p>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-4 break-words">{activePlayer.name}</h1>
                        <p className="text-xl sm:text-2xl text-slate-400">
                          🌏 {activePlayer.country} · {activePlayer.position} · Base: <span className="text-amber-400 font-bold">{fmt(activePlayer.basicRemuneration)}</span>
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full lg:w-auto lg:self-end">
                        {auctionRunning && (
                          <button
                            onClick={adminRaiseBid}
                            className="px-6 sm:px-8 py-3 sm:py-4 bg-blue-500/20 hover:bg-blue-500/30 border-2 border-blue-500/40 text-blue-300 font-bold uppercase tracking-wider rounded-2xl transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-blue-500/25 flex-1 lg:flex-none"
                          >
                            ⬆ Raise Bid
                          </button>
                        )}
                        {auctionRunning && (
                          <button
                            onClick={markUnsold}
                            className="px-6 sm:px-8 py-3 sm:py-4 bg-slate-800/50 hover:bg-slate-700/50 border-2 border-slate-700 text-slate-300 font-bold uppercase tracking-wider rounded-2xl transition-all duration-200 hover:scale-105 flex-1 lg:flex-none"
                          >
                            Mark Unsold
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Player Stats - Responsive Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-8 sm:mt-12">
                      {[
                        { l: 'T20 Runs', v: activePlayer.t20Runs || 0 },
                        { l: 'ODI Runs', v: activePlayer.odiRuns || 0 },
                        { l: 'Avg', v: activePlayer.battingAverage || 'N/A' },
                        { l: 'Wickets', v: activePlayer.wickets || 0 }
                      ].map(s => (
                        <div key={s.l} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 sm:p-6 text-center backdrop-blur-sm hover:bg-slate-800 transition-all">
                          <div className="text-2xl sm:text-3xl font-black text-amber-400">{s.v}</div>
                          <div className="text-xs uppercase tracking-wider text-slate-400 font-bold mt-2">{s.l}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bid Display & Controls - Perfect Mobile */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-12">
                    
                    {/* Current Bid */}
                    <div className={`
                      rounded-2xl sm:rounded-3xl p-6 sm:p-10 text-center transition-all duration-300 border-4 shadow-2xl backdrop-blur-xl
                      ${auctionRunning ? 'animate-pulse bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-yellow-500/10 border-amber-400/50 shadow-amber-400/30' : 'bg-slate-900/50 border-slate-800/30'}
                    `}>
                      <p className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-4 sm:mb-6">CURRENT BID</p>
                      <div className="text-5xl sm:text-6xl lg:text-7xl font-black text-amber-400 leading-none mb-6 sm:mb-8">{fmt(currentBid)}</div>
                      {leadingBidder ? (
                        <div className="flex items-center justify-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full shadow-lg" 
                            style={{ backgroundColor: leaderColor }}
                          />
                          <span className="text-xl sm:text-2xl font-black text-white tracking-wide truncate max-w-[200px]">{leadingBidder.franchiseName}</span>
                        </div>
                      ) : (
                        <p className="text-lg sm:text-xl text-slate-500 font-bold mt-4">Waiting for first bid...</p>
                      )}
                      {bidCount > 0 && (
                        <p className="text-sm text-slate-400 mt-4 font-mono">Bid #{bidCount} / 10</p>
                      )}
                    </div>

                    {/* Countdown & Sell */}
                    <div className="bg-slate-900/50 border border-slate-800/30 rounded-2xl sm:rounded-3xl p-6 sm:p-10 flex flex-col items-center justify-center gap-6 sm:gap-8 backdrop-blur-xl shadow-2xl">
                      <div className={`
                        w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-full border-4 flex items-center justify-center shadow-2xl transition-all duration-300
                        ${cdColor}
                      `}>
                        <span className={`text-4xl sm:text-5xl font-black ${cdColor.split(' ')[3] || 'text-white'}`}>
                          {auctionRunning ? countdown : '—'}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm uppercase tracking-wider text-slate-400 font-bold text-center">
                        {auctionRunning ? 'Seconds to Next Bid' : 'Auction Paused'}
                      </p>
                      {leadingBidder && auctionRunning && (
                        <button 
                          onClick={finalizeAuction} 
                          disabled={finalizing}
                          className={`
                            font-black text-lg sm:text-xl uppercase tracking-widest px-8 sm:px-12 py-4 sm:py-6 rounded-2xl border-0 shadow-2xl transition-all duration-200 flex items-center gap-3 w-full sm:w-auto
                            ${finalizing 
                              ? 'bg-red-500/30 border-red-500/50 text-slate-300 cursor-not-allowed' 
                              : 'bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white shadow-red-500/40 hover:shadow-red-500/60 hover:-translate-y-1 hover:scale-105'
                            }
                          `}
                        >
                          {finalizing ? (
                            <>
                              <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Finalizing...
                            </>
                          ) : (
                            '🔨 SOLD!'
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Bid Log - Mobile Responsive */}
                  <div className="bg-slate-900/50 border border-slate-800/30 rounded-2xl sm:rounded-3xl p-6 sm:p-8 max-h-64 sm:max-h-80 lg:max-h-[400px] overflow-y-auto backdrop-blur-xl shadow-2xl">
                    <p className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-4 sm:mb-6 sticky top-0 bg-slate-900/90 py-2 z-10">LIVE BID LOG</p>
                    {bidLog.length === 0 ? (
                      <div className="text-center py-8 sm:py-12 text-slate-500 text-lg font-bold">Auction started — first bids will appear here</div>
                    ) : (
                      <div className="space-y-3">
                        {bidLog.map((entry, i) => (
                          <div key={i} className={`
                            flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-2xl transition-all hover:scale-[1.02]
                            ${entry.type === 'sold' ? 'bg-emerald-500/10 border-emerald-400/30 border shadow-emerald-400/20' :
                              entry.type === 'start' ? 'bg-blue-500/10 border-blue-400/30 border shadow-blue-400/20' :
                              entry.type === 'unsold' ? 'bg-red-500/10 border-red-400/30 border shadow-red-400/20' :
                              'hover:bg-slate-800/50 border-slate-700/30 border'
                            }
                          `}>
                            <span className="text-2xl flex-shrink-0">
                              {entry.type === 'bid' ? '💰' : 
                               entry.type === 'sold' ? '🏆' : 
                               entry.type === 'start' ? '🔨' : 
                               entry.type === 'admin' ? '⬆' : '❌'}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className={`text-sm font-bold break-words pr-4 ${
                                entry.type === 'sold' ? 'text-emerald-400' :
                                entry.type === 'unsold' ? 'text-red-400' : 'text-white'
                              }`}>
                                {entry.type === 'start' && `Auction started for ${entry.player}`}
                                {(entry.type === 'bid' || entry.type === 'admin') && (
                                  <>
                                    <span className="font-black text-white">{entry.franchise}</span> 
                                    bid <span className="text-amber-400 font-bold">{fmt(entry.amount)}</span>
                                  </>
                                )}
                                {entry.type === 'sold' && (
                                  <>
                                    <span className="font-black text-emerald-400">{entry.player}</span> 
                                    SOLD to <span className="font-black">{entry.franchise}</span> 
                                    for <span className="text-emerald-400 font-bold">{fmt(entry.amount)}</span>
                                  </>
                                )}
                                {entry.type === 'unsold' && (
                                  <>
                                    <span className="font-black text-red-400">{entry.player}</span> marked UNSOLD
                                  </>
                                )}
                              </div>
                              {entry.bidNumber && (
                                <div className="text-xs text-slate-500 font-mono">Bid #{entry.bidNumber}</div>
                              )}
                            </div>
                            <span className="text-xs text-slate-400 font-mono whitespace-nowrap flex-shrink-0">{entry.time}</span>
                          </div>
                        ))}
                        <div ref={logEndRef} />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* SOLD VIEW - Responsive */}
          {view === 'sold' && (
            <div className="max-w-full sm:max-w-6xl mx-auto p-4">
              <h2 className="text-4xl sm:text-6xl font-black tracking-tight mb-8 sm:mb-12 flex flex-col sm:flex-row sm:items-center gap-4">
                🏆 SOLD PLAYERS 
                <span className="text-xl sm:text-2xl text-slate-400 font-normal">({soldList.length})</span>
              </h2>
              {soldList.length === 0 ? (
                <div className="text-center py-20 sm:py-32 text-slate-400 text-2xl sm:text-3xl font-bold">No players sold yet</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {soldList.map(p => {
                    const tc = TEAM_COLORS[p.boughtBy] || '#3B82F6';
                    return (
                      <div 
                        key={p.id} 
                        className="rounded-2xl sm:rounded-3xl p-6 sm:p-8 hover:scale-105 transition-all duration-200 shadow-2xl border"
                        style={{ 
                          background: `linear-gradient(135deg, ${tc}20, rgba(255,255,255,0.03))`, 
                          borderColor: `${tc}40` 
                        }}
                      >
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                          <div className="flex-1">
                            <div className="text-xl sm:text-2xl font-black mb-2 break-words">{p.name}</div>
                            <div className="text-sm text-slate-400">{p.position} · {p.country}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl sm:text-3xl font-black text-emerald-400">{fmt(p.soldPrice)}</div>
                            <div className="text-base sm:text-lg font-bold mt-2" style={{color: tc}}>{p.boughtBy}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TEAMS VIEW - Responsive */}
          {view === 'teams' && (
            <div className="max-w-full sm:max-w-6xl mx-auto p-4">
              <h2 className="text-4xl sm:text-6xl font-black tracking-tight mb-8 sm:mb-12">🏟️ FRANCHISE STATUS</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {franchises.map(f => {
                  const tc = TEAM_COLORS[f.franchiseName] || '#3B82F6';
                  const myPlayers = players.filter(p => p.boughtBy === f.franchiseName);
                  const spent = myPlayers.reduce((a, p) => a + (p.soldPrice || 0), 0);
                  return (
                    <div 
                      key={f.id} 
                      className="rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl border hover:scale-105 transition-all duration-200"
                      style={{ 
                        background: `linear-gradient(135deg, ${tc}20, rgba(255,255,255,0.03))`, 
                        borderColor: `${tc}40` 
                      }}
                    >
                      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-6 lg:mb-8 gap-4 lg:gap-0">
                        <div>
                          <div className="text-2xl sm:text-3xl font-black tracking-tight break-words">{f.franchiseName}</div>
                          <div className="text-sm text-slate-400 mt-2">{f.ownerName || f.name}</div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">Purse Left</p>
                          <div className="text-3xl sm:text-4xl font-black text-amber-400 mt-2">{fmt(f.networth)}</div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row justify-between text-lg text-slate-400 gap-4 sm:gap-0">
                        <span>Players: <strong className="text-white text-xl">{myPlayers.length}</strong></span>
                        <span>Spent: <strong className="text-red-400 text-xl">{fmt(spent)}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* RESET VIEW - Responsive */}
          {view === 'reset' && (
            <div className="max-w-md sm:max-w-2xl mx-auto mt-16 sm:mt-32 text-center space-y-6 sm:space-y-8 p-4">
              <div className="text-7xl sm:text-9xl animate-bounce">☢️</div>
              <h2 className="text-4xl sm:text-7xl font-black text-red-400 tracking-tight leading-tight">FULL AUCTION RESET</h2>
              <p className="text-lg sm:text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto">
                This will clear all squad assignments, reset every franchise&apos;s purse, and return all players to AVAILABLE status. 
                <strong className="text-red-400 block mt-4 text-xl sm:text-2xl font-black">This action cannot be undone.</strong>
              </p>
              <div className="bg-red-500/10 border-2 border-red-500/30 rounded-2xl sm:rounded-3xl p-8 sm:p-12 backdrop-blur-xl">
                <button 
                  onClick={handleFullReset} 
                  disabled={loading}
                  className={`
                    w-full font-black text-lg sm:text-2xl uppercase tracking-widest py-6 sm:py-8 px-8 rounded-2xl border-0 shadow-2xl transition-all duration-200 flex items-center justify-center gap-4
                    ${loading 
                      ? 'bg-red-500/30 border-red-500/50 text-slate-300 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white shadow-red-500/50 hover:shadow-red-500/70 hover:-translate-y-2 hover:scale-105'
                    }
                  `}
                >
                  {loading ? (
                    <>
                      <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    '☢️ CONFIRM FULL RESET'
                  )}
                </button>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-bold uppercase tracking-wider">
                Only accessible by auction administrator
              </p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
