import { useEffect, useState, useRef } from 'react';
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

const AuctionDashboard = () => {
  const [players,        setPlayers]        = useState([]);
  const [franchise,      setFranchise]      = useState(null);
  const [activePlayer,   setActivePlayer]   = useState(null);
  const [allFranchises,  setAllFranchises]  = useState([]);
  const [notification,   setNotification]   = useState(null);
  const navigate = useNavigate();

  const franchiseId   = localStorage.getItem('franchiseId');
  const franchiseName = localStorage.getItem('franchiseName');
  const prevBidRef    = useRef(0);

  const notify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchData = async () => {
    try {
      const [pRes, fRes, allFRes] = await Promise.all([
        fetch('https://springboot-players-2.onrender.com/players'),
        fetch(`https://springboot-franchises.onrender.com/franchises/${franchiseId}`),
        fetch('https://springboot-franchises.onrender.com/franchises'),
      ]);
      const pData   = await pRes.json();
      const fData   = await fRes.json();
      const allData = await allFRes.json();
      const playerList = Array.isArray(pData) ? pData : [];
      setPlayers(playerList);
      setFranchise(fData);
      setAllFranchises(Array.isArray(allData) ? allData : []);

      const active = playerList.find(p => p.status === 'AVAILABLE');
      if (active) {
        if (active.soldPrice && active.soldPrice > prevBidRef.current) {
          if (active.boughtBy === franchiseName) notify(`✅ You are leading! ${fmt(active.soldPrice)}`);
          else if (prevBidRef.current > 0) notify(`⚠️ Outbid by ${active.boughtBy}!`, 'error');
          prevBidRef.current = active.soldPrice || 0;
        }
        setActivePlayer(active);
      } else { setActivePlayer(null); prevBidRef.current = 0; }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (!franchiseId) { navigate('/login-franchise'); return; }
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, [franchiseId]);

  const handleBid = async () => {
    if (!activePlayer || !franchise) return;
    const currentPrice = activePlayer.soldPrice || activePlayer.basicRemuneration || 0;
    let inc = 50000;
    if (currentPrice >= 10_000_000) inc = 500_000;
    else if (currentPrice >= 5_000_000) inc = 250_000;
    else if (currentPrice >= 1_000_000) inc = 100_000;
    const newBid = currentPrice + inc;
    if (newBid > (franchise.networth || 0)) { notify('❌ Insufficient purse!', 'error'); return; }
    try {
      await fetch(`https://springboot-players-2.onrender.com/players/${activePlayer.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...activePlayer, soldPrice: newBid, boughtBy: franchiseName, status: 'AVAILABLE' }),
      });
      notify(`✅ Bid placed: ${fmt(newBid)}`);
      fetchData();
    } catch { notify('Bid failed', 'error'); }
  };

  const soldPlayers  = players.filter(p => p.status === 'SOLD');
  const mySquad      = players.filter(p => p.boughtBy === franchiseName && p.status === 'SOLD');
  const totalSpent   = mySquad.reduce((a, p) => a + (p.soldPrice || 0), 0);
  const isLeading    = activePlayer?.boughtBy === franchiseName;
  const leaderColor  = activePlayer?.boughtBy ? (TEAM_COLORS[activePlayer.boughtBy] || '#3B82F6') : '#3B82F6';

  const nextBidInc = () => {
    const p = activePlayer?.soldPrice || activePlayer?.basicRemuneration || 0;
    if (p >= 10_000_000) return 500_000;
    if (p >= 5_000_000)  return 250_000;
    if (p >= 1_000_000)  return 100_000;
    return 50_000;
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=Barlow:wght@400;500;600&display=swap');
        .font-bc { font-family:'Barlow Condensed',sans-serif; }
        .font-b  { font-family:'Barlow',sans-serif; }
        @keyframes slideIn { from{transform:translateY(-14px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes liveBlip{ 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes dotPulse{ 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>

      <div className="min-h-screen bg-[#020810] text-white font-b flex flex-col pt-[60px]">

        {/* Notification */}
        {notification && (
          <div className={`fixed top-20 right-4 sm:right-6 z-[9999] px-5 py-3.5 rounded-xl text-sm font-bc font-black tracking-[1px] text-white shadow-[0_12px_40px_rgba(0,0,0,0.5)] ${notification.type === 'success' ? 'bg-gradient-to-r from-green-700 to-green-800' : 'bg-red-700'}`}
            style={{ animation:'slideIn 0.3s ease' }}>
            {notification.msg}
          </div>
        )}

        {/* Header */}
        <header className="bg-[#020810]/95 backdrop-blur-xl border-b border-white/[0.07] px-4 sm:px-6 flex items-center justify-between h-[60px] fixed top-0 left-0 right-0 z-50">
          <div className="flex items-center gap-3">
            <span className="font-bc text-[19px] font-black tracking-[2px]">CRIC<span className="text-yellow-400">AUCTION</span></span>
            <span className="font-bc text-[11px] text-white/30 tracking-[3px]">WAR ROOM</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-[7px] h-[7px] bg-red-500 rounded-full" style={{ animation:'liveBlip 1.2s ease-in-out infinite' }} />
            <span className="font-bc text-[11px] font-bold text-white/50 tracking-[2px]">LIVE</span>
          </div>
          <div className="flex items-center gap-3.5">
            <div className="text-right">
              <div className="font-bc text-[10px] text-white/35 tracking-[2px]">PURSE LEFT</div>
              <div className="font-bc text-xl font-black text-yellow-400">{fmt(franchise?.networth)}</div>
            </div>
            <button onClick={() => { localStorage.clear(); navigate('/'); }}
              className="font-bc font-bold text-[11px] tracking-[1px] text-red-500 bg-red-500/10 border border-red-500/30 px-3.5 py-1.5 rounded cursor-pointer hover:bg-red-500 hover:text-white transition-all">
              LOGOUT
            </button>
          </div>
        </header>

        {/* Sold Ticker */}
        {soldPlayers.length > 0 && (
          <div className="bg-[#0a0f1e] border-b border-white/[0.05] py-1.5 overflow-hidden">
            <div className="inline-flex whitespace-nowrap" style={{ animation:'marquee 28s linear infinite' }}>
              {[...soldPlayers,...soldPlayers].map((s,i)=>(
                <span key={i} className="font-b text-xs text-white/45 px-6">
                  🏏 <strong className="text-yellow-400">{s.name}</strong> → {s.boughtBy} <span className="text-green-400">{fmt(s.soldPrice)}</span> •
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Main Layout */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">

          {/* LEFT: Auction */}
          <div className="flex-1 p-4 sm:p-7 overflow-y-auto border-r border-white/[0.06] min-h-[500px]">
            {!activePlayer ? (
              <div className="flex flex-col items-center justify-center min-h-[400px] text-center gap-4">
                <div className="text-[72px] opacity-30">🔨</div>
                <h2 className="font-bc text-[32px] font-black text-white/30 m-0">WAITING FOR ADMIN</h2>
                <p className="text-white/20 text-sm max-w-[320px] leading-relaxed">The auctioneer hasn't put a player on the block yet. Stand by.</p>
                <div className="flex gap-2 mt-2">
                  {[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-white/20 rounded-full" style={{ animation:`dotPulse 1.4s ease-in-out ${i*0.3}s infinite` }} />)}
                </div>
              </div>
            ) : (
              <div className="max-w-[640px] mx-auto">

                {/* Player card */}
                <div className="border-2 rounded-2xl px-8 py-7 mb-5" style={{ background:`linear-gradient(135deg,${leaderColor}18,rgba(255,255,255,0.02))`, borderColor:`${leaderColor}33` }}>
                  <div className="flex justify-between items-start flex-wrap gap-3 mb-5">
                    <div>
                      <p className="font-bc text-[10px] text-white/30 tracking-[3px] mb-1.5">🔨 ON THE BLOCK</p>
                      <h1 className="font-bc text-[clamp(28px,5vw,50px)] font-black text-white leading-none tracking-tight mb-1.5">{activePlayer.name}</h1>
                      <p className="text-white/40 text-sm">🌏 {activePlayer.country} · {activePlayer.position}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bc text-[11px] text-white/35 tracking-[2px]">BASE PRICE</div>
                      <div className="font-bc text-2xl font-black text-white/60">{fmt(activePlayer.basicRemuneration)}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[{l:'T20',v:activePlayer.t20Runs||0},{l:'ODI',v:activePlayer.odiRuns||0},{l:'Avg',v:activePlayer.battingAverage||'N/A'},{l:'Wkts',v:activePlayer.wickets||0}].map(s=>(
                      <div key={s.l} className="bg-white/[0.04] rounded-xl py-2.5 text-center">
                        <div className="font-bc text-[18px] font-black text-white">{s.v}</div>
                        <div className="font-bc text-[9px] text-white/30 tracking-[2px]">{s.l}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bid display */}
                <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl px-7 py-6 mb-4 text-center">
                  <p className="font-bc text-[10px] text-white/30 tracking-[3px] mb-2">CURRENT HIGHEST BID</p>
                  <div className="font-bc text-[clamp(40px,7vw,72px)] font-black text-yellow-400 leading-none tracking-tighter">
                    {fmt(activePlayer.soldPrice || activePlayer.basicRemuneration)}
                  </div>
                  <div className="flex items-center justify-center gap-2 mt-3">
                    {activePlayer.boughtBy ? (
                      <>
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: leaderColor }} />
                        <span className={`font-bc text-[18px] font-black ${isLeading ? 'text-green-400' : 'text-white'}`}>
                          {isLeading ? '✅ YOU ARE LEADING!' : activePlayer.boughtBy}
                        </span>
                      </>
                    ) : (
                      <span className="font-b text-sm text-white/30">No bids yet — be the first!</span>
                    )}
                  </div>
                </div>

                {/* Bid button */}
                {!isLeading ? (
                  <button onClick={handleBid} disabled={!franchise}
                    className="font-bc w-full font-black text-xl tracking-[2px] text-white bg-gradient-to-r from-blue-500 to-blue-800 border-0 rounded-2xl py-5 shadow-[0_6px_24px_rgba(59,130,246,0.4)] hover:-translate-y-0.5 hover:shadow-[0_12px_36px_rgba(59,130,246,0.5)] transition-all cursor-pointer">
                    ⚡ PLACE BID — {fmt((activePlayer.soldPrice || activePlayer.basicRemuneration || 0) + nextBidInc())}
                  </button>
                ) : (
                  <div className="font-bc w-full text-center text-lg font-black text-green-400 tracking-[1px] bg-green-400/10 border-2 border-green-400/30 rounded-2xl py-5">
                    🏆 YOU'RE THE HIGHEST BIDDER — HOLD YOUR GROUND
                  </div>
                )}
                <p className="font-b text-center text-[12px] text-white/20 mt-2.5">Auto-refreshes every 2s · Admin finalizes the sale</p>
              </div>
            )}
          </div>

          {/* RIGHT: Squad + Standings */}
          <div className="w-full lg:w-[340px] overflow-y-auto px-5 py-6 flex flex-col gap-6 border-t lg:border-t-0 border-white/[0.06] bg-[#020810]">

            {/* My Squad */}
            <div>
              <p className="font-bc text-[10px] text-white/30 tracking-[3px] mb-3">MY SQUAD ({mySquad.length})</p>
              {mySquad.length === 0 ? (
                <p className="font-b text-sm text-white/20 text-center py-4">No players acquired yet</p>
              ) : mySquad.map(p => (
                <div key={p.id} className="flex justify-between items-center px-3 py-2.5 rounded-xl mb-1.5 bg-white/[0.03] border border-green-400/15">
                  <div>
                    <div className="font-bc text-sm font-bold text-white">{p.name}</div>
                    <div className="font-b text-[11px] text-white/35">{p.position}</div>
                  </div>
                  <div className="font-bc text-sm font-black text-green-400">{fmt(p.soldPrice)}</div>
                </div>
              ))}
              {mySquad.length > 0 && (
                <div className="flex justify-between px-3 py-2.5 border-t border-white/[0.07] mt-1 text-sm">
                  <span className="font-b text-white/40">Total Spent</span>
                  <span className="font-bc font-black text-red-400 text-base">{fmt(totalSpent)}</span>
                </div>
              )}
            </div>

            {/* Franchise purses */}
            <div>
              <p className="font-bc text-[10px] text-white/30 tracking-[3px] mb-3">FRANCHISE PURSES</p>
              {allFranchises.map(f => {
                const tc    = TEAM_COLORS[f.franchiseName] || '#3B82F6';
                const isMe  = f.franchiseName === franchiseName;
                return (
                  <div key={f.id} className="flex justify-between items-center px-3 py-2.5 rounded-xl mb-1.5" style={{ background: isMe ? `${tc}18` : 'rgba(255,255,255,0.02)', border:`1px solid ${isMe ? tc+'40' : 'rgba(255,255,255,0.05)'}` }}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: tc }} />
                      <span className={`font-bc text-[13px] tracking-[0.3px] ${isMe ? 'font-bold text-white' : 'font-normal text-white/60'}`}>
                        {f.franchiseName}{isMe && <span className="text-[10px] text-white/30 ml-1.5">(YOU)</span>}
                      </span>
                    </div>
                    <span className="font-bc text-sm font-black text-yellow-400">{fmt(f.networth)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AuctionDashboard;