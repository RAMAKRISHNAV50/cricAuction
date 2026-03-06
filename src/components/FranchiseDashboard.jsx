import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const FranchiseDashboard = () => {
  const [players, setPlayers] = useState([]);
  const [view, setView] = useState('bidding'); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Mobile toggle
  const navigate = useNavigate();
  
  const currentFranchiseName = localStorage.getItem('franchiseName');

  const fetchPlayers = async () => {
    try {
      const response = await fetch('https://springboot-players-2.onrender.com/players');
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setPlayers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Could not fetch players:", err);
    }
  };

  useEffect(() => { 
    fetchPlayers(); 
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login-franchise');
  };

  const filteredPlayers = players.filter(p => 
    view === 'sold' ? p.status === 'SOLD' : p.status !== 'SOLD'
  );

  const handleBid = async (player) => {
    const basePrice = player.basicRemuneration || 0;
    const amount = prompt(`Enter bid for ${player.name}\nMin: ₹${basePrice.toLocaleString()}`);
    
    if (amount && Number(amount) >= basePrice) {
      const updatedPlayer = { 
        ...player, 
        status: 'SOLD', 
        soldPrice: Number(amount), 
        boughtBy: currentFranchiseName || "Unknown Franchise" 
      };

      try {
        const response = await fetch(`https://springboot-players-2.onrender.com/players/${player.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedPlayer),
        });
        
        if (response.ok) fetchPlayers(); 
      } catch (err) {
        alert("Bidding error!");
      }
    } else if (amount) {
      alert("Bid too low!");
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      
      {/* --- MOBILE TOP BAR --- */}
      <div className="md:hidden bg-gray-900 text-white p-4 flex justify-between items-center sticky top-0 z-50">
        <h2 className="text-xl font-black text-blue-400 italic">AUCTION HUB</h2>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"} />
          </svg>
        </button>
      </div>

      {/* --- SIDEBAR (Desktop) / DROPDOWN (Mobile) --- */}
      <aside className={`
        ${isMobileMenuOpen ? 'block' : 'hidden'} 
        md:flex md:w-64 bg-gray-900 text-white flex-col p-6 md:fixed h-full shadow-2xl z-40 transition-all
      `}>
        <h2 className="hidden md:block text-2xl font-black mb-10 tracking-tighter text-blue-400 italic">AUCTION HUB</h2>
        
        <nav className="flex flex-col gap-4">
          <button 
            onClick={() => { setView('bidding'); setIsMobileMenuOpen(false); }}
            className={`flex items-center p-3 rounded-xl font-bold transition-all ${view === 'bidding' ? 'bg-blue-600 shadow-lg' : 'hover:bg-gray-800'}`}
          >
            🔥 Live Bidding
          </button>
          
          <button 
            onClick={() => { setView('sold'); setIsMobileMenuOpen(false); }}
            className={`flex items-center p-3 rounded-xl font-bold transition-all ${view === 'sold' ? 'bg-green-600 shadow-lg' : 'hover:bg-gray-800'}`}
          >
            🏆 Sold Players
          </button>
        </nav>

        <div className="mt-8 md:mt-auto border-t border-gray-700 pt-6">
          <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Signed in as</p>
          <p className="text-sm font-bold text-blue-300 truncate mb-4">
            {currentFranchiseName || "Guest User"}
          </p>
          <button 
            onClick={handleLogout}
            className="w-full bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white py-3 rounded-lg text-xs font-bold transition-all border border-red-500/20"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 md:ml-64 p-4 md:p-8">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 md:mb-10">
          <h1 className="text-2xl md:text-4xl font-black text-gray-900 uppercase tracking-tighter">
            {view === 'sold' ? "Auction History" : "Available Players"}
          </h1>
          <span className="bg-white border px-4 py-1 rounded-full font-bold text-sm shadow-sm">
            {filteredPlayers.length} Items
          </span>
        </header>

        {/* Player Grid - Responsive Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
          {filteredPlayers.length > 0 ? (
            filteredPlayers.map(p => (
              <div key={p.id} className="bg-white rounded-2xl shadow-md border hover:shadow-xl transition-all p-5 md:p-6 flex flex-col">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl md:text-2xl font-black text-gray-800">{p.name}</h3>
                    <p className="text-blue-600 font-bold uppercase text-[10px] tracking-widest">{p.position}</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-xl my-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 font-bold uppercase">{p.status === 'SOLD' ? "Final Bid" : "Min Bid"}</span>
                    <span className="font-black text-lg text-gray-900">₹{(p.status === 'SOLD' ? p.soldPrice : p.basicRemuneration)?.toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-auto">
                  {p.status === 'SOLD' ? (
                    <div className="bg-red-100 text-red-700 py-3 px-4 text-center font-bold rounded-xl text-xs uppercase italic border border-red-200">
                      Acquired by {p.boughtBy}
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleBid(p)} 
                      className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-xs hover:bg-blue-700 transition-all uppercase tracking-widest shadow-md active:scale-95"
                    >
                      Place Your Bid
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200 italic text-gray-400">
              No players found in this category.
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default FranchiseDashboard;