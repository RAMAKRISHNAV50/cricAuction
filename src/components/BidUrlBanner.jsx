import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const BidUrlBanner = ({ franchiseId, franchiseName }) => {
  const [bidInfo,  setBidInfo]  = useState(null);
  const [copied,   setCopied]   = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const check = () => {
      try {
        const sessions = JSON.parse(localStorage.getItem('bidSessions') || '{}');
        let found = null;
        for (const [playerId, session] of Object.entries(sessions)) {
          const passkey = session.passkeys?.[franchiseId];
          if (passkey) {
            found = {
              url:        `${window.location.origin}/bid/${playerId}/${franchiseId}/${passkey}`,
              playerName: session.playerName || 'Player',
              playerId,
            };
            break;
          }
        }
        setBidInfo(found);
      } catch { setBidInfo(null); }
    };
    check();
    const iv = setInterval(check, 2000);
    return () => clearInterval(iv);
  }, [franchiseId]);

  const copyUrl = () => {
    if (!bidInfo) return;
    navigator.clipboard.writeText(bidInfo.url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const openBidRoom = () => {
    if (!bidInfo) return;
    navigate(bidInfo.url.replace(window.location.origin, ''));
  };

  if (!bidInfo) return null;

  return (
    <>
      <style>{`
        @keyframes bidPulse{0%,100%{opacity:1}50%{opacity:.5}}
        @keyframes slideDown{from{transform:translateY(-10px);opacity:0}to{transform:translateY(0);opacity:1}}
        .bid-banner{animation:slideDown .3s ease}
        .font-bc{font-family:'Barlow Condensed',sans-serif}
      `}</style>
      <div className="bid-banner bg-gradient-to-r from-yellow-500/15 via-amber-400/10 to-yellow-500/15 border-2 border-yellow-400/50 rounded-2xl p-4 sm:p-5 mx-4 sm:mx-6 my-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-2.5 h-2.5 bg-yellow-400 rounded-full" style={{ animation: 'bidPulse 1s ease-in-out infinite' }} />
            <span className="font-bc text-[11px] font-black text-yellow-400 tracking-[2px]">BID NOW</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bc text-base font-black text-white leading-tight">
              🔨 <span className="text-yellow-400">{bidInfo.playerName}</span> is on the block — 60s countdown active!
            </p>
            <p className="font-b text-[11px] text-white/40 truncate mt-0.5">{bidInfo.url}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={copyUrl}
              className={`font-bc font-black text-xs tracking-wide px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                copied ? 'text-green-400 border-green-400/50 bg-green-400/10' : 'text-white/60 border-white/20 bg-white/5 hover:border-white/40 hover:text-white'
              }`}>
              {copied ? '✅ Copied' : '📋 Copy'}
            </button>
            <button onClick={openBidRoom}
              className="font-bc font-black text-xs tracking-[1px] text-black bg-yellow-400 hover:bg-yellow-300 border-0 px-4 py-2 rounded-xl transition-all cursor-pointer shadow-[0_4px_12px_rgba(251,191,36,0.4)] hover:-translate-y-0.5">
              ⚡ OPEN BID ROOM →
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default BidUrlBanner;
