import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const AdminPanel = () => {
  const [loading,   setLoading]   = useState(false);
  const [stats,     setStats]     = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const navigate = useNavigate();

  const fetchStats = async () => {
    try {
      const [pRes, fRes] = await Promise.all([
        fetch('https://springboot-players-2.onrender.com/players'),
        fetch('https://springboot-franchises.onrender.com/franchises'),
      ]);
      const players    = await pRes.json();
      const franchises = await fRes.json();
      const pList = Array.isArray(players)    ? players    : [];
      const fList = Array.isArray(franchises) ? franchises : [];
      setStats({
        total:      pList.length,
        sold:       pList.filter(p => p.status === 'SOLD').length,
        available:  pList.filter(p => p.status === 'AVAILABLE').length,
        unsold:     pList.filter(p => p.status === 'UNSOLD').length,
        totalSpend: pList.filter(p => p.status === 'SOLD').reduce((a,p) => a+(p.soldPrice||0), 0),
        franchises: fList.length,
      });
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchStats(); }, []);

  const handleReset = async () => {
    if (!confirmed) { setConfirmed(true); return; }
    setLoading(true);
    try {
      await fetch('https://springboot-franchises.onrender.com/franchises/reset-auction', { method: 'POST' });
      const pRes    = await fetch('https://springboot-players-2.onrender.com/players');
      const players = await pRes.json();
      await Promise.all((Array.isArray(players) ? players : []).map(p =>
        fetch(`https://springboot-players-2.onrender.com/players/${p.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...p, status: 'AVAILABLE', soldPrice: 0, boughtBy: null }),
        })
      ));
      alert('✅ Auction fully reset. All players available, all purses restored.');
      setConfirmed(false);
      fetchStats();
    } catch (e) { alert('Reset failed: ' + e.message); }
    finally { setLoading(false); }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=Barlow:wght@400;500;600&display=swap');
        .font-bc { font-family:'Barlow Condensed',sans-serif; }
        .font-b  { font-family:'Barlow',sans-serif; }
      `}</style>

      <div className="min-h-screen bg-[#020810] text-white font-b flex flex-col items-center px-6 py-16 pt-24">

        <div className="text-center mb-12">
          <div className="text-[56px] mb-3">⚙️</div>
          <h1 className="font-bc text-[48px] font-black text-red-500 tracking-tight mb-2">ADMIN PANEL</h1>
          <p className="text-white/40 text-[15px] mb-5">Auction management utilities</p>
          <button onClick={() => navigate('/admin-dashboard')}
            className="font-bc font-black text-sm tracking-[1px] text-white bg-gradient-to-r from-blue-500 to-blue-800 border-0 px-7 py-3 rounded-lg shadow-[0_4px_16px_rgba(59,130,246,0.35)] hover:-translate-y-0.5 transition-all cursor-pointer">
            🔨 ENTER AUCTION CONTROL ROOM →
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 mb-10 max-w-[560px] w-full">
            {[
              { l:'Total Players', v:stats.total,              c:'text-blue-400',   b:'border-blue-500/20' },
              { l:'Sold',          v:stats.sold,               c:'text-green-400',  b:'border-green-500/20' },
              { l:'Available',     v:stats.available,          c:'text-yellow-400', b:'border-yellow-500/20' },
              { l:'Unsold',        v:stats.unsold,             c:'text-red-400',    b:'border-red-500/20' },
              { l:'Franchises',    v:stats.franchises,         c:'text-purple-400', b:'border-purple-500/20', cl:'col-span-2 sm:col-span-1' },
              { l:'Total Spend',   v:fmt(stats.totalSpend),    c:'text-orange-400', b:'border-orange-500/20', sm:true, cl:'col-span-2 sm:col-span-1' },
            ].map(s => (
              <div key={s.l} className={`bg-white/[0.03] border ${s.b} rounded-xl p-4 text-center ${s.cl || ''}`}>
                <div className={`font-bc ${s.sm ? 'text-lg' : 'text-3xl'} font-black ${s.c}`}>{s.v}</div>
                <div className="font-bc text-[10px] text-white/35 tracking-[2px] mt-1">{s.l.toUpperCase()}</div>
              </div>
            ))}
          </div>
        )}

        {/* Reset */}
        <div className="bg-red-500/[0.05] border border-red-500/20 rounded-2xl p-8 max-w-[460px] w-full text-center">
          <div className="text-[40px] mb-3">☢️</div>
          <h3 className="font-bc text-[28px] font-black text-red-500 mb-2.5">FULL AUCTION RESET</h3>
          <p className="text-white/40 text-sm leading-relaxed mb-6">
            Clears all squads, resets all franchise purses to default, and marks all players as AVAILABLE. Cannot be undone.
          </p>
          {confirmed && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2.5 mb-4 text-sm text-red-400 font-semibold">
              ⚠️ Click again to confirm. This will wipe all auction data.
            </div>
          )}
          <button onClick={handleReset} disabled={loading}
            className={`font-bc w-full font-black text-sm tracking-[2px] text-white border-0 rounded-xl py-4 transition-all ${loading ? 'bg-red-500/30 cursor-not-allowed' : confirmed ? 'bg-red-600 hover:bg-red-700 cursor-pointer shadow-[0_4px_16px_rgba(239,68,68,0.35)]' : 'bg-red-500/15 border border-red-500/40 text-red-500 cursor-pointer hover:bg-red-500/25'}`}>
            {loading ? '⏳ RESETTING...' : confirmed ? '☢️ YES, RESET EVERYTHING' : '☢️ RESET AUCTION'}
          </button>
          {confirmed && (
            <button onClick={() => setConfirmed(false)}
              className="font-b w-full mt-2 bg-transparent border-0 text-white/30 text-sm cursor-pointer hover:text-white/60 transition-colors">
              Cancel
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminPanel;