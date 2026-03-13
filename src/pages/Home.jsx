import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

// ── DATA ──────────────────────────────────────────────────────────────────────

const STATS = [
  { label: "Registered Players", value: "1,240+", icon: "🏏" },
  { label: "Franchises", value: "10", icon: "🏟️" },
  { label: "Total Purse (Cr)", value: "₹900", icon: "💰" },
  { label: "Auction Slots", value: "204", icon: "🎯" },
];

const TEAMS = [
  { name: "Mumbai Indians", short: "MI", color: "#004BA0", accent: "#D1AB3E", wins: 5, purse: "₹85 Cr", logo: "https://upload.wikimedia.org/wikipedia/en/c/cd/Mumbai_Indians_Logo.svg" },
  { name: "Chennai Super Kings", short: "CSK", color: "#F9CD05", accent: "#0081E9", wins: 5, purse: "₹90 Cr", logo: "https://upload.wikimedia.org/wikipedia/en/2/2b/Chennai_Super_Kings_Logo.svg" },
  { name: "Royal Challengers Bengaluru", short: "RCB", color: "#EC1C24", accent: "#000000", wins: 0, purse: "₹83 Cr", logo: "https://upload.wikimedia.org/wikipedia/en/2/2a/Royal_Challengers_Bangalore_2020.svg" },
  { name: "Kolkata Knight Riders", short: "KKR", color: "#3A225D", accent: "#B3A123", wins: 3, purse: "₹78 Cr", logo: "https://upload.wikimedia.org/wikipedia/en/4/4c/Kolkata_Knight_Riders_Logo.svg" },
  { name: "Delhi Capitals", short: "DC", color: "#00008B", accent: "#EF1B23", wins: 0, purse: "₹92 Cr", logo: "https://upload.wikimedia.org/wikipedia/en/f/f5/Delhi_Capitals_Logo.svg" },
  { name: "Rajasthan Royals", short: "RR", color: "#FF4E9F", accent: "#254AA5", wins: 2, purse: "₹88 Cr", logo: "https://upload.wikimedia.org/wikipedia/en/6/60/Rajasthan_Royals_Logo.svg" },
  { name: "Punjab Kings", short: "PBKS", color: "#ED1B24", accent: "#A7A9AC", wins: 0, purse: "₹95 Cr", logo: "https://upload.wikimedia.org/wikipedia/en/4/4a/Punjab_Kings_Logo_2021.svg" },
  { name: "Sunrisers Hyderabad", short: "SRH", color: "#F26522", accent: "#000000", wins: 2, purse: "₹87 Cr", logo: "https://upload.wikimedia.org/wikipedia/en/8/81/Sunrisers_Hyderabad.svg" },
];

const PLAYERS = [
  { name: "Virat Kohli", role: "Batsman", nationality: "India", basePrice: "₹2 Cr", rating: 98, img: "https://img1.hscicdn.com/image/fetch/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316800/316848.png", speciality: "Chase Master", stats: "Avg 53.4 | SR 131" },
  { name: "Rohit Sharma", role: "Batsman", nationality: "India", basePrice: "₹2 Cr", rating: 96, img: "https://img1.hscicdn.com/image/fetch/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316800/316847.png", speciality: "Powerplay Expert", stats: "Avg 29.4 | SR 130" },
  { name: "Jasprit Bumrah", role: "Bowler", nationality: "India", basePrice: "₹2 Cr", rating: 99, img: "https://img1.hscicdn.com/image/fetch/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316800/316859.png", speciality: "Death Over Specialist", stats: "Econ 6.9 | 145 Wkts" },
  { name: "MS Dhoni", role: "WK-Batsman", nationality: "India", basePrice: "₹2 Cr", rating: 95, img: "https://img1.hscicdn.com/image/fetch/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316800/316849.png", speciality: "Finisher", stats: "SR 136 | 5x Champ" },
  { name: "Pat Cummins", role: "All-Rounder", nationality: "Australia", basePrice: "₹2 Cr", rating: 94, img: "https://img1.hscicdn.com/image/fetch/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316800/316853.png", speciality: "Power Hitter + Pacer", stats: "SR 149 | Econ 8.3" },
  { name: "KL Rahul", role: "WK-Batsman", nationality: "India", basePrice: "₹2 Cr", rating: 92, img: "https://img1.hscicdn.com/image/fetch/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316800/316862.png", speciality: "Anchor Opener", stats: "Avg 46.7 | SR 134" },
];

