import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const ADMIN_EMAIL    = 'admin@cricauction.com';
const ADMIN_PASSWORD = 'admin@123';

const AdminLogin = () => {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [shake,    setShake]    = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      if (email.trim() === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        localStorage.setItem('userRole',  'ADMIN');
        localStorage.setItem('userEmail', email.trim());
        navigate('/admin-dashboard');
      } else {
        setError('Invalid credentials. Access denied.');
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setLoading(false);
      }
    }, 700);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=Barlow:wght@400;500;600&display=swap');
        .font-bc { font-family: 'Barlow Condensed', sans-serif; }
        .font-b  { font-family: 'Barlow', sans-serif; }
        input::placeholder { color: rgba(255,255,255,0.2); }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes shake   { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)} }
        .fade-up  { animation: fadeUp 0.45s ease forwards; }
        .do-shake { animation: shake 0.4s ease; }
        .spinner  { width:15px;height:15px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spin 0.7s linear infinite;display:inline-block; }
      `}</style>

      <div className="min-h-screen bg-[#04091c] flex items-center justify-center px-4 py-6 relative overflow-hidden font-b">

        {/* Grid BG */}
        <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage:'radial-gradient(rgba(255,255,255,0.03) 1px,transparent 1px)', backgroundSize:'28px 28px' }} />
        {/* Red glow */}
        <div className="fixed top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[280px] bg-red-500/[0.07] rounded-full blur-[100px] pointer-events-none" />
        {/* Corner accents */}
        <div className="fixed top-0 left-0 w-24 h-0.5 bg-gradient-to-r from-red-500 to-transparent pointer-events-none" />
        <div className="fixed top-0 left-0 w-0.5 h-24 bg-gradient-to-b from-red-500 to-transparent pointer-events-none" />
        <div className="fixed bottom-0 right-0 w-24 h-0.5 bg-gradient-to-l from-red-500 to-transparent pointer-events-none" />
        <div className="fixed bottom-0 right-0 w-0.5 h-24 bg-gradient-to-t from-red-500 to-transparent pointer-events-none" />

        <div className="fade-up w-full max-w-[400px] relative z-10">

          {/* Logo */}
          <Link to="/" className="no-underline flex items-center justify-center gap-2.5 mb-8">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-800 rounded-lg flex items-center justify-center text-sm">🏏</div>
            <span className="font-bc text-xl font-black text-white tracking-[2px]">
              CRIC<span className="text-yellow-400">AUCTION</span>
            </span>
          </Link>

          {/* Card */}
          <div className="bg-white/[0.025] border border-white/[0.08] rounded-2xl px-8 py-9 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.5)]">

            {/* Header */}
            <div className="text-center mb-7">
              <div className="w-[60px] h-[60px] mx-auto mb-4 bg-red-500/10 border border-red-500/25 rounded-[14px] flex items-center justify-center text-3xl">
                🛡️
              </div>
              <h1 className="font-bc text-[30px] font-black text-white tracking-[0.5px] mb-1.5">ADMIN LOGIN</h1>
              <p className="text-white/35 text-[13px]">Restricted. Authorised personnel only.</p>
            </div>

            <form onSubmit={handleLogin} className="flex flex-col gap-4">

              <div>
                <label className="font-bc block text-[10px] font-bold text-white/40 tracking-[2.5px] mb-2">ADMIN EMAIL</label>
                <input
                  type="email" placeholder="admin@cricauction.com" value={email} required
                  autoComplete="username"
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-4 py-3.5 text-white text-sm font-b outline-none focus:border-red-500/60 focus:ring-2 focus:ring-red-500/10 transition-all"
                />
              </div>

              <div>
                <label className="font-bc block text-[10px] font-bold text-white/40 tracking-[2.5px] mb-2">PASSWORD</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'} placeholder="••••••••" value={password} required
                    autoComplete="current-password"
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-4 py-3.5 pr-12 text-white text-sm font-b outline-none focus:border-red-500/60 focus:ring-2 focus:ring-red-500/10 transition-all"
                  />
                  <button
                    type="button" onClick={() => setShowPass(p => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-transparent border-0 cursor-pointer text-white/30 hover:text-white/70 transition-colors text-base leading-none p-0"
                  >
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {error && (
                <div className={`${shake ? 'do-shake' : ''} bg-red-500/[0.08] border border-red-500/30 rounded-lg px-4 py-2.5 text-red-400 text-[13px] flex items-center gap-2`}>
                  🚫 {error}
                </div>
              )}

              <button
                type="submit" disabled={loading}
                className={`font-bc font-black text-sm tracking-[2px] text-white border-0 rounded-lg py-3.5 mt-1 flex items-center justify-center gap-2.5 transition-all duration-200 ${loading ? 'bg-red-500/40 cursor-not-allowed' : 'bg-gradient-to-r from-red-500 to-red-800 shadow-[0_4px_16px_rgba(239,68,68,0.35)] hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(239,68,68,0.5)] cursor-pointer'}`}
              >
                {loading ? <><span className="spinner" /> VERIFYING...</> : '🛡️  ENTER CONTROL ROOM'}
              </button>
            </form>

            <div className="border-t border-white/[0.07] mt-6 pt-4">
              <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg px-4 py-3 text-center">
                <p className="font-b text-[11px] text-white/22 leading-relaxed">
                  Default: <span className="text-white/45">admin@cricauction.com</span> / <span className="text-white/45">admin@123</span><br />
                  <span className="text-[10px] text-white/15">Edit credentials in AdminLogin.jsx before going live.</span>
                </p>
              </div>
            </div>
          </div>

          <div className="text-center mt-5">
            <Link to="/" className="font-b text-[13px] text-white/25 no-underline hover:text-white/60 transition-colors">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminLogin;