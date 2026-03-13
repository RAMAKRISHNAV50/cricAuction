import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const INDIAN_STATES = [
  'Andhra Pradesh','Assam','Bihar','Chhattisgarh','Delhi','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Odisha','Punjab','Rajasthan','Tamil Nadu',
  'Telangana','Uttar Pradesh','Uttarakhand','West Bengal','Other',
];

const inputCls = (err) =>
  `w-full bg-white/[0.05] border rounded-lg px-4 py-3 text-white text-sm font-b outline-none transition-all ${err ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' : 'border-white/[0.11] focus:border-yellow-400/60 focus:ring-2 focus:ring-yellow-400/10'}`;

const selectCls = (err) =>
  `w-full bg-[#0d1526] border rounded-lg px-4 py-3 text-white text-sm font-b outline-none transition-all ${err ? 'border-red-500' : 'border-white/[0.11] focus:border-yellow-400/60'}`;

const SectionDivider = ({ label, color }) => (
  <div className="flex items-center gap-3 mb-5">
    <div className="h-px flex-1 bg-white/[0.08]" />
    <span className={`font-bc text-[11px] font-bold tracking-[3px] ${color}`}>{label}</span>
    <div className="h-px flex-1 bg-white/[0.08]" />
  </div>
);

const Fsignup = () => {
  const [formData, setFormData] = useState({
    name:'', franchiseName:'', ownerName:'', state:'',
    networth:'', email:'', password:'', confirmPassword:'',
  });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const set = (k, v) => { setFormData(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); };

  const validate = () => {
    const e = {};
    if (!formData.name.trim())          e.name          = 'Contact name required';
    if (!formData.franchiseName.trim()) e.franchiseName = 'Franchise name required';
    if (!formData.ownerName.trim())     e.ownerName     = 'Owner name required';
    if (!formData.state)                e.state         = 'Select a state';
    if (!formData.networth || Number(formData.networth) < 1000000) e.networth = 'Minimum net worth is ₹10,00,000';
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Valid email required';
    if (formData.password.length < 6)   e.password      = 'Min 6 characters';
    if (formData.password !== formData.confirmPassword) e.confirmPassword = 'Passwords do not match';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const { confirmPassword, ...dataToSend } = formData;
      const res = await fetch('https://springboot-franchises.onrender.com/franchises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...dataToSend, networth: Number(dataToSend.networth) }),
      });
      if (res.ok) navigate('/login-franchise', { state: { success: 'Franchise registered! Please log in.' } });
      else alert('Registration failed. Check if the backend is running.');
    } catch { alert('Cannot connect to server. Check backend on port 8080.'); }
    finally { setLoading(false); }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=Barlow:wght@400;500;600&display=swap');
        .font-bc { font-family: 'Barlow Condensed', sans-serif; }
        .font-b  { font-family: 'Barlow', sans-serif; }
        input::placeholder { color: rgba(255,255,255,0.2); }
        select option { background: #0d1526; }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-[#04091c] via-[#07102a] to-[#04091c] flex justify-center px-4 py-10 font-b relative">
        <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage:'radial-gradient(rgba(251,191,36,0.05) 1px,transparent 1px)', backgroundSize:'32px 32px' }} />
        <div className="fixed top-[20%] right-[5%] w-[400px] h-[400px] bg-yellow-400/[0.04] rounded-full blur-[120px] pointer-events-none" />

        <div className="w-full max-w-[800px] relative z-10">

          {/* Header */}
          <div className="text-center mb-9">
            <div className="inline-flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-800 rounded-xl flex items-center justify-center text-xl">🏏</div>
              <span className="font-bc text-[22px] font-black text-white tracking-[2px]">CRIC<span className="text-yellow-400">AUCTION</span></span>
            </div>
            <h1 className="font-bc text-[42px] font-black text-white tracking-tight leading-none mb-2">FRANCHISE REGISTRATION</h1>
            <p className="text-white/40 text-sm">Build your IPL dynasty. Register your franchise for the auction.</p>
          </div>

          {/* Card */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl px-9 py-10 backdrop-blur-xl">
            <form onSubmit={handleSubmit} className="flex flex-col">

              {/* Franchise Identity */}
              <div className="mb-8">
                <SectionDivider label="FRANCHISE IDENTITY" color="text-yellow-400" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label:'Contact Name',   name:'name',          ph:'Your full name' },
                    { label:'Franchise Name', name:'franchiseName', ph:'e.g. Mumbai Indians' },
                    { label:'Owner Name',     name:'ownerName',     ph:'Owner / Director name' },
                  ].map(({ label, name, ph }) => (
                    <div key={name}>
                      <label className="font-bc block text-[11px] font-bold text-white/45 tracking-[2px] mb-1.5">{label.toUpperCase()}</label>
                      <input type="text" placeholder={ph} value={formData[name]} onChange={e => set(name, e.target.value)}
                        className={inputCls(errors[name])} />
                      {errors[name] && <p className="text-red-400 text-[11px] mt-1">{errors[name]}</p>}
                    </div>
                  ))}

                  <div>
                    <label className="font-bc block text-[11px] font-bold text-white/45 tracking-[2px] mb-1.5">STATE / REGION</label>
                    <select value={formData.state} onChange={e => set('state', e.target.value)} className={selectCls(errors.state)}>
                      <option value="">Select State</option>
                      {INDIAN_STATES.map(s => <option key={s}>{s}</option>)}
                    </select>
                    {errors.state && <p className="text-red-400 text-[11px] mt-1">{errors.state}</p>}
                  </div>
                </div>
              </div>

              {/* Auction Finances */}
              <div className="mb-8">
                <SectionDivider label="AUCTION FINANCES" color="text-emerald-400" />
                <div>
                  <label className="font-bc block text-[11px] font-bold text-white/45 tracking-[2px] mb-1.5">FRANCHISE PURSE / NET WORTH (₹)</label>
                  <input type="number" placeholder="e.g. 1000000000 for ₹100 Crore" value={formData.networth}
                    onChange={e => set('networth', e.target.value)} className={inputCls(errors.networth)} />
                  {errors.networth && <p className="text-red-400 text-[11px] mt-1">{errors.networth}</p>}
                  <div className="mt-3 bg-yellow-400/[0.07] border border-yellow-400/20 rounded-xl px-4 py-3 text-[12px] text-white/50 leading-relaxed">
                    💡 Enter the purse amount in full rupees. Examples: ₹100Cr = 1000000000 · ₹50Cr = 500000000 · ₹20Cr = 200000000
                  </div>
                </div>
              </div>

              {/* Login Credentials */}
              <div className="mb-9">
                <SectionDivider label="LOGIN CREDENTIALS" color="text-blue-400" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label:'Corporate Email',    name:'email',           type:'email',    ph:'franchise@company.com' },
                    { label:'Password',           name:'password',        type:'password', ph:'Min 6 characters' },
                    { label:'Confirm Password',   name:'confirmPassword', type:'password', ph:'Repeat password' },
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

              <button
                type="submit" disabled={loading}
                className={`font-bc font-black text-base tracking-[2px] text-white border-0 rounded-xl py-4 transition-all duration-200 ${loading ? 'bg-yellow-800/40 cursor-not-allowed' : 'bg-gradient-to-r from-yellow-500 to-yellow-600 shadow-[0_8px_24px_rgba(251,191,36,0.3)] hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(251,191,36,0.4)] cursor-pointer'}`}
              >
                {loading ? '⏳ REGISTERING...' : '🏟️ REGISTER FRANCHISE'}
              </button>

              <p className="text-center mt-5 text-sm text-white/40">
                Already registered?{' '}
                <Link to="/login-franchise" className="text-yellow-400 font-bold no-underline hover:text-yellow-300 transition-colors">Sign in here →</Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Fsignup;