const AUCTION_TIMELINE = [
  { date: "Dec 01", event: "Player Registrations Open", status: "done", desc: "All players submit profiles, performance data, and role preferences." },
  { date: "Dec 15", event: "Franchise Wallet Allocation", status: "done", desc: "Each franchise receives their official auction purse and shortlisting rights." },
  { date: "Jan 05", event: "Player Pool Finalized", status: "done", desc: "1,240 players shortlisted across 5 categories. Set lists released to franchises." },
  { date: "Jan 20", event: "Franchise Shortlisting Deadline", status: "active", desc: "Franchises submit their top-25 retention and RTM (Right to Match) lists." },
  { date: "Feb 10", event: "Auction Day 1 – Marquee Players", status: "upcoming", desc: "Capped Indian & overseas stars go under the hammer. Most-watched session." },
  { date: "Feb 11", event: "Auction Day 2 – Emerging Talent", status: "upcoming", desc: "Uncapped players, accelerated sets, and fill-up rounds." },
];

const CATEGORIES = [
  { name: "Marquee Batsmen", count: 42, icon: "🏏", color: "#3B82F6", minBid: "₹2 Cr" },
  { name: "Fast Bowlers", count: 58, icon: "🎳", color: "#EF4444", minBid: "₹1.5 Cr" },
  { name: "All-Rounders", count: 36, icon: "⚡", color: "#F59E0B", minBid: "₹1 Cr" },
  { name: "Wicket-Keepers", count: 24, icon: "🧤", color: "#10B981", minBid: "₹1 Cr" },
  { name: "Spinners", count: 44, icon: "🌀", color: "#8B5CF6", minBid: "₹75 L" },
];

const RULES = [
  { title: "Maximum Purse", detail: "₹100 Crore per franchise. No overshoot allowed.", icon: "💼" },
  { title: "Retained Players", detail: "Up to 6 players retained before auction; deducted from purse.", icon: "🔒" },
  { title: "Right to Match", detail: "Each franchise gets 3 RTM cards to match winning bids.", icon: "🔄" },
  { title: "Overseas Slots", detail: "Max 8 overseas players per team in the squad.", icon: "🌍" },
  { title: "Bid Increments", detail: "₹5L below ₹1Cr, ₹10L between ₹1–2Cr, ₹25L above ₹2Cr.", icon: "📈" },
  { title: "Unsold Player Pool", detail: "Unsold players can re-enter the auction in the same cycle.", icon: "♻️" },
];

// ── COMPONENT ──────────────────────────────────────────────────────────────────

