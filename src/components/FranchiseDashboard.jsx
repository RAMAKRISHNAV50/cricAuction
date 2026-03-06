import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import navigate for redirection

const FranchiseDashboard = () => {
  const [players, setPlayers] = useState([]);
  const [view, setView] = useState('bidding'); 
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
    if (!currentFranchiseName) {
      console.warn("No franchise name found. Ensure login logic is correct.");
    }
  }, [currentFranchiseName]);

  // NEW: Logout Function
  const handleLogout = () => {
    localStorage.removeItem('franchiseName'); // Clear session
    navigate('/franchise-login'); // Redirect to login (update path as needed)
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
    <div className="flex min-h-screen bg-gray-100">
      
      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col p-6 fixed h-full shadow-2xl z-10">
        <h2 className="text-2xl font-black mb-10 tracking-tighter text-blue-400 italic">AUCTION HUB</h2>
        
        <nav className="flex flex-col gap-4">
          <button 
            onClick={() => setView('bidding')}
            className={`flex items-center p-3 rounded-xl font-bold transition-all ${view === 'bidding' ? 'bg-blue-600 shadow-lg' : 'hover:bg-gray-800'}`}
          >
            🔥 Live Bidding
          </button>
          
          <button 
            onClick={() => setView('sold')}
            className={`flex items-center p-3 rounded-xl font-bold transition-all ${view === 'sold' ? 'bg-green-600 shadow-lg' : 'hover:bg-gray-800'}`}
          >
            🏆 Sold Players
          </button>
        </nav>

        {/* --- LOGOUT SECTION --- */}
        <div className="mt-auto border-t border-gray-700 pt-6">
          <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Signed in as</p>
          <p className="text-sm font-bold text-blue-300 truncate mb-4">
            {currentFranchiseName || "Guest User"}
          </p>
          <button 
            onClick={handleLogout}
            className="w-full bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white py-2 rounded-lg text-xs font-bold transition-all border border-red-500/20"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 ml-64 p-8">
        <header className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">
            {view === 'sold' ? "Auction History" : "Available Players"}
          </h1>
          <span className="bg-white border px-4 py-1 rounded-full font-bold text-sm shadow-sm">
            {filteredPlayers.length} Items
          </span>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPlayers.length > 0 ? (
            filteredPlayers.map(p => (
              <div key={p.id} className="bg-white rounded-2xl shadow-md border hover:shadow-xl transition-all p-6 flex flex-col">
                <h3 className="text-2xl font-black text-gray-800">{p.name}</h3>
                <p className="text-blue-600 font-bold uppercase text-[10px] tracking-widest">{p.position}</p>
                
                <div className="bg-gray-50 p-4 rounded-xl my-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 font-bold uppercase">{p.status === 'SOLD' ? "Final Bid" : "Min Bid"}</span>
                    <span className="font-black text-lg text-gray-900">₹{(p.status === 'SOLD' ? p.soldPrice : p.basicRemuneration)?.toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-auto">
                  {p.status === 'SOLD' ? (
                    <div className="bg-red-600 text-white py-3 px-4 text-center font-black rounded-xl text-xs uppercase italic">
                      Acquired by {p.boughtBy}
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleBid(p)} 
                      className="w-full bg-blue-600 text-white py-3 rounded-xl font-black text-xs hover:bg-blue-700 transition-all uppercase tracking-widest"
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