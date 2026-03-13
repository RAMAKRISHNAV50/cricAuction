import { useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const PlayerDashboard = () => {
  const [player,     setPlayer]     = useState(null);
  const [prevStatus, setPrevStatus] = useState(null);
  const [justSold,   setJustSold]   = useState(false);
  const playerId = localStorage.getItem('playerId');

  const fetchPlayerData = async () => {
    try {
      const res = await fetch(`https://springboot-players-2.onrender.com/players/${playerId}`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      if (prevStatus && prevStatus !== 'SOLD' && data.status === 'SOLD') {
        setJustSold(true);
        setTimeout(() => setJustSold(false), 6000);
      }
      setPrevStatus(data.status);
      setPlayer(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (playerId) {
      fetchPlayerData();
      const interval = setInterval(fetchPlayerData, 3000);
      return () => clearInterval(interval);
    }
  }, [playerId]);

  const downloadPDF = () => {
    if (!player) return;
    const doc = new jsPDF();
    doc.setFillColor(4, 9, 28);  doc.rect(0, 0, 210, 297, 'F');
    doc.setFillColor(30, 58, 138); doc.rect(0, 0, 210, 48, 'F');
    doc.setFillColor(251, 191, 36); doc.rect(0, 46, 210, 4, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(20); doc.setFont('helvetica', 'bold');
    doc.text('PLAYER ACQUISITION AGREEMENT', 105, 22, { align: 'center' });
    doc.setFontSize(10); doc.setTextColor(200, 210, 255);
    doc.text(`Generated: ${new Date().toLocaleString()} | CRICAUCTION PLATFORM`, 105, 34, { align: 'center' });
    doc.setTextColor(251, 191, 36); doc.setFontSize(16);
    doc.text(`${player.boughtBy?.toUpperCase() || 'PENDING'} — OFFICIAL CONTRACT`, 105, 42, { align: 'center' });
    autoTable(doc, {
      startY: 58,
      head: [['FIELD', 'INFORMATION']],
      body: [
        ['Player Name', player.name], ['Country', player.country], ['Position', player.position],
        ['Age', player.age || 'N/A'], ['Mobile', player.mobile || 'N/A'],
        ['ODI Runs', player.odiRuns || '0'], ['T20 Runs', player.t20Runs || '0'],
        ['Batting Average', player.battingAverage || 'N/A'], ['Wickets', player.wickets || '0'],
        ['Base Price', `INR ${Number(player.basicRemuneration || 0).toLocaleString()}`],
        ['SOLD PRICE', `INR ${Number(player.soldPrice || 0).toLocaleString()}`],
        ['Franchise', player.boughtBy || 'Pending'], ['Status', player.status === 'SOLD' ? 'CONFIRMED' : 'PENDING'],
      ],
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 11 },
      bodyStyles: { textColor: [220, 220, 230], fillColor: [8, 16, 40], fontSize: 10 },
      alternateRowStyles: { fillColor: [12, 22, 55] },
      columnStyles: { 0: { fontStyle: 'bold', textColor: [251, 191, 36], cellWidth: 70 } },
      styles: { lineColor: [30, 58, 138], lineWidth: 0.5 },
    });
    const finalY = doc.lastAutoTable.finalY || 150;
    doc.setFillColor(12, 22, 55); doc.rect(14, finalY + 8, 182, 80, 'F');
    doc.setDrawColor(30, 58, 138); doc.rect(14, finalY + 8, 182, 80, 'S');
    doc.setTextColor(251, 191, 36); doc.setFontSize(10); doc.setFont('helvetica', 'bold');
    doc.text('LEGAL TERMS & CONDITIONS', 105, finalY + 18, { align: 'center' });
    const clauses = ['1. Exclusivity to Franchise.','2. Payment in Installments.','3. Medical Fitness required.','4. Code of Conduct adherence.','5. Image Rights usage.','6. Anti-Corruption compliance.','7. Official Kit usage.','8. Injury Insurance provided.','9. Travel arrangements covered.','10. Mandatory Training attendance.','11. Social Media restrictions.','12. Brand exclusivity.','13. Promotional availability.','14. Performance Bonuses applicable.','15. Termination rights reserved.','16. Confidentiality of salary.','17. Transfer window rules apply.','18. Drug Testing consent given.','19. Governing Law of Franchise City.','20. One-year extension option.'];
    doc.setTextColor(180, 190, 220); doc.setFontSize(7); doc.setFont('helvetica', 'normal');
    doc.text(clauses.join('  |  '), 19, finalY + 28, { maxWidth: 172 });
    const sigY = finalY + 96;
    doc.setDrawColor(100, 120, 200); doc.line(20, sigY, 90, sigY); doc.line(120, sigY, 190, sigY);
    doc.setTextColor(180, 190, 220); doc.setFontSize(8);
    doc.text('Player Signature', 55, sigY + 6, { align: 'center' });
    doc.text('Franchise Representative', 155, sigY + 6, { align: 'center' });
    doc.save(`${player.name.replace(/\s/g, '_')}_Contract_${Date.now()}.pdf`);
  };

  if (!player) return (
    <div className="min-h-screen bg-[#04091c] flex flex-col items-center justify-center gap-4">
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div className="w-12 h-12 border-2 border-blue-500/30 border-t-blue-500 rounded-full" style={{ animation:'spin 0.8s linear infinite' }} />
      <p className="text-white/40 text-sm">Loading your profile...</p>
    </div>
  );

  const stats = [
    { label:'ODI Runs',    value:player.odiRuns||0,           color:'text-blue-400',   border:'border-blue-500/20',  icon:'🏏' },
    { label:'T20 Runs',    value:player.t20Runs||0,           color:'text-purple-400', border:'border-purple-500/20',icon:'⚡' },
    { label:'Batting Avg', value:player.battingAverage||'N/A',color:'text-yellow-400', border:'border-yellow-500/20',icon:'📊' },
    { label:'Wickets',     value:player.wickets||0,           color:'text-red-400',    border:'border-red-500/20',   icon:'🎳' },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=Barlow:wght@400;500;600&display=swap');
        .font-bc { font-family:'Barlow Condensed',sans-serif; }
        .font-b  { font-family:'Barlow',sans-serif; }
        @keyframes spin        { to{transform:rotate(360deg)} }
        @keyframes soldBoom    { 0%{transform:scale(0.8);opacity:0} 60%{transform:scale(1.05)} 100%{transform:scale(1);opacity:1} }
        @keyframes tickScroll  { 0%{transform:translateX(100%)} 100%{transform:translateX(-100%)} }
        @keyframes pulseWait   { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .sold-boom { animation: soldBoom 0.5s ease forwards; }
      `}</style>

      <div className="min-h-screen bg-[#04091c] font-b">

        {/* SOLD BANNER */}
        {justSold && (
          <div className="sold-boom fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-green-700 to-green-800 border-2 border-green-400 rounded-2xl px-6 py-4 sm:px-9 text-center shadow-[0_20px_60px_rgba(22,163,74,0.5)] w-[90%] sm:w-auto">
            <div className="font-bc text-3xl font-black text-white tracking-wide">🎉 YOU'VE BEEN SOLD!</div>
            <div className="text-green-200 text-sm mt-1">Check your contract below</div>
          </div>
        )}

        {/* Ticker */}
        <div className="bg-white/[0.03] border-b border-white/[0.06] py-2 overflow-hidden mt-[64px] lg:mt-[80px]">
          <div className="flex items-center whitespace-nowrap" style={{ animation:'tickScroll 20s linear infinite' }}>
            <span className="font-bc bg-yellow-400 text-black px-3 py-0.5 rounded text-[11px] font-black tracking-[2px] mr-6 shrink-0">LIVE STATUS</span>
            <span className="font-b text-[13px] text-white/50">
              {player.status === 'SOLD'
                ? `🏆 Acquired by ${player.boughtBy} for ₹${Number(player.soldPrice).toLocaleString()} · Contract ready · Congratulations ${player.name}!`
                : `⏳ ${player.name} · Status: ${player.status} · Base: ₹${Number(player.basicRemuneration).toLocaleString()} · Waiting for franchise bids...`}
            </span>
          </div>
        </div>

        <div className="max-w-[900px] mx-auto px-4 sm:px-5 py-9">

          {/* Header */}
          <div className="flex justify-between items-start flex-wrap gap-4 mb-9">
            <div>
              <p className="font-bc text-[11px] font-bold text-white/35 tracking-[3px] mb-1.5">PLAYER DASHBOARD</p>
              <h1 className="font-bc text-[clamp(28px,5vw,48px)] font-black text-white leading-none tracking-tight mb-1.5">{player.name}</h1>
              <p className="text-white/50 text-sm">🌏 {player.country} · {player.position}{player.age ? ` · ${player.age} yrs` : ''}</p>
            </div>
            <div className="text-right">
              <p className="font-bc text-[10px] text-white/30 tracking-[2px] mb-2">AUCTION STATUS</p>
              <span className={`inline-block font-bc font-black text-sm tracking-[2px] px-5 py-2 rounded-full border ${player.status === 'SOLD' ? 'bg-green-500/15 text-green-400 border-green-400/40' : 'bg-yellow-400/15 text-yellow-400 border-yellow-400/40'}`}>
                {player.status === 'SOLD' ? '✅ SOLD' : '🔄 AVAILABLE'}
              </span>
              <p className="font-b text-[10px] text-white/25 mt-1.5">Auto-refreshes every 3s</p>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-7">
            <h3 className="font-bc text-[13px] font-bold text-white/35 tracking-[3px] mb-4">CAREER STATISTICS</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {stats.map(s => (
                <div key={s.label} className={`bg-white/[0.03] border ${s.border} rounded-2xl p-4 text-center hover:-translate-y-1 transition-transform`}>
                  <div className="text-2xl mb-2">{s.icon}</div>
                  <div className={`font-bc text-[clamp(20px,3vw,28px)] font-black ${s.color} leading-none`}>{s.value}</div>
                  <div className="font-bc text-[10px] text-white/35 tracking-[2px] mt-1">{s.label.toUpperCase()}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-3 mb-7">
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl px-5 py-5">
              <p className="font-bc text-[10px] text-white/35 tracking-[2px] mb-2">BASE PRICE</p>
              <p className="font-bc text-3xl font-black text-yellow-400 leading-none">₹{Number(player.basicRemuneration).toLocaleString()}</p>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl px-5 py-5">
              <p className="font-bc text-[10px] text-white/35 tracking-[2px] mb-2">MOBILE LINKED</p>
              <p className="font-b text-xl font-bold text-white">{player.mobile}</p>
            </div>
          </div>

          {/* Status Panel */}
          {player.status === 'SOLD' ? (
            <div className="bg-gradient-to-br from-green-600/10 to-green-800/5 border-2 border-green-400/35 rounded-2xl p-9 text-center">
              <div className="text-5xl mb-4">🏆</div>
              <h2 className="font-bc text-[clamp(24px,4vw,38px)] font-black text-green-400 tracking-tight mb-2">CONGRATULATIONS!</h2>
              <p className="text-white/60 text-base mb-1">You have been acquired by</p>
              <p className="font-bc text-[clamp(20px,3vw,30px)] font-black text-white mb-5">{player.boughtBy}</p>
              <div className="font-bc text-[clamp(36px,6vw,64px)] font-black text-green-400 tracking-tight leading-none mb-7">
                ₹{Number(player.soldPrice).toLocaleString()}
              </div>
              <button
                onClick={downloadPDF}
                className="font-bc font-black text-sm tracking-[2px] text-white bg-gradient-to-r from-green-600 to-green-800 border-0 px-10 py-4 rounded-xl shadow-[0_8px_24px_rgba(22,163,74,0.35)] hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(22,163,74,0.5)] transition-all cursor-pointer"
              >
                📥 DOWNLOAD OFFICIAL CONTRACT (PDF)
              </button>
            </div>
          ) : (
            <div className="bg-yellow-400/[0.05] border border-yellow-400/20 rounded-2xl p-9 text-center">
              <div className="text-5xl mb-4">⏳</div>
              <h2 className="font-bc text-3xl font-black text-yellow-400 tracking-wider mb-3" style={{ animation:'pulseWait 2s ease-in-out infinite' }}>
                AUCTION IS LIVE
              </h2>
              <p className="text-white/45 text-base leading-relaxed">
                Franchises are reviewing player pools right now.<br />
                This page auto-refreshes every <strong className="text-yellow-400">3 seconds</strong>. You'll be notified the moment a bid is confirmed.
              </p>
              <div className="flex justify-center gap-2 mt-6">
                {[0,1,2].map(i => (
                  <div key={i} className="w-2 h-2 bg-yellow-400 rounded-full" style={{ animation:`pulseWait 1.4s ease-in-out ${i*0.3}s infinite` }} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PlayerDashboard;