import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const POSITIONS = ['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper', 'Wicket-Keeper Batsman'];
const COUNTRIES = ['India', 'Australia', 'England', 'Pakistan', 'South Africa', 'New Zealand', 'West Indies', 'Sri Lanka', 'Bangladesh', 'Afghanistan', 'Zimbabwe', 'Ireland', 'Other'];

const inputCls = (err) =>
  `w-full bg-white/[0.05] border rounded-lg px-3.5 py-3 text-white text-sm font-b outline-none transition-all ${err ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' : 'border-white/[0.12] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15'}`;

const selectCls = (err) =>
  `w-full bg-[#0d1526] border rounded-lg px-3.5 py-3 text-white text-sm font-b outline-none transition-all ${err ? 'border-red-500' : 'border-white/[0.12] focus:border-blue-500'}`;

const SectionDivider = ({ label, color }) => (
  <div className="flex items-center gap-3 mb-5">
    <div className="h-px flex-1 bg-white/[0.08]" />
    <span className={`font-bc text-[11px] font-bold tracking-[3px] ${color}`}>{label}</span>
    <div className="h-px flex-1 bg-white/[0.08]" />
  </div>
);

const Psignup = () => {
  const [formData, setFormData] = useState({
    name:'', email:'', password:'', confirmPassword:'',
    country:'', position:'', age:'', mobile:'',
    basicRemuneration:'', averagePerformance:'',
    odiRuns:'', t20Runs:'', wickets:'', battingAverage:'',
  });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const set = (k, v) => { setFormData(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); };

  const validate = () => {
    const e = {};
    if (!formData.name.trim()) e.name = 'Name is required';
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Valid email required';
    if (formData.password.length < 6) e.password = 'Min 6 characters';
    if (formData.password !== formData.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (!formData.country)  e.country  = 'Select a country';
    if (!formData.position) e.position = 'Select a position';
    if (!formData.age || formData.age < 15 || formData.age > 50) e.age = 'Age must be 15–50';
    if (!formData.mobile.match(/^\d{10}$/)) e.mobile = '10-digit number required';
    if (!formData.basicRemuneration || Number(formData.basicRemuneration) < 500000) e.basicRemuneration = 'Min base price ₹5,00,000';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const res = await fetch('https://springboot-players-2.onrender.com/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name, email: formData.email, password: formData.password,
          country: formData.country, position: formData.position,
          age: Number(formData.age), mobile: formData.mobile,
          basicRemuneration: Number(formData.basicRemuneration),
          averagePerformance: Number(formData.averagePerformance),
          odiRuns: Number(formData.odiRuns) || 0,
          t20Runs: Number(formData.t20Runs) || 0,
          wickets: Number(formData.wickets) || 0,
          battingAverage: Number(formData.battingAverage) || 0,
          status: 'AVAILABLE', soldPrice: 0, boughtBy: null,
        }),
      });
      if (res.ok) navigate('/login-player', { state: { success: 'Registration successful! Please log in.' } });
      else alert('Server error: Could not register.');
    } catch { alert('Network error: Backend not reachable.'); }
    finally { setLoading(false); }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=Barlow:wght@400;500;600&display=swap');
        .font-bc { font-family: 'Barlow Condensed', sans-serif; }
        .font-b  { font-family: 'Barlow', sans-serif; }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.2); }
        select option { background: #0d1526; }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-[#04091c] via-[#0a1628] to-[#04091c] flex justify-center px-4 py-10 font-b relative">
        <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage:'radial-gradient(rgba(59,130,246,0.06) 1px,transparent 1px)', backgroundSize:'32px 32px' }} />

        <div className="w-full max-w-[780px] relative z-10">

          {/* Header */}
          <div className="text-center mb-9">
            <div className="inline-flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-800 rounded-xl flex items-center justify-center text-xl">🏏</div>
              <span className="font-bc text-[22px] font-black text-white tracking-[2px]">CRIC<span className="text-yellow-400">AUCTION</span></span>
            </div>
            <h1 className="font-bc text-[42px] font-black text-white tracking-tight leading-none mb-2">PLAYER REGISTRATION</h1>
            <p className="text-white/40 text-sm">Enter the auction pool. Get discovered by 10 franchises.</p>
          </div>

          {/* Card */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl px-9 py-10 backdrop-blur-xl">
            <form onSubmit={handleSubmit} className="flex flex-col gap-0">

              {/* Personal Details */}
              <div className="mb-8">
                <SectionDivider label="PERSONAL DETAILS" color="text-blue-500" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label:'Full Name',        name:'name',            type:'text',     ph:'Virat Kohli' },
                    { label:'Email Address',    name:'email',           type:'email',    ph:'player@example.com' },
                    { label:'Password',         name:'password',        type:'password', ph:'Min 6 characters' },
                    { label:'Confirm Password', name:'confirmPassword', type:'password', ph:'Repeat password' },
                    { label:'Age',              name:'age',             type:'number',   ph:'25' },
                    { label:'Mobile Number',    name:'mobile',          type:'text',     ph:'10-digit number' },
                  ].map(({ label, name, type, ph }) => (
                    <div key={name}>
                      <label className="font-bc block text-[11px] font-bold text-white/45 tracking-[2px] mb-1.5">{label.toUpperCase()}</label>
                      <input type={type} placeholder={ph} value={formData[name]} onChange={e => set(name, e.target.value)}
                        className={inputCls(errors[name])} />
                      {errors[name] && <p className="text-red-400 text-[11px] mt-1">{errors[name]}</p>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Cricket Profile */}
              <div className="mb-8">
                <SectionDivider label="CRICKET PROFILE" color="text-yellow-400" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bc block text-[11px] font-bold text-white/45 tracking-[2px] mb-1.5">COUNTRY</label>
                    <select value={formData.country} onChange={e => set('country', e.target.value)} className={selectCls(errors.country)}>
                      <option value="">Select Country</option>
                      {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                    {errors.country && <p className="text-red-400 text-[11px] mt-1">{errors.country}</p>}
                  </div>
                  <div>
                    <label className="font-bc block text-[11px] font-bold text-white/45 tracking-[2px] mb-1.5">PLAYING POSITION</label>
                    <select value={formData.position} onChange={e => set('position', e.target.value)} className={selectCls(errors.position)}>
                      <option value="">Select Position</option>
                      {POSITIONS.map(p => <option key={p}>{p}</option>)}
                    </select>
                    {errors.position && <p className="text-red-400 text-[11px] mt-1">{errors.position}</p>}
                  </div>
                </div>
              </div>

              {/* Career Stats */}
              <div className="mb-8">
                <SectionDivider label="CAREER STATISTICS" color="text-emerald-500" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label:'ODI Runs',                   name:'odiRuns',            ph:'0' },
                    { label:'T20 Runs',                   name:'t20Runs',            ph:'0' },
                    { label:'Batting Average',            name:'battingAverage',     ph:'0.00' },
                    { label:'Total Wickets',              name:'wickets',            ph:'0' },
                    { label:'Strike Rate / Avg Perf.',    name:'averagePerformance', ph:'e.g. 135' },
                  ].map(({ label, name, ph }) => (
                    <div key={name}>
                      <label className="font-bc block text-[11px] font-bold text-white/45 tracking-[2px] mb-1.5">{label.toUpperCase()}</label>
                      <input type="number" placeholder={ph} value={formData[name]} onChange={e => set(name, e.target.value)}
                        className={inputCls(errors[name])} />
                      {errors[name] && <p className="text-red-400 text-[11px] mt-1">{errors[name]}</p>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Auction Details */}
              <div className="mb-9">
                <SectionDivider label="AUCTION DETAILS" color="text-red-500" />
                <div>
                  <label className="font-bc block text-[11px] font-bold text-white/45 tracking-[2px] mb-1.5">BASE PRICE (₹ IN RUPEES)</label>
                  <input type="number" placeholder="e.g. 2000000 for ₹20 Lakh" value={formData.basicRemuneration}
                    onChange={e => set('basicRemuneration', e.target.value)}
                    className={inputCls(errors.basicRemuneration)} />
                  {errors.basicRemuneration && <p className="text-red-400 text-[11px] mt-1">{errors.basicRemuneration}</p>}
                  <div className="mt-3 bg-yellow-400/[0.07] border border-yellow-400/20 rounded-xl px-4 py-3 text-[12px] text-white/50 leading-relaxed">
                    💡 Base price categories: ₹5L, ₹10L, ₹20L, ₹30L, ₹50L, ₹75L, ₹1Cr, ₹1.5Cr, ₹2Cr. Enter the exact amount in rupees.
                  </div>
                </div>
              </div>

              <button
                type="submit" disabled={loading}
                className={`font-bc font-black text-base tracking-[2px] text-white border-0 rounded-xl py-4 transition-all duration-200 ${loading ? 'bg-blue-800/50 cursor-not-allowed' : 'bg-gradient-to-r from-blue-500 to-blue-800 shadow-[0_8px_24px_rgba(59,130,246,0.35)] hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(59,130,246,0.5)] cursor-pointer'}`}
              >
                {loading ? '⏳ REGISTERING...' : '🏏 REGISTER FOR AUCTION'}
              </button>

              <p className="text-center mt-5 text-sm text-white/40">
                Already registered?{' '}
                <Link to="/login-player" className="text-blue-400 font-bold no-underline hover:text-blue-300 transition-colors">Sign in here →</Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Psignup;