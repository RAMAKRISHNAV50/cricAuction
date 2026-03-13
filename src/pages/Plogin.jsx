import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';

const Plogin = () => {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const successMsg = location.state?.success;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('https://springboot-players-2.onrender.com/players');
      if (!res.ok) throw new Error('Server error');
      const players = await res.json();
      if (!Array.isArray(players)) throw new Error('Invalid response');
      const user = players.find(p => p.email === email && p.password === password);
      if (user) {
        localStorage.setItem('userRole',  'PLAYER');
        localStorage.setItem('playerId',  user.id);
        localStorage.setItem('userEmail', user.email);
        navigate('/dashboard-player');
      } else {
        setError('Invalid email or password. Please try again.');
      }
    } catch {
      setError('Could not connect to server. Check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=Barlow:wght@400;500;600&display=swap');
        .font-bc { font-family: 'Barlow Condensed', sans-serif; }
        .font-b  { font-family: 'Barlow', sans-serif; }
        input::placeholder { color: rgba(255,255,255,0.2); }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-[#021a0a] via-[#032d12] to-[#021a0a] flex items-center justify-center px-4 py-6 relative font-b">

        <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage:'radial-gradient(rgba(34,197,94,0.06) 1px,transparent 1px)', backgroundSize:'32px 32px' }} />
        <div className="fixed top-[20%] right-[10%] w-[300px] h-[300px] bg-green-500/[0.05] rounded-full blur-[80px] pointer-events-none" />

        <div className="w-full max-w-[420px] relative z-10">

          <div className="text-center mb-9">
            <Link to="/" className="no-underline block mb-6">
              <span className="font-bc text-[22px] font-black text-white tracking-[2px]">
                CRIC<span className="text-yellow-400">AUCTION</span>
              </span>
            </Link>
            <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-green-800 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-5 shadow-[0_8px_24px_rgba(22,163,74,0.4)]">
              🏏
            </div>
            <h1 className="font-bc text-[36px] font-black text-white tracking-tight mb-2">PLAYER LOGIN</h1>
            <p className="text-white/40 text-sm">Access your auction status & contract</p>
          </div>

          {successMsg && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 mb-5 text-green-400 text-sm font-semibold text-center">
              ✅ {successMsg}
            </div>
          )}

          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl px-8 py-9 backdrop-blur-xl">
            <form onSubmit={handleLogin} className="flex flex-col gap-5">

              <div>
                <label className="font-bc block text-[11px] font-bold text-white/45 tracking-[2px] mb-2">EMAIL ADDRESS</label>
                <input
                  type="email" placeholder="your@email.com" value={email} required
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  className="w-full bg-white/[0.05] border border-white/[0.12] rounded-xl px-4 py-3.5 text-white text-sm font-b outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/15 transition-all"
                />
              </div>

              <div>
                <label className="font-bc block text-[11px] font-bold text-white/45 tracking-[2px] mb-2">PASSWORD</label>
                <input
                  type="password" placeholder="••••••••" value={password} required
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  className="w-full bg-white/[0.05] border border-white/[0.12] rounded-xl px-4 py-3.5 text-white text-sm font-b outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/15 transition-all"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2.5 text-red-400 text-sm">
                  ⚠️ {error}
                </div>
              )}

              <button
                type="submit" disabled={loading}
                className={`font-bc font-black text-sm tracking-[2px] text-white border-0 rounded-xl py-4 mt-1 transition-all duration-200 ${loading ? 'bg-green-800/50 cursor-not-allowed' : 'bg-gradient-to-r from-green-600 to-green-800 shadow-[0_6px_20px_rgba(22,163,74,0.35)] hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(22,163,74,0.4)] cursor-pointer'}`}
              >
                {loading ? '⏳ SIGNING IN...' : '🏏 VIEW MY STATUS'}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-white/[0.07] text-center">
              <p className="text-white/40 text-sm">
                Not in the auction pool?{' '}
                <Link to="/signup-player" className="text-green-400 font-bold no-underline hover:text-green-300 transition-colors">Register here →</Link>
              </p>
            </div>
          </div>

          <p className="text-center mt-5 text-sm text-white/30">
            Are you a franchise?{' '}
            <Link to="/login-franchise" className="text-blue-400 font-semibold no-underline hover:text-blue-300 transition-colors">Franchise login →</Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default Plogin;