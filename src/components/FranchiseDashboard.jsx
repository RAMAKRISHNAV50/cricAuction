import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const FranchiseDashboard = () => {
  const [players,      setPlayers]      = useState([]);
  const [franchise,    setFranchise]    = useState(null);
  const [view,         setView]         = useState('bidding');
  const [search,       setSearch]       = useState('');
  const [filterPos,    setFilterPos]    = useState('ALL');
  const [bidModal,     setBidModal]     = useState(null);
  const [bidAmount,    setBidAmount]    = useState('');
  const [bidLoading,   setBidLoading]   = useState(false);
  const [notification, setNotification] = useState(null);
  const navigate = useNavigate();

  const currentFranchiseName = localStorage.getItem('franchiseName');
  const franchiseId          = localStorage.getItem('franchiseId');
  const prevSoldCount        = useRef(0);

  const showNotif = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchData = async () => {
    try {
      const [pRes, fRes] = await Promise.all([
        fetch('https://springboot-players-2.onrender.com/players'),
        fetch(`https://springboot-franchises.onrender.com/franchises/${franchiseId}`),
      ]);
      const pData = await pRes.json();
      const fData = await fRes.json();
      const playerList = Array.isArray(pData) ? pData : [];
      const soldCount = playerList.filter(p => p.boughtBy === currentFranchiseName).length;
      if (soldCount > prevSoldCount.current && prevSoldCount.current > 0) showNotif('🏆 New player acquired!');
      prevSoldCount.current = soldCount;
      setPlayers(playerList);
      setFranchise(fData);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleBid = async () => {
    if (!bidModal) return;
    const player = bidModal;
    const minBid = (player.soldPrice || player.basicRemuneration || 0) + 1;
    const amount = Number(bidAmount);
    if (!amount || amount < minBid) { showNotif(`❌ Bid must be above ${fmt(minBid)}`, 'error'); return; }
    if (amount > (franchise?.networth || 0)) { showNotif('❌ Insufficient purse!', 'error'); return; }
    setBidLoading(true);
    try {
      const pRes = await fetch(`https://springboot-players-2.onrender.com/players/${player.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...player, status: 'SOLD', soldPrice: amount, boughtBy: currentFranchiseName }),
      });
      if (!pRes.ok) throw new Error();
      await fetch(`https://springboot-franchises.onrender.com/franchises/${franchiseId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...franchise, networth: franchise.networth - amount }),
      });
      showNotif(`✅ ${player.name} acquired for ${fmt(amount)}!`);
      setBidModal(null); setBidAmount(''); fetchData();
    } catch { showNotif('❌ Transaction failed. Try again.', 'error'); }
    finally { setBidLoading(false); }
  };

  const downloadPDF = () => {
    const squad = players.filter(p => p.boughtBy === currentFranchiseName);
    const doc = new jsPDF();
    doc.setFillColor(4, 9, 28); doc.rect(0, 0, 210, 297, 'F');
    doc.setFillColor(30, 58, 138); doc.rect(0, 0, 210, 52, 'F');
    doc.setFillColor(251, 191, 36); doc.rect(0, 50, 210, 4, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(22); doc.setFont('helvetica', 'bold');
    doc.text(`${currentFranchiseName?.toUpperCase()} — OFFICIAL SQUAD`, 105, 22, { align: 'center' });
    doc.setFontSize(10); doc.setTextColor(200, 210, 255);
    doc.text(`Total Players: ${squad.length}  |  Remaining Purse: ${fmt(franchise?.networth)}`, 105, 34, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleString()} | CRICAUCTION PLATFORM`, 105, 44, { align: 'center' });
    const totalSpend = squad.reduce((a, p) => a + (p.soldPrice || 0), 0);
    autoTable(doc, {
      startY: 62,
      head: [['#', 'Player Name', 'Position', 'Country', 'Acquisition Price']],
      body: squad.map((p, i) => [i + 1, p.name, p.position, p.country, fmt(p.soldPrice)]),
      foot: [['', '', '', 'TOTAL SPEND', fmt(totalSpend)]],
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 11 },
      bodyStyles: { textColor: [220, 220, 230], fillColor: [8, 16, 40], fontSize: 10 },
      alternateRowStyles: { fillColor: [12, 22, 55] },
      footStyles: { fillColor: [251, 191, 36, 50], textColor: [251, 191, 36], fontStyle: 'bold', fontSize: 11 },
      styles: { lineColor: [30, 58, 138], lineWidth: 0.5 },
    });
    doc.save(`${currentFranchiseName}_Squad_Report.pdf`);
  };

  const positions       = ['ALL', ...new Set(players.map(p => p.position).filter(Boolean))];
  const mySquad         = players.filter(p => p.boughtBy === currentFranchiseName);
  const totalSpend      = mySquad.reduce((a, p) => a + (p.soldPrice || 0), 0);
  const lastFiveSales   = players.filter(p => p.status === 'SOLD').slice(-5).reverse();

  const filteredPlayers = players.filter(p => {
    const matchView   = view === 'squad' ? p.boughtBy === currentFranchiseName : view === 'sold' ? p.status === 'SOLD' : p.status !== 'SOLD';
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase());
    const matchPos    = filterPos === 'ALL' || p.position === filterPos;
    return matchView && matchSearch && matchPos;
  });

  const viewLabels = { bidding: '🔥 Live Auction Pool', squad: `👕 My Squad (${mySquad.length})`, sold: '🏆 All Sold History' };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=Barlow:wght@400;500;600&display=swap');
        .font-bc { font-family:'Barlow Condensed',sans-serif; }
        .font-b  { font-family:'Barlow',sans-serif; }
        @keyframes slideIn { from{transform:translateY(-20px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes marquee { 0%{transform:translateX(100%)} 100%{transform:translateX(-200%)} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        input::placeholder { color:rgba(255,255,255,0.2); }
        select option { background:#0a1628; }
      `}</style>

      <div className="flex min-h-screen bg-[#04091c] font-b relative">

        {/* NOTIFICATION */}
        {notification && (
          <div className={`fixed top-20 right-4 sm:right-6 z-[9999] px-6 py-3.5 rounded-xl text-sm font-bc font-black tracking-[1px] text-white shadow-[0_12px_40px_rgba(0,0,0,0.5)] ${notification.type === 'success' ? 'bg-gradient-to-r from-green-700 to-green-800' : 'bg-gradient-to-r from-red-700 to-red-800'}`}
            style={{ animation:'slideIn 0.3s ease', maxWidth:320 }}>
            {notification.msg}
          </div>
        )}

        {/* BID MODAL */}
        {bidModal && (
          <div className="fixed inset-0 z-[9998] bg-black/85 flex items-center justify-center p-6">
            <div className="bg-[#0a1628] border border-white/10 rounded-2xl p-9 w-full max-w-[440px]" style={{ animation:'slideIn 0.3s ease' }}>
              <h2 className="font-bc text-3xl font-black text-white mb-1 tracking-tight">PLACE YOUR BID</h2>
              <p className="text-white/45 text-sm mb-6">for <strong className="text-yellow-400">{bidModal.name}</strong> — {bidModal.position}</p>

              <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl px-5 py-4 mb-5 grid grid-cols-2 gap-3">
                <div>
                  <p className="font-bc text-[10px] text-white/30 tracking-[2px] mb-1">CURRENT PRICE</p>
                  <p className="font-bc text-[22px] font-black text-yellow-400">{fmt(bidModal.soldPrice || bidModal.basicRemuneration)}</p>
                </div>
                <div>
                  <p className="font-bc text-[10px] text-white/30 tracking-[2px] mb-1">YOUR PURSE</p>
                  <p className="font-bc text-[22px] font-black text-green-400">{fmt(franchise?.networth)}</p>
                </div>
              </div>

              <div className="mb-5">
                <label className="font-bc block text-[11px] font-bold text-white/45 tracking-[2px] mb-2">YOUR BID AMOUNT (₹)</label>
                <input
                  type="number" value={bidAmount} onChange={e => setBidAmount(e.target.value)}
                  placeholder={`Min: ${fmt(Number(bidModal.soldPrice || bidModal.basicRemuneration) + 1)}`}
                  className="w-full bg-white/[0.05] border border-white/[0.12] rounded-xl px-4 py-3.5 text-white text-xl font-bc font-black outline-none focus:border-yellow-400/60 focus:ring-2 focus:ring-yellow-400/15 transition-all"
                />
              </div>

              <div className="flex gap-3">
                <button onClick={() => { setBidModal(null); setBidAmount(''); }}
                  className="flex-1 font-bc font-bold text-sm tracking-[1px] text-white/60 bg-white/[0.05] border border-white/10 rounded-xl py-3.5 cursor-pointer hover:bg-white/[0.1] transition-colors">
                  CANCEL
                </button>
                <button onClick={handleBid} disabled={bidLoading}
                  className={`flex-[2] font-bc font-black text-sm tracking-[1px] text-white border-0 rounded-xl py-3.5 transition-all ${bidLoading ? 'bg-blue-800/40 cursor-not-allowed' : 'bg-gradient-to-r from-blue-500 to-blue-800 cursor-pointer hover:-translate-y-0.5'}`}>
                  {bidLoading ? '⏳ PROCESSING...' : '⚡ CONFIRM BID'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SIDEBAR */}
        <aside className="w-full lg:w-[220px] bg-[#04091c] lg:bg-white/[0.02] border-b lg:border-b-0 lg:border-r border-white/[0.06] flex flex-row lg:flex-col fixed lg:fixed top-[64px] lg:top-0 left-0 lg:h-screen z-40 lg:pt-[70px] transition-all overflow-x-auto lg:overflow-visible items-center lg:items-stretch">
          <div className="flex-1 px-4 py-3 lg:py-5 flex lg:block gap-3">
            <p className="font-bc text-[9px] font-bold text-white/25 tracking-[3px] mb-3">NAVIGATION</p>

            {[
              { key:'bidding', icon:'🔥', label:'Live Auction' },
              { key:'squad',   icon:'👕', label:`My Squad` },
              { key:'sold',    icon:'🏆', label:'Sold History' },
            ].map(item => (
              <button key={item.key} onClick={() => setView(item.key)}
                className={`font-bc flex items-center gap-2.5 w-auto lg:w-full rounded-xl px-3.5 py-2 lg:py-3 mb-0 lg:mb-1.5 text-sm font-bold tracking-[0.5px] text-left transition-all border whitespace-nowrap ${view === item.key ? 'bg-blue-500/15 border-blue-500/30 text-white' : 'bg-transparent border-transparent text-white/50 hover:bg-white/[0.08] hover:text-white'}`}>
                <span>{item.icon}</span><span>{item.label} {item.key === 'squad' && `(${mySquad.length})`}</span>
              </button>
            ))}

            <button onClick={() => navigate('/live-auction')}
              className="font-bc flex items-center gap-2.5 w-auto lg:w-full bg-red-500/20 border border-red-500/35 text-red-500 rounded-xl px-3.5 py-2 lg:py-3.5 mt-0 lg:mt-4 text-sm font-black tracking-[1px] hover:bg-red-500/30 transition-colors cursor-pointer whitespace-nowrap">
              <span>⚡</span><span>WAR ROOM</span>
            </button>
          </div>

          <div className="hidden lg:block px-4 py-4 border-t border-white/[0.06]">
            <p className="font-bc text-[9px] text-white/25 tracking-[3px] mb-1.5">PURSE REMAINING</p>
            <p className="font-bc text-[22px] font-black text-yellow-400 leading-none mb-1">{fmt(franchise?.networth)}</p>
            <p className="font-b text-[10px] text-white/30 mb-3">Total Spent: {fmt(totalSpend)}</p>
            <button onClick={() => { localStorage.clear(); navigate('/'); }}
              className="font-bc w-full text-xs font-bold tracking-[1px] text-red-500/70 bg-transparent border border-red-500/30 rounded-lg py-2 cursor-pointer hover:bg-red-500/10 transition-colors">
              LOGOUT
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <main className="ml-0 lg:ml-[220px] flex-1 px-4 sm:px-6 pt-[140px] lg:pt-7 pb-28 min-h-screen">

          {/* Header */}
          <div className="flex justify-between items-center flex-wrap gap-4 mb-7">
            <div>
              <p className="font-bc text-[10px] text-white/30 tracking-[3px] mb-1">{currentFranchiseName?.toUpperCase()}</p>
              <h1 className="font-bc text-[32px] font-black text-white tracking-tight">{viewLabels[view]}</h1>
            </div>
            <div className="flex gap-3 items-center flex-wrap">
              {view === 'squad' && (
                <button onClick={downloadPDF}
                  className="font-bc font-bold text-sm tracking-[1px] text-green-400 bg-green-500/15 border border-green-400/35 px-5 py-2.5 rounded-xl cursor-pointer hover:bg-green-500/25 transition-colors">
                  📥 DOWNLOAD PDF
                </button>
              )}
              <input type="text" placeholder="Search players..." value={search} onChange={e => setSearch(e.target.value)}
                className="font-b bg-white/[0.05] border border-white/10 rounded-lg px-3.5 py-2.5 text-white text-sm outline-none w-44 focus:border-blue-500/50 transition-colors" />
              <select value={filterPos} onChange={e => setFilterPos(e.target.value)}
                className="font-b bg-[#0a1628] border border-white/10 rounded-lg px-3.5 py-2.5 text-white text-sm outline-none focus:border-blue-500/50 transition-colors">
                {positions.map(p => <option key={p}>{p}</option>)}
              </select>
              <div className="flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.07] rounded-lg px-3 py-2">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full" style={{ animation:'spin 2s linear infinite' }} />
                <span className="font-b text-[11px] text-white/40">LIVE</span>
              </div>
            </div>
          </div>

          {/* Grid */}
          {filteredPlayers.length === 0 ? (
            <div className="font-bc text-center py-20 text-white/25 text-2xl font-bold">
              {view === 'squad' ? '🏏 No players acquired yet. Start bidding!' : '🔍 No players match your search.'}
            </div>
          ) : (
            <div className="grid gap-4" style={{ gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))' }}>
              {filteredPlayers.map(p => {
                const isMine = p.boughtBy === currentFranchiseName;
                const isSold = p.status === 'SOLD';
                return (
                  <div key={p.id} className={`bg-white/[0.02] border rounded-2xl overflow-hidden flex flex-col hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.5)] transition-all ${isMine ? 'border-green-400/30' : isSold ? 'border-red-500/20' : 'border-white/[0.07]'}`}>

                    <div className={`px-5 pt-5 pb-3.5 border-b border-white/[0.05] ${isMine ? 'bg-green-500/[0.08]' : 'bg-white/[0.02]'}`}>
                      <div className="flex justify-between items-start mb-1.5">
                        <h3 className="font-bc text-xl font-black text-white tracking-tight">{p.name}</h3>
                        {isMine && <span className="font-bc bg-green-400/15 text-green-400 border border-green-400/30 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-[1px] shrink-0">MINE</span>}
                      </div>
                      <p className="font-b text-xs text-white/40">{p.position} · 🌏 {p.country}</p>
                    </div>

                    <div className="grid grid-cols-3 bg-white/[0.04] px-5 py-2.5 gap-0">
                      {[{l:'T20',v:p.t20Runs||0},{l:'Avg',v:p.battingAverage||'N/A'},{l:'Wkts',v:p.wickets||0}].map(s=>(
                        <div key={s.l} className="text-center">
                          <div className="font-bc text-[15px] font-black text-white">{s.v}</div>
                          <div className="font-bc text-[9px] text-white/30 tracking-[2px]">{s.l}</div>
                        </div>
                      ))}
                    </div>

                    <div className="px-5 py-3.5 mt-auto">
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <p className="font-bc text-[9px] text-white/30 tracking-[2px] mb-0.5">{isSold ? 'SOLD FOR' : 'BASE PRICE'}</p>
                          <p className={`font-bc text-[22px] font-black leading-none ${isSold ? 'text-green-400' : 'text-yellow-400'}`}>{fmt(isSold ? p.soldPrice : p.basicRemuneration)}</p>
                        </div>
                        {isSold && p.boughtBy && !isMine && (
                          <div className="text-right">
                            <p className="font-bc text-[9px] text-white/30 tracking-[2px] mb-0.5">BOUGHT BY</p>
                            <p className="font-b text-xs font-bold text-red-400">{p.boughtBy}</p>
                          </div>
                        )}
                      </div>

                      {isSold ? (
                        <div className={`font-bc text-center py-2.5 rounded-xl text-sm font-bold tracking-[1px] border ${isMine ? 'bg-green-400/10 border-green-400/25 text-green-400' : 'bg-red-500/[0.08] border-red-500/20 text-red-400'}`}>
                          {isMine ? '✅ ACQUIRED BY YOU' : `SOLD TO ${p.boughtBy}`}
                        </div>
                      ) : (
                        <button onClick={() => { setBidModal(p); setBidAmount(''); }}
                          className="font-bc w-full font-black text-sm tracking-[1px] text-white bg-gradient-to-r from-blue-500 to-blue-800 border-0 py-3 rounded-xl cursor-pointer shadow-[0_4px_16px_rgba(59,130,246,0.3)] hover:-translate-y-0.5 transition-all">
                          ⚡ PLACE BID
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* BOTTOM TICKER */}
        <footer className="fixed bottom-0 left-0 lg:left-[220px] right-0 bg-[#020814] border-t-2 border-yellow-400/30 py-2.5 overflow-hidden z-40">
          <div className="inline-flex items-center whitespace-nowrap" style={{ animation:'marquee 35s linear infinite' }}>
            <span className="font-bc bg-yellow-400 text-black px-3.5 py-0.5 rounded text-[11px] font-black tracking-[2px] mr-7 shrink-0">LATEST SALES</span>
            {lastFiveSales.length > 0 ? lastFiveSales.map(s => (
              <span key={s.id} className="font-b mr-10 text-[13px] text-white/60">
                🏏 <strong className="text-yellow-400">{s.name}</strong>{' '}
                <span className="text-green-400 font-bold">SOLD</span> → {s.boughtBy} for {fmt(s.soldPrice)} &nbsp;•
              </span>
            )) : (
              <span className="font-b text-[13px] text-white/40">Auction is live. No sales yet — waiting for bids...</span>
            )}
          </div>
        </footer>
      </div>
    </>
  );
};

export default FranchiseDashboard;