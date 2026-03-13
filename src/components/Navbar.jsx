import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [auctionLive, setAuctionLive] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [notifications, setNotifications] = useState(0);

  const userRole = localStorage.getItem('userRole');
  const franchiseName = localStorage.getItem('franchiseName');
  const userEmail = localStorage.getItem('userEmail');

  // Throttled scroll handler
  const handleScroll = useCallback(() => {
    requestAnimationFrame(() => setScrolled(window.scrollY > 20));
  }, []);

  useEffect(() => {
    const throttledScroll = () => handleScroll();
    window.addEventListener('scroll', throttledScroll, { passive: true });
    return () => window.removeEventListener('scroll', throttledScroll);
  }, [handleScroll]);

  // Auction polling
  useEffect(() => {
    const checkAuction = async () => {
      try {
        const res = await fetch('https://springboot-players-2.onrender.com/players');
        if (res.ok) {
          const players = await res.json();
          setAuctionLive(Array.isArray(players) && players.some(p => p.status === 'SOLD'));
          setNotifications(players.filter(p => p.status === 'PENDING').length);
        }
      } catch { }
    };
    checkAuction();
    const interval = setInterval(checkAuction, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setIsOpen(false);
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;
  const closeMobileMenu = () => setIsOpen(false);

  return (
    <>
      {/* Main Navbar - FIXED ALIGNMENT WITH AUCTION BANNER INSIDE */}
      <nav className={`
        fixed top-0 left-0 right-0 z-50 backdrop-blur-xl transition-all duration-300 ease-in-out flex flex-col
        ${scrolled
          ? 'bg-slate-900/98 shadow-2xl border-b border-slate-700/50'
          : 'bg-slate-900/90 border-b border-slate-800/30'
        }
      `}>
        {/* Live Auction Banner */}
        {auctionLive && (
          <div className="bg-gradient-to-r from-red-600 via-red-500 to-red-600 px-4 sm:px-6 py-1.5 text-center backdrop-blur-sm relative z-50 flex-shrink-0">
            <span className="inline-block animate-pulse font-bold text-xs uppercase tracking-widest text-white">
              🔴 AUCTION LIVE — BIDS OPEN NOW 🔴
            </span>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex items-center justify-between h-16 lg:h-20">

            {/* Logo - Left Aligned - FIXED FOR MOBILE */}
            <Link
              to="/"
              className="flex items-center gap-2 flex-shrink-0 group hover:scale-[1.02] transition-transform duration-200"
              onClick={closeMobileMenu}
            >
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200 flex-shrink-0">
                <span className="text-lg lg:text-2xl">🏏</span>
              </div>
              {/* Show text on all screens but smaller on mobile */}
              <span className="text-lg lg:text-2xl font-black tracking-tight whitespace-nowrap text-white">
                CRIC<span className="text-amber-400">AUCTION</span>
              </span>

            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {/* Home */}
              <Link
                to="/"
                className={`
                  flex items-center px-4 py-2 font-semibold text-sm uppercase tracking-wider transition-all duration-200 h-full
                  ${isActive('/')
                    ? 'text-amber-400 border-b-2 border-amber-400 bg-amber-500/5'
                    : 'text-slate-300 hover:text-amber-400 hover:border-amber-400/60 border-b-2 border-transparent hover:bg-slate-800/50'
                  }
                  rounded-t-lg
                `}
              >
                HOME
              </Link>

              {/* Franchise Section */}
              {userRole === 'FRANCHISE' && (
                <>
                  <div className="px-2">
                    <span className="text-xs text-slate-500 font-medium uppercase tracking-widest -mb-1 block">AUCTION</span>
                  </div>
                  <Link
                    to="/dashboard-franchise"
                    className={`
                      flex items-center px-4 py-2 font-semibold text-sm uppercase tracking-wider transition-all duration-200 h-full
                      ${isActive('/dashboard-franchise')
                        ? 'text-amber-400 border-b-2 border-amber-400 bg-amber-500/5'
                        : 'text-slate-300 hover:text-amber-400 hover:border-amber-400/60 border-b-2 border-transparent hover:bg-slate-800/50'
                      }
                      rounded-t-lg
                    `}
                  >
                    DASHBOARD
                  </Link>
                  <Link
                    to="/live-auction"
                    className={`
                      flex items-center px-4 py-2 font-semibold text-sm uppercase tracking-wider transition-all duration-200 h-full relative
                      ${isActive('/live-auction')
                        ? 'text-red-400 border-b-2 border-red-400 bg-red-500/10'
                        : 'text-slate-300 hover:text-red-400 hover:border-red-400/60 border-b-2 border-transparent hover:bg-red-500/5'
                      }
                      rounded-t-lg
                    `}
                  >
                    ⚡ WAR ROOM
                    {auctionLive && (
                      <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse shadow-sm">
                        LIVE
                      </span>
                    )}
                  </Link>
                </>
              )}

              {/* Player */}
              {userRole === 'PLAYER' && (
                <Link
                  to="/dashboard-player"
                  className={`
                    flex items-center px-4 py-2 font-semibold text-sm uppercase tracking-wider transition-all duration-200 h-full
                    ${isActive('/dashboard-player')
                      ? 'text-amber-400 border-b-2 border-amber-400 bg-amber-500/5'
                      : 'text-slate-300 hover:text-amber-400 hover:border-amber-400/60 border-b-2 border-transparent hover:bg-slate-800/50'
                    }
                    rounded-t-lg
                  `}
                >
                  MY STATUS
                </Link>
              )}

              {/* Admin */}
              {userRole === 'ADMIN' && (
                <Link
                  to="/admin-dashboard"
                  className={`
                    flex items-center px-4 py-2 font-semibold text-sm uppercase tracking-wider transition-all duration-200 h-full
                    ${isActive('/admin-dashboard')
                      ? 'text-red-400 border-b-2 border-red-400 bg-red-500/10'
                      : 'text-red-300/80 hover:text-red-400 hover:border-red-400/60 border-b-2 border-transparent hover:bg-red-500/5'
                    }
                    rounded-t-lg
                  `}
                >
                  🛡️ CONTROL ROOM
                </Link>
              )}
            </div>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center gap-3 xl:gap-4 ml-8 border-l border-slate-800/30 pl-6 xl:pl-8 flex-shrink-0">
              {!userRole ? (
                <div className="flex items-center gap-2 xl:gap-3">
                  <Link to="/login-player" className="text-sm text-slate-300 hover:text-slate-100 font-medium px-2 py-2 transition-colors duration-200">
                    Register as Player
                  </Link>
                  <Link
                    to="/signup-player"
                    className="px-4 py-2.5 text-sm font-semibold text-white border border-white/20 rounded-lg hover:border-white/40 hover:bg-white/5 transition-all duration-200"
                  >
                    REGISTER
                  </Link>
                  <Link
                    to="/login-franchise"
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-sm font-bold text-white rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                  >
                    Franchise Login
                  </Link>
                  <Link
                    to="/admin-login"
                    className="px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-slate-400 border border-slate-700/50 rounded-md hover:text-red-400 hover:border-red-400/50 hover:bg-red-500/10 transition-all duration-200 ml-1"
                  >
                    ⚙ ADMIN
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-3 xl:gap-4">
                  {/* Notifications */}
                  {notifications > 0 && (
                    <div className="relative">
                      <button className="p-2 text-slate-300 hover:text-white transition-colors rounded-lg hover:bg-slate-800/50" aria-label="Notifications">
                        <span className="text-xl">🔔</span>
                      </button>
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg animate-pulse">
                        {notifications}
                      </span>
                    </div>
                  )}

                  {/* User Profile */}
                  <div className="flex items-center gap-3 pr-4 border-r border-slate-800/30">
                    <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg ring-1 ring-amber-400/30">
                      <span className="text-lg font-semibold">👤</span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold uppercase tracking-wider truncate text-amber-400">
                        {userRole === 'FRANCHISE' ? franchiseName?.slice(0, 12) + '...' : userRole === 'ADMIN' ? 'ADMIN' : 'PLAYER'}
                      </div>
                      <div className="text-xs text-slate-400 truncate max-w-[120px]">{userEmail}</div>
                    </div>
                  </div>

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500 text-red-300 hover:text-red-100 font-semibold text-sm rounded-lg shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200 whitespace-nowrap"
                  >
                    LOGOUT
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Hamburger - IMPROVED TOUCH TARGETS */}
            <button
              className="lg:hidden p-2 ml-auto flex flex-col gap-1.5 w-12 h-12 min-w-[48px] min-h-[48px] rounded-lg 
                       hover:bg-slate-800/50 active:bg-slate-700/50 transition-all duration-200"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle mobile menu"
              aria-expanded={isOpen}
            >
              <span className={`w-full h-0.5 bg-white rounded transition-all duration-300 origin-center ease-in-out
                ${isOpen ? 'rotate-45 translate-y-2 w-6' : 'w-6'}`} />
              <span className={`w-full h-0.5 bg-white rounded transition-all duration-300 ease-in-out
                ${isOpen ? 'opacity-0 w-0 translate-x-1' : 'w-6'}`} />
              <span className={`w-full h-0.5 bg-white rounded transition-all duration-300 origin-center ease-in-out
                ${isOpen ? '-rotate-45 -translate-y-2 w-6' : 'w-6'}`} />
            </button>
          </div>
        </div>

        {/* Mobile Menu - FIXED HEIGHT */}
        {isOpen && (
          <div className="lg:hidden bg-slate-900/98 border-t border-slate-700/50 backdrop-blur-xl shadow-2xl overflow-y-auto
            max-h-[calc(100vh-6.5rem)] sm:max-h-[calc(100vh-7.5rem)]">
            <div className="px-6 pb-8 pt-6 space-y-4">
              {!userRole ? (
                <>
                  <Link
                    to="/login-player"
                    className="block w-full text-center py-4 px-6 bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-600/50 rounded-xl text-white font-semibold text-base hover:from-slate-600 hover:to-slate-700 hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl"
                    onClick={closeMobileMenu}
                  >
                    Register as Player
                  </Link>
                  <Link
                    to="/login-franchise"
                    className="block w-full text-center py-4 px-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold text-lg rounded-xl shadow-2xl hover:shadow-3xl hover:scale-[1.02] transition-all duration-200"
                    onClick={closeMobileMenu}
                  >
                    Franchise Login
                  </Link>
                  <Link
                    to="/admin-login"
                    className="block w-full text-center py-3.5 px-6 border-2 border-slate-600/50 text-slate-300 font-bold text-sm uppercase tracking-widest rounded-xl hover:border-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
                    onClick={closeMobileMenu}
                  >
                    ⚙ Admin Access
                  </Link>
                </>
              ) : (
                <>
                  {userRole === 'FRANCHISE' && auctionLive && (
                    <Link
                      to="/live-auction"
                      className="block w-full text-center py-4 px-6 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold text-lg rounded-xl shadow-2xl hover:shadow-3xl hover:scale-[1.02] transition-all duration-200 relative overflow-hidden"
                      onClick={closeMobileMenu}
                    >
                      ⚡ Enter War Room
                      <span className="absolute inset-0 bg-white/20 animate-shimmer -skew-x-12"></span>
                    </Link>
                  )}

                  <div className="bg-gradient-to-br from-slate-800/70 to-slate-900/70 border border-slate-700/50 rounded-2xl p-6 text-center shadow-xl backdrop-blur-sm">
                    <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center shadow-2xl ring-2 ring-amber-400/40">
                      <span className="text-3xl font-bold">👤</span>
                    </div>
                    <div className="font-bold text-xl uppercase tracking-wider text-amber-400 mb-1">
                      {franchiseName || userRole}
                    </div>
                    <div className="text-sm text-slate-400 max-w-[200px] mx-auto">{userEmail}</div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full py-4 px-6 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold text-lg rounded-xl shadow-2xl hover:shadow-3xl hover:scale-[1.02] transition-all duration-200 border border-transparent hover:border-red-700/50"
                  >
                    LOGOUT
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Spacer - FIXED HEIGHT */}
      <div className={`
        h-16 lg:h-20 
        ${auctionLive ? '!h-24 lg:!h-32' : ''} 
        transition-all duration-300
      `} />
    </>
  );
};

export default Navbar;
