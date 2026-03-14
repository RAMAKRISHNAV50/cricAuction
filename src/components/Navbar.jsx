import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen,      setIsOpen]      = useState(false);
  const [auctionLive, setAuctionLive] = useState(false);
  const [scrolled,    setScrolled]    = useState(false);

  const userRole      = localStorage.getItem('userRole');
  const franchiseName = localStorage.getItem('franchiseName');
  const userEmail     = localStorage.getItem('userEmail');

  useEffect(() => {
    const onScroll = () => requestAnimationFrame(() => setScrolled(window.scrollY > 20));
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const checkAuction = async () => {
      try {
        const res = await fetch('https://springboot-players-2.onrender.com/players');
        if (res.ok) {
          const players = await res.json();
          setAuctionLive(Array.isArray(players) && players.some(p => p.status === 'SOLD'));
        }
      } catch { /* silent */ }
    };
    checkAuction();
    const interval = setInterval(checkAuction, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.clear();
    setIsOpen(false);
    navigate('/');
  }, [navigate]);

  const isActive = (path) => location.pathname === path;
  const close    = ()     => setIsOpen(false);

  const navLinkCls = (path, red = false) => {
    const active = isActive(path);
    if (red) return `px-4 py-2 text-sm font-bold uppercase tracking-wider transition-all rounded-t-lg border-b-2 ${
      active ? 'text-red-400 border-red-400 bg-red-500/5' : 'text-slate-300 border-transparent hover:text-red-400 hover:border-red-400/50 hover:bg-red-500/5'
    }`;
    return `px-4 py-2 text-sm font-bold uppercase tracking-wider transition-all rounded-t-lg border-b-2 ${
      active ? 'text-amber-400 border-amber-400 bg-amber-500/5' : 'text-slate-300 border-transparent hover:text-amber-400 hover:border-amber-400/50 hover:bg-slate-800/40'
    }`;
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=Barlow:wght@400;500;600&display=swap');
      `}</style>

      <nav className={`fixed top-0 left-0 right-0 z-50 flex flex-col backdrop-blur-xl transition-all duration-300 ${
        scrolled ? 'bg-slate-900/98 shadow-2xl border-b border-slate-700/50' : 'bg-slate-900/92 border-b border-slate-800/30'
      }`}>

        {/* Live Banner */}
        {auctionLive && (
          <div className="bg-gradient-to-r from-red-700 via-red-500 to-red-700 py-1.5 text-center">
            <span className="animate-pulse font-bold text-xs uppercase tracking-widest text-white">
              🔴 &nbsp;AUCTION LIVE — BIDS OPEN NOW&nbsp; 🔴
            </span>
          </div>
        )}

        {/* Main bar */}
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-[68px]">

            {/* Logo */}
            <Link to="/" onClick={close}
              className="flex items-center gap-2.5 shrink-0 group hover:scale-[1.02] transition-transform">
              <div className="w-9 h-9 lg:w-10 lg:h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shrink-0">
                <span className="text-lg lg:text-xl">🏏</span>
              </div>
              <span className="text-lg lg:text-2xl font-black tracking-tight text-white whitespace-nowrap"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                CRIC<span className="text-amber-400">AUCTION</span>
              </span>
            </Link>

            {/* Desktop centre links */}
            <div className="hidden lg:flex items-center h-full">
              <Link to="/" className={navLinkCls('/')}>Home</Link>

              {userRole === 'FRANCHISE' && <>
                <Link to="/dashboard-franchise" className={navLinkCls('/dashboard-franchise')}>Dashboard</Link>
                <Link to="/live-auction" className={navLinkCls('/live-auction', true)}>
                  ⚡ War Room
                  {auctionLive && <span className="ml-2 px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-black rounded-full animate-pulse">LIVE</span>}
                </Link>
              </>}
              {userRole === 'PLAYER' && <Link to="/dashboard-player" className={navLinkCls('/dashboard-player')}>My Status</Link>}
              {userRole === 'ADMIN'  && <Link to="/admin-dashboard"  className={navLinkCls('/admin-dashboard', true)}>🛡️ Control Room</Link>}
            </div>

            {/* Desktop right actions */}
            <div className="hidden lg:flex items-center gap-3 shrink-0 pl-6 border-l border-slate-800/40">

              {/* Not logged in — Player Login | Franchise Login | Admin */}
              {!userRole && (
                <div className="flex items-center gap-2.5">
                  <Link to="/login-player"
                    className="px-4 py-2 text-sm font-semibold text-slate-300 border border-slate-600/60 rounded-xl hover:border-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-200 whitespace-nowrap">
                    Player Login
                  </Link>
                  <Link to="/login-franchise"
                    className="px-5 py-2 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-sm font-bold text-white rounded-xl shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all duration-200 whitespace-nowrap">
                    Franchise Login
                  </Link>
                  <Link to="/admin-login"
                    className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-500 border border-slate-700/50 rounded-lg hover:text-red-400 hover:border-red-400/40 hover:bg-red-500/8 transition-all duration-200 whitespace-nowrap">
                    ⚙ Admin
                  </Link>
                </div>
              )}

              {/* Logged in */}
              {userRole && (
                <div className="flex items-center gap-3">
                  {/* User badge */}
                  <div className="flex items-center gap-2.5 pr-3 border-r border-slate-700/50">
                    <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow ring-1 ring-amber-400/30 shrink-0">
                      <span className="text-sm">👤</span>
                    </div>
                    <div className="min-w-0">
                      <div className={`text-xs font-black uppercase tracking-wider truncate max-w-[140px] ${userRole === 'ADMIN' ? 'text-red-400' : 'text-amber-400'}`}>
                        {userRole === 'FRANCHISE' ? franchiseName : userRole === 'ADMIN' ? '⚙️ Admin' : 'Player'}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[140px]">{userEmail}</div>
                    </div>
                  </div>
                  <button onClick={handleLogout}
                    className="px-4 py-2 text-sm font-bold text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-200 whitespace-nowrap">
                    Logout
                  </button>
                </div>
              )}
            </div>

            {/* Hamburger — mobile only */}
            <button onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu"
              className="lg:hidden ml-3 w-11 h-11 flex flex-col items-center justify-center gap-1.5 rounded-xl hover:bg-slate-800/60 active:bg-slate-700/60 transition-all shrink-0">
              <span className={`w-6 h-0.5 bg-white rounded transition-all duration-300 origin-center ${isOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`w-6 h-0.5 bg-white rounded transition-all duration-300 ${isOpen ? 'opacity-0 scale-x-0' : ''}`} />
              <span className={`w-6 h-0.5 bg-white rounded transition-all duration-300 origin-center ${isOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </button>
          </div>
        </div>

        {/* ── MOBILE MENU ────────────────────────────────────────────────────── */}
        {isOpen && (
          <div className="lg:hidden bg-slate-900/98 border-t border-slate-700/50 backdrop-blur-xl overflow-y-auto"
            style={{ maxHeight: 'calc(100vh - 68px)' }}>
            <div className="px-5 py-6 flex flex-col gap-3">

              {/* Not logged in */}
              {!userRole && (
                <>
                  {/* Page links */}
                  <Link to="/" onClick={close}
                    className={`py-3 px-4 rounded-xl font-bold text-sm text-center transition-colors ${isActive('/') ? 'bg-amber-500/10 text-amber-400 border border-amber-400/30' : 'text-slate-300 hover:bg-slate-800/50'}`}>
                    Home
                  </Link>

                  {/* Auth buttons */}
                  <Link to="/login-player" onClick={close}
                    className="w-full py-3.5 px-5 text-center font-semibold text-sm text-white border border-slate-600/60 rounded-xl hover:border-slate-400 hover:bg-slate-800/50 transition-all">
                    🏏 Player Login
                  </Link>
                  <Link to="/login-franchise" onClick={close}
                    className="w-full py-3.5 px-5 text-center font-bold text-sm text-white bg-gradient-to-r from-blue-500 to-blue-700 rounded-xl shadow-lg hover:from-blue-600 hover:to-blue-800 transition-all">
                    🏟️ Franchise Login
                  </Link>
                  <Link to="/admin-login" onClick={close}
                    className="w-full py-3 px-5 text-center font-bold text-xs uppercase tracking-widest text-slate-500 border border-slate-700/40 rounded-xl hover:text-red-400 hover:border-red-400/40 hover:bg-red-500/5 transition-all">
                    ⚙ Admin Access
                  </Link>
                </>
              )}

              {/* Logged in */}
              {userRole && (
                <>
                  {/* Nav links */}
                  <Link to="/" onClick={close}
                    className={`py-3 px-4 rounded-xl font-bold text-sm text-center transition-colors ${isActive('/') ? 'bg-amber-500/10 text-amber-400 border border-amber-400/30' : 'text-slate-300 hover:bg-slate-800/50'}`}>
                    Home
                  </Link>

                  {userRole === 'FRANCHISE' && <>
                    <Link to="/dashboard-franchise" onClick={close}
                      className={`py-3 px-4 rounded-xl font-bold text-sm text-center transition-colors ${isActive('/dashboard-franchise') ? 'bg-amber-500/10 text-amber-400 border border-amber-400/30' : 'text-slate-300 hover:bg-slate-800/50'}`}>
                      Dashboard
                    </Link>
                    <Link to="/live-auction" onClick={close}
                      className="w-full py-3.5 px-5 text-center font-bold text-sm text-white bg-gradient-to-r from-red-500 to-red-700 rounded-xl shadow-lg hover:from-red-600 hover:to-red-800 transition-all">
                      ⚡ Enter War Room
                      {auctionLive && <span className="ml-2 px-1.5 py-0.5 bg-white text-red-600 text-[10px] font-black rounded-full">LIVE</span>}
                    </Link>
                  </>}

                  {userRole === 'PLAYER' && (
                    <Link to="/dashboard-player" onClick={close}
                      className={`py-3 px-4 rounded-xl font-bold text-sm text-center transition-colors ${isActive('/dashboard-player') ? 'bg-amber-500/10 text-amber-400 border border-amber-400/30' : 'text-slate-300 hover:bg-slate-800/50'}`}>
                      My Status
                    </Link>
                  )}

                  {userRole === 'ADMIN' && (
                    <Link to="/admin-dashboard" onClick={close}
                      className="w-full py-3.5 px-5 text-center font-bold text-sm text-white bg-gradient-to-r from-red-500 to-red-700 rounded-xl shadow-lg hover:from-red-600 hover:to-red-800 transition-all">
                      🛡️ Admin Control Room
                    </Link>
                  )}

                  {/* User info */}
                  <div className="bg-slate-800/50 border border-slate-700/40 rounded-2xl p-4 text-center">
                    <div className="w-14 h-14 mx-auto mb-2 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow ring-2 ring-amber-400/30">
                      <span className="text-2xl">👤</span>
                    </div>
                    <div className={`font-black text-base uppercase tracking-wider mb-0.5 ${userRole === 'ADMIN' ? 'text-red-400' : 'text-amber-400'}`}>
                      {userRole === 'FRANCHISE' ? franchiseName : userRole === 'ADMIN' ? '⚙️ Admin' : 'Player'}
                    </div>
                    <div className="text-xs text-slate-500 break-all">{userEmail}</div>
                  </div>

                  <button onClick={handleLogout}
                    className="w-full py-3.5 px-5 font-bold text-sm text-white bg-gradient-to-r from-red-500 to-red-600 rounded-xl shadow-lg hover:from-red-600 hover:to-red-700 transition-all border-0">
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Spacer to clear fixed navbar */}
      <div className={`transition-all duration-300 ${auctionLive ? 'h-[104px] lg:h-[112px]' : 'h-16 lg:h-[68px]'}`} />
    </>
  );
};

export default Navbar;