const Home = () => {
  const [activeTeam, setActiveTeam] = useState(0);
  const [counter, setCounter] = useState({ players: 0, franchises: 0, purse: 0, slots: 0 });
  const [heroLoaded, setHeroLoaded] = useState(false);

  useEffect(() => {
    setHeroLoaded(true);
    const targets = [1240, 10, 900, 204];
    const keys = ["players", "franchises", "purse", "slots"];
    const duration = 1800;
    const steps = 60;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const ease = 1 - Math.pow(1 - progress, 3);
      setCounter({
        players: Math.round(targets[0] * ease),
        franchises: Math.round(targets[1] * ease),
        purse: Math.round(targets[2] * ease),
        slots: Math.round(targets[3] * ease),
      });
      if (step >= steps) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, []);

  const counterValues = [counter.players + "+", counter.franchises, "₹" + counter.purse, counter.slots];

  return (
    <div style={{ fontFamily: "'Barlow Condensed', 'Bebas Neue', Impact, sans-serif", background: "#0A0A0F", color: "#fff", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        .glow-blue { text-shadow: 0 0 40px rgba(59,130,246,0.6); }
        .glow-gold { text-shadow: 0 0 30px rgba(251,191,36,0.7); }
        .card-hover { transition: transform 0.25s ease, box-shadow 0.25s ease; }
        .card-hover:hover { transform: translateY(-6px); box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
        .team-btn { transition: all 0.2s ease; }
        .team-btn:hover { transform: scale(1.05); }
        .pulse-dot { animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.4)} }
        .fade-in { animation: fadeUp 0.7s ease forwards; opacity: 0; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        .badge { display:inline-block; padding:2px 10px; border-radius:999px; font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background:#111; } ::-webkit-scrollbar-thumb { background:#3B82F6; border-radius:3px; }
      `}</style>

      {/* ── NAV ── */}
      {/* <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "rgba(10,10,15,0.92)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #3B82F6, #1D4ED8)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🏏</div>
          <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: 2, color: "#fff" }}>IPL<span style={{ color: "#FBBF24" }}>AUCTION</span></span>
        </div>
        <div style={{ display: "flex", gap: 32, fontSize: 14, fontWeight: 600, letterSpacing: 1 }}>
          {["Teams", "Players", "Auction", "Rules"].map(item => (
            <a key={item} href={`#${item.toLowerCase()}`} style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={e => e.target.style.color = "#FBBF24"} onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.6)"}>{item}</a>
          ))}
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Link to="/signup-player" style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", padding: "8px 20px", borderRadius: 6, fontSize: 13, fontWeight: 700, textDecoration: "none", letterSpacing: 1 }}>Player Login</Link>
          <Link to="/signup-franchise" style={{ background: "#3B82F6", color: "#fff", padding: "8px 20px", borderRadius: 6, fontSize: 13, fontWeight: 700, textDecoration: "none", letterSpacing: 1 }}>Franchise Login</Link>
        </div>
      </nav> */}

      {/* ── HERO ── */}
      <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", padding: "120px 24px 80px", textAlign: "center", background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(59,130,246,0.15) 0%, transparent 70%)" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(59,130,246,0.08) 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "20%", left: "5%", width: 300, height: 300, background: "rgba(251,191,36,0.06)", borderRadius: "50%", filter: "blur(80px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "5%", width: 400, height: 400, background: "rgba(59,130,246,0.08)", borderRadius: "50%", filter: "blur(100px)", pointerEvents: "none" }} />

        <div className={heroLoaded ? "fade-in" : ""} style={{ animationDelay: "0.1s" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: 999, padding: "6px 16px", marginBottom: 24 }}>
            <span className="pulse-dot" style={{ width: 8, height: 8, background: "#FBBF24", borderRadius: "50%", display: "inline-block" }} />
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: "#FBBF24" }}>AUCTION SEASON 2026 · LIVE REGISTRATIONS OPEN</span>
          </div>
        </div>

        <h1 className={`glow-blue ${heroLoaded ? "fade-in" : ""}`} style={{ fontSize: "clamp(52px, 10vw, 110px)", fontWeight: 900, lineHeight: 0.9, letterSpacing: -2, margin: "0 0 20px", animationDelay: "0.2s" }}>
          THE FUTURE OF<br />
          <span style={{ color: "#FBBF24" }} className="glow-gold">CRICKET BIDDING</span><br />
          IS HERE.
        </h1>

        <p className={heroLoaded ? "fade-in" : ""} style={{ fontSize: 18, fontWeight: 400, color: "rgba(255,255,255,0.55)", maxWidth: 560, lineHeight: 1.7, marginBottom: 48, fontFamily: "'Barlow', sans-serif", animationDelay: "0.35s" }}>
          A professional platform where elite players meet world-class franchises. Join the most competitive auction pool in the world. ₹900 Crore total purse across 10 iconic teams.
        </p>

        <div className={heroLoaded ? "fade-in" : ""} style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center", marginBottom: 80, animationDelay: "0.5s" }}>
          <Link to="/signup-player" style={{ background: "linear-gradient(135deg, #3B82F6, #1D4ED8)", color: "#fff", padding: "16px 40px", borderRadius: 8, fontSize: 16, fontWeight: 800, textDecoration: "none", letterSpacing: 2, boxShadow: "0 8px 32px rgba(59,130,246,0.4)", transition: "transform 0.2s" }} onMouseEnter={e => e.currentTarget.style.transform = "scale(1.04)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
            🏏 REGISTER AS PLAYER
          </Link>
          <Link to="/signup-franchise" style={{ background: "transparent", border: "2px solid rgba(255,255,255,0.2)", color: "#fff", padding: "16px 40px", borderRadius: 8, fontSize: 16, fontWeight: 800, textDecoration: "none", letterSpacing: 2, transition: "all 0.2s" }} onMouseEnter={e => { e.currentTarget.style.borderColor = "#FBBF24"; e.currentTarget.style.color = "#FBBF24"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; e.currentTarget.style.color = "#fff"; }}>
            🏟️ REGISTER FRANCHISE →
          </Link>
        </div>

        {/* STAT COUNTERS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, background: "rgba(255,255,255,0.06)", borderRadius: 16, overflow: "hidden", width: "100%", maxWidth: 800, border: "1px solid rgba(255,255,255,0.08)" }}>
          {STATS.map((s, i) => (
            <div key={s.label} style={{ background: "#0A0A0F", padding: "28px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 28 }}>{s.icon}</div>
              <div style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 900, color: "#FBBF24", letterSpacing: -1 }}>{counterValues[i]}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: 2, marginTop: 4, fontFamily: "'Barlow', sans-serif" }}>{s.label.toUpperCase()}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TEAMS ── */}
      <section id="teams" style={{ padding: "100px 24px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <span style={{ fontSize: 12, letterSpacing: 4, color: "#3B82F6", fontWeight: 700 }}>THE FRANCHISES</span>
          <h2 style={{ fontSize: "clamp(36px, 6vw, 72px)", fontWeight: 900, margin: "12px 0 0", letterSpacing: -1 }}>10 ICONIC TEAMS</h2>
        </div>

        {/* Team tabs */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginBottom: 40 }}>
          {TEAMS.map((t, i) => (
            <button key={t.short} className="team-btn" onClick={() => setActiveTeam(i)} style={{ background: activeTeam === i ? t.color : "rgba(255,255,255,0.05)", border: `2px solid ${activeTeam === i ? t.color : "transparent"}`, color: "#fff", padding: "10px 20px", borderRadius: 8, fontSize: 14, fontWeight: 800, cursor: "pointer", letterSpacing: 1 }}>
              {t.short}
            </button>
          ))}
        </div>

        {/* Active team card */}
        {(() => {
          const t = TEAMS[activeTeam];
          return (
            <div style={{ background: `linear-gradient(135deg, ${t.color}22, rgba(255,255,255,0.03))`, border: `1px solid ${t.color}44`, borderRadius: 20, padding: "40px 48px", display: "flex", alignItems: "center", gap: 48, flexWrap: "wrap" }}>
              <div style={{ width: 100, height: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.07)", borderRadius: 16, flexShrink: 0 }}>
                <img src={t.logo} alt={t.name} style={{ width: 80, height: 80, objectFit: "contain" }} onError={e => { e.target.style.display = "none"; }} />
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <h3 style={{ fontSize: 42, fontWeight: 900, margin: "0 0 8px", letterSpacing: -1 }}>{t.name}</h3>
                <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                  <div><span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>IPL TITLES</span><div style={{ fontSize: 32, fontWeight: 900, color: t.wins > 0 ? "#FBBF24" : "rgba(255,255,255,0.3)" }}>{t.wins > 0 ? "🏆".repeat(Math.min(t.wins, 5)) : "—"}</div></div>
                  <div><span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>AUCTION PURSE</span><div style={{ fontSize: 32, fontWeight: 900, color: "#3B82F6" }}>{t.purse}</div></div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-end" }}>
                <span className="badge" style={{ background: `${t.color}33`, color: t.accent, border: `1px solid ${t.color}66` }}>{t.wins} TITLES</span>
                <Link to={`/franchise/${t.short.toLowerCase()}`} style={{ background: t.color, color: "#fff", padding: "12px 28px", borderRadius: 8, fontSize: 14, fontWeight: 800, textDecoration: "none", letterSpacing: 1 }}>VIEW SQUAD →</Link>
              </div>
            </div>
          );
        })()}

        {/* Teams grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16, marginTop: 32 }}>
          {TEAMS.map((t, i) => (
            <div key={t.short} className="card-hover" onClick={() => setActiveTeam(i)} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${activeTeam === i ? t.color : "rgba(255,255,255,0.07)"}`, borderRadius: 12, padding: "20px", cursor: "pointer", transition: "all 0.2s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <img src={t.logo} alt={t.short} style={{ width: 40, height: 40, objectFit: "contain" }} onError={e => { e.target.style.display = "none"; }} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: 0.5 }}>{t.short}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: "'Barlow', sans-serif" }}>{t.purse}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURED PLAYERS ── */}
      <section id="players" style={{ padding: "100px 24px", background: "rgba(255,255,255,0.01)", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 60, flexWrap: "wrap", gap: 20 }}>
            <div>
              <span style={{ fontSize: 12, letterSpacing: 4, color: "#FBBF24", fontWeight: 700 }}>FEATURED IN AUCTION</span>
              <h2 style={{ fontSize: "clamp(36px, 6vw, 72px)", fontWeight: 900, margin: "12px 0 0", letterSpacing: -1 }}>MARQUEE PLAYERS</h2>
            </div>
            <Link to="/players" style={{ color: "#3B82F6", fontSize: 14, fontWeight: 700, textDecoration: "none", letterSpacing: 1, borderBottom: "1px solid #3B82F6", paddingBottom: 2 }}>VIEW ALL 1,240+ PLAYERS →</Link>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
            {PLAYERS.map((p, i) => (
              <div key={p.name} className="card-hover" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden" }}>
                <div style={{ position: "relative", height: 200, background: "linear-gradient(135deg, #111827, #1e3a5f)", overflow: "hidden" }}>
                  <img src={p.img} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} onError={e => { e.target.style.display = "none"; }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,10,15,0.9) 0%, transparent 60%)" }} />
                  <div style={{ position: "absolute", top: 12, right: 12 }}>
                    <span className="badge" style={{ background: "rgba(251,191,36,0.2)", color: "#FBBF24", border: "1px solid rgba(251,191,36,0.4)", fontSize: 13, fontWeight: 900 }}>⭐ {p.rating}</span>
                  </div>
                  <div style={{ position: "absolute", bottom: 12, left: 16 }}>
                    <span className="badge" style={{ background: "rgba(59,130,246,0.3)", color: "#93C5FD", border: "1px solid rgba(59,130,246,0.4)" }}>{p.role}</span>
                  </div>
                </div>
                <div style={{ padding: 20 }}>
                  <h3 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 4px", letterSpacing: 0.5 }}>{p.name}</h3>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 12, fontFamily: "'Barlow', sans-serif" }}>🌏 {p.nationality}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "10px 14px", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: 2 }}>BASE PRICE</div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: "#4ADE80" }}>{p.basePrice}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: 2 }}>SPECIALTY</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#FBBF24" }}>{p.speciality}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "'Barlow', sans-serif" }}>📊 {p.stats}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLAYER CATEGORIES ── */}
      <section style={{ padding: "100px 24px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <span style={{ fontSize: 12, letterSpacing: 4, color: "#10B981", fontWeight: 700 }}>AUCTION POOL</span>
          <h2 style={{ fontSize: "clamp(36px, 6vw, 72px)", fontWeight: 900, margin: "12px 0 0", letterSpacing: -1 }}>PLAYER CATEGORIES</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
          {CATEGORIES.map(cat => (
            <div key={cat.name} className="card-hover" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${cat.color}33`, borderRadius: 16, padding: "28px 24px", textAlign: "center", cursor: "pointer" }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>{cat.icon}</div>
              <div style={{ fontSize: 42, fontWeight: 900, color: cat.color, lineHeight: 1 }}>{cat.count}</div>
              <div style={{ fontSize: 15, fontWeight: 700, margin: "8px 0 4px" }}>{cat.name}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: "'Barlow', sans-serif" }}>Min Bid: {cat.minBid}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── AUCTION TIMELINE ── */}
      <section id="auction" style={{ padding: "100px 24px", background: "rgba(59,130,246,0.03)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <span style={{ fontSize: 12, letterSpacing: 4, color: "#3B82F6", fontWeight: 700 }}>IMPORTANT DATES</span>
            <h2 style={{ fontSize: "clamp(36px, 6vw, 72px)", fontWeight: 900, margin: "12px 0 0", letterSpacing: -1 }}>AUCTION TIMELINE</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {AUCTION_TIMELINE.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 24, alignItems: "flex-start", paddingBottom: i < AUCTION_TIMELINE.length - 1 ? 40 : 0 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 80 }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: item.status === "done" ? "#10B981" : item.status === "active" ? "#FBBF24" : "rgba(255,255,255,0.1)", border: `3px solid ${item.status === "done" ? "#10B981" : item.status === "active" ? "#FBBF24" : "rgba(255,255,255,0.15)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                    {item.status === "done" ? "✓" : item.status === "active" ? "●" : "○"}
                  </div>
                  {i < AUCTION_TIMELINE.length - 1 && <div style={{ width: 2, flex: 1, minHeight: 40, background: item.status === "done" ? "#10B981" : "rgba(255,255,255,0.1)", marginTop: 4 }} />}
                </div>
                <div style={{ flex: 1, paddingTop: 8 }}>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", letterSpacing: 2, marginBottom: 4, fontFamily: "'Barlow', sans-serif" }}>{item.date}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <h3 style={{ fontSize: 20, fontWeight: 800, margin: 0, letterSpacing: 0.5 }}>{item.event}</h3>
                    {item.status === "active" && <span className="badge" style={{ background: "rgba(251,191,36,0.15)", color: "#FBBF24", border: "1px solid rgba(251,191,36,0.4)", fontSize: 10 }}>CURRENT PHASE</span>}
                    {item.status === "done" && <span className="badge" style={{ background: "rgba(16,185,129,0.15)", color: "#10B981", border: "1px solid rgba(16,185,129,0.3)", fontSize: 10 }}>COMPLETED</span>}
                  </div>
                  <p style={{ margin: 0, color: "rgba(255,255,255,0.5)", fontSize: 15, lineHeight: 1.6, fontFamily: "'Barlow', sans-serif" }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── RULES ── */}
      <section id="rules" style={{ padding: "100px 24px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <span style={{ fontSize: 12, letterSpacing: 4, color: "#EF4444", fontWeight: 700 }}>HOW IT WORKS</span>
          <h2 style={{ fontSize: "clamp(36px, 6vw, 72px)", fontWeight: 900, margin: "12px 0 0", letterSpacing: -1 }}>AUCTION RULES</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
          {RULES.map((r) => (
            <div key={r.title} className="card-hover" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "28px" }}>
              <div style={{ fontSize: 36, marginBottom: 16 }}>{r.icon}</div>
              <h3 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 10px", letterSpacing: 0.5 }}>{r.title}</h3>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.5)", fontSize: 15, lineHeight: 1.6, fontFamily: "'Barlow', sans-serif" }}>{r.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW TO PARTICIPATE ── */}
      <section style={{ padding: "100px 24px", background: "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(251,191,36,0.05))", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
          <span style={{ fontSize: 12, letterSpacing: 4, color: "#FBBF24", fontWeight: 700 }}>GET STARTED</span>
          <h2 style={{ fontSize: "clamp(36px, 6vw, 72px)", fontWeight: 900, margin: "12px 0 48px", letterSpacing: -1 }}>HOW TO PARTICIPATE</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, textAlign: "left" }}>
            {/* Player path */}
            <div style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 20, padding: 36 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🏏</div>
              <h3 style={{ fontSize: 28, fontWeight: 900, margin: "0 0 20px", color: "#93C5FD" }}>AS A PLAYER</h3>
              {["Create your player profile", "Submit career stats & highlights", "Set your base price & availability", "Get discovered by all 10 franchises", "Participate in live auction bidding"].map((step, i) => (
                <div key={step} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 14 }}>
                  <span style={{ width: 24, height: 24, background: "#3B82F6", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
                  <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 15, fontFamily: "'Barlow', sans-serif", lineHeight: 1.5 }}>{step}</span>
                </div>
              ))}
              <Link to="/signup-player" style={{ display: "inline-block", background: "#3B82F6", color: "#fff", padding: "14px 32px", borderRadius: 8, fontSize: 14, fontWeight: 800, textDecoration: "none", letterSpacing: 1, marginTop: 8 }}>REGISTER NOW →</Link>
            </div>
            {/* Franchise path */}
            <div style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 20, padding: 36 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🏟️</div>
              <h3 style={{ fontSize: 28, fontWeight: 900, margin: "0 0 20px", color: "#FBBF24" }}>AS A FRANCHISE</h3>
              {["Register your franchise details", "Receive ₹100 Cr auction purse", "Manage retentions & RTM cards", "Shortlist players before auction", "Build your dream squad live"].map((step, i) => (
                <div key={step} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 14 }}>
                  <span style={{ width: 24, height: 24, background: "#FBBF24", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, flexShrink: 0, marginTop: 1, color: "#000" }}>{i + 1}</span>
                  <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 15, fontFamily: "'Barlow', sans-serif", lineHeight: 1.5 }}>{step}</span>
                </div>
              ))}
              <Link to="/signup-franchise" style={{ display: "inline-block", background: "#FBBF24", color: "#000", padding: "14px 32px", borderRadius: 8, fontSize: 14, fontWeight: 800, textDecoration: "none", letterSpacing: 1, marginTop: 8 }}>REGISTER FRANCHISE →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section style={{ padding: "100px 24px", textAlign: "center", background: "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(59,130,246,0.12) 0%, transparent 70%)" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(40px, 8vw, 90px)", fontWeight: 900, letterSpacing: -2, lineHeight: 0.9, margin: "0 0 24px" }}>
            DON'T MISS THE<br /><span style={{ color: "#FBBF24" }} className="glow-gold">AUCTION.</span>
          </h2>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.5)", marginBottom: 40, fontFamily: "'Barlow', sans-serif", lineHeight: 1.7 }}>
            Feb 10–11, 2025. Live. Competitive. Legendary. Secure your spot in the most watched cricket auction of the decade.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/signup-player" style={{ background: "linear-gradient(135deg,#3B82F6,#1D4ED8)", color: "#fff", padding: "18px 48px", borderRadius: 8, fontSize: 16, fontWeight: 800, textDecoration: "none", letterSpacing: 2, boxShadow: "0 8px 32px rgba(59,130,246,0.4)" }}>🏏 JOIN AS PLAYER</Link>
            <Link to="/signup-franchise" style={{ background: "#FBBF24", color: "#000", padding: "18px 48px", borderRadius: 8, fontSize: 16, fontWeight: 800, textDecoration: "none", letterSpacing: 2 }}>🏟️ JOIN AS FRANCHISE</Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "40px 24px", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 16 }}>
          <div style={{ width: 28, height: 28, background: "linear-gradient(135deg,#3B82F6,#1D4ED8)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🏏</div>
          <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: 2 }}>IPL<span style={{ color: "#FBBF24" }}>AUCTION</span></span>
        </div>
        <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 13, margin: 0, fontFamily: "'Barlow', sans-serif" }}>© 2025 IPL Auction Platform · All rights reserved · Not affiliated with BCCI or IPL</p>
      </footer>
    </div>
  );
};

export default Home;
