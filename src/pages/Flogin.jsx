import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Flogin = () => {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('https://springboot-franchises.onrender.com/franchises');
      if (!res.ok) throw new Error('Server error');
      const franchises = await res.json();
      if (!Array.isArray(franchises)) throw new Error('Invalid response');
      const user = franchises.find(f => f.email === email && f.password === password);
      if (user) {
        localStorage.setItem('userRole',      'FRANCHISE');
        localStorage.setItem('franchiseId',   user.id);
        localStorage.setItem('franchiseName', user.franchiseName);
        localStorage.setItem('userEmail',     user.email);
        navigate('/dashboard-franchise');
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

      <div className="min-h-screen bg-gradient-to-br from-[#04091c] via-[#060d24] to-[#04091c] flex items-center justify-center px-4 py-6 relative font-b">

        {/* BG dots */}
        <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage:'radial-gradient(rgba(59,130,246,0.07) 1px,transparent 1px)', backgroundSize:'32px 32px' }} />
        <div className="fixed top-[30%] left-[8%] w-[350px] h-[350px] bg-blue-500/[0.06] rounded-full blur-[100px] pointer-events-none" />
        <div className="fixed bottom-[20%] right-[8%] w-[250px] h-[250px] bg-yellow-400/[0.05] rounded-full blur-[80px] pointer-events-none" />

        <div className="w-full max-w-[440px] relative z-10">

          {/* Logo + heading */}
          <div className="text-center mb-9">
            <Link to="/" className="no-underline block mb-6">
              <span className="font-bc text-[22px] font-black text-white tracking-[2px]">
                CRIC<span className="text-yellow-400">AUCTION</span>
              </span>
            </Link>
            <div className="w-[68px] h-[68px] bg-gradient-to-br from-blue-700 to-blue-900 rounded-[18px] flex items-center justify-center text-3xl mx-auto mb-5 shadow-[0_8px_28px_rgba(29,78,216,0.45)]">
              🏟️
            </div>
            <h1 className="font-bc text-[38px] font-black text-white tracking-tight mb-2">FRANCHISE LOGIN</h1>
            <p className="text-white/40 text-sm">Enter the auction room. Build your dynasty.</p>
          </div>

          {/* Card */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl px-8 py-9 backdrop-blur-xl">
            <form onSubmit={handleLogin} className="flex flex-col gap-5">

              <div>
                <label className="font-bc block text-[11px] font-bold text-white/45 tracking-[2px] mb-2">CORPORATE EMAIL</label>
                <input
                  type="email" placeholder="franchise@company.com" value={email} required
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  className="w-full bg-white/[0.05] border border-white/[0.12] rounded-xl px-4 py-3.5 text-white text-sm font-b outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all"
                />
              </div>

              <div>
                <label className="font-bc block text-[11px] font-bold text-white/45 tracking-[2px] mb-2">PASSWORD</label>
                <input
                  type="password" placeholder="••••••••" value={password} required
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  className="w-full bg-white/[0.05] border border-white/[0.12] rounded-xl px-4 py-3.5 text-white text-sm font-b outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2.5 text-red-400 text-sm">
                  ⚠️ {error}
                </div>
              )}

              <button
                type="submit" disabled={loading}
                className={`font-bc font-black text-sm tracking-[2px] text-white border-0 rounded-xl py-4 mt-1 transition-all duration-200 ${loading ? 'bg-blue-800/50 cursor-not-allowed' : 'bg-gradient-to-r from-blue-500 to-blue-800 shadow-[0_6px_20px_rgba(59,130,246,0.35)] hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(59,130,246,0.5)] cursor-pointer'}`}
              >
                {loading ? '⏳ CONNECTING...' : '🏟️ ENTER AUCTION ROOM'}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-white/[0.07] text-center">
              <p className="text-white/40 text-sm">
                New team joining?{' '}
                <Link to="/signup-franchise" className="text-blue-400 font-bold no-underline hover:text-blue-300 transition-colors">Register franchise →</Link>
              </p>
            </div>
          </div>

          <p className="text-center mt-5 text-sm text-white/30">
            Are you a player?{' '}
            <Link to="/login-player" className="text-green-400 font-semibold no-underline hover:text-green-300 transition-colors">Player login →</Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default Flogin;