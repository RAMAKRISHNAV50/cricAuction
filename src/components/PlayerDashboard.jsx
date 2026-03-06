import { useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const PlayerDashboard = () => {
  const [player, setPlayer] = useState(null);
  const playerId = localStorage.getItem('playerId'); 

 useEffect(() => {
    const fetchPlayerData = async () => {
      try {
        // UPDATED: Pointing to your live Render Player Backend
        const response = await fetch(`https://springboot-players-2.onrender.com/players/${playerId}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch player data");
        }

        const data = await response.json();
        setPlayer(data);
      } catch (error) {
        console.error("Error fetching player:", error);
      }
    };
    
    if (playerId) fetchPlayerData();
  }, [playerId]);

  const downloadPDF = () => {
    if (!player) return;
    const doc = new jsPDF();
    
    doc.setFillColor(30, 58, 138); 
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("PLAYER ACQUISITION AGREEMENT", 105, 25, { align: "center" });

    autoTable(doc, {
      startY: 45,
      head: [['Field', 'Information']],
      body: [
        ['Player Name', player.name],
        ['Country', player.country],
        ['Position', player.position],
        ['ODI Runs', player.odiRuns || '0'],
        ['T20 Runs', player.t20Runs || '0'],
        ['Batting Avg', player.battingAverage || 'N/A'],
        ['Wickets', player.wickets || '0'],
        ['Acquisition Price', `INR ${(player.soldPrice || player.basicRemuneration).toLocaleString()}`],
        ['Franchise', player.boughtBy || 'Waiting for Bids']
      ],
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138] }
    });

    const finalY = doc.lastAutoTable.finalY || 100;

    doc.setTextColor(0);
    doc.setFontSize(10);
    doc.text("Legal Clauses & Terms:", 14, finalY + 10);
    
    const clauses = [
      "1. Exclusivity to Franchise.", "2. Payment in Installments.", "3. Medical Fitness required.",
      "4. Code of Conduct adherence.", "5. Image Rights usage.", "6. Anti-Corruption compliance.",
      "7. Official Kit usage.", "8. Injury Insurance provided.", "9. Travel arrangements covered.",
      "10. Mandatory Training attendance.", "11. Social Media restrictions.", "12. Brand exclusivity.",
      "13. Promotional availability.", "14. Performance Bonuses.", "15. Termination rights.",
      "16. Confidentiality of salary.", "17. Transfer window rules.", "18. Drug Testing consent.",
      "19. Governing Law of Franchise City.", "20. One-year extension option."
    ];
    
    doc.setFontSize(7);
    doc.text(clauses.join(' | '), 14, finalY + 18, { maxWidth: 180 });

    doc.save(`${player.name}_Contract.pdf`);
  };

  if (!player) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="p-8 bg-gray-50 min-h-screen flex flex-col items-center">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-3xl border-t-8 border-blue-600">
        <div className="flex justify-between items-start mb-6">
            <div>
                <h1 className="text-4xl font-black text-gray-800">Welcome, {player.name}</h1>
                <p className="text-blue-600 font-bold">{player.country} | {player.position}</p>
            </div>
            <div className="text-right">
                <p className="text-gray-500 text-sm">Status</p>
                <span className={`px-4 py-1 rounded-full text-white font-bold ${player.status === 'SOLD' ? 'bg-green-500' : 'bg-yellow-500'}`}>
                    {player.status}
                </span>
            </div>
        </div>
        
        {/* NEW CAREER STATS SECTION */}
        <h3 className="text-lg font-bold mb-3 text-gray-700">Career Statistics</h3>
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="p-4 bg-blue-50 rounded-xl text-center">
            <p className="text-gray-500 text-xs uppercase">ODI Runs</p>
            <p className="text-xl font-black text-blue-800">{player.odiRuns || 0}</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-xl text-center">
            <p className="text-gray-500 text-xs uppercase">T20 Runs</p>
            <p className="text-xl font-black text-blue-800">{player.t20Runs || 0}</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-xl text-center">
            <p className="text-gray-500 text-xs uppercase">Avg</p>
            <p className="text-xl font-black text-blue-800">{player.battingAverage || 'N/A'}</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-xl text-center">
            <p className="text-gray-500 text-xs uppercase">Wickets</p>
            <p className="text-xl font-black text-blue-800">{player.wickets || 0}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-gray-100 rounded-xl">
            <p className="text-gray-500 text-sm">Base Price</p>
            <p className="font-bold">₹{player.basicRemuneration?.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-gray-100 rounded-xl">
            <p className="text-gray-500 text-sm">Mobile Linked</p>
            <p className="font-bold">{player.mobile}</p>
          </div>
        </div>

        {player.status === 'SOLD' ? (
          <div className="bg-green-50 border-2 border-green-500 p-6 rounded-2xl text-center">
            <h2 className="text-2xl font-black text-green-700">CONGRATULATIONS!</h2>
            <p className="text-lg">You have been acquired by <strong>{player.boughtBy}</strong></p>
            <p className="text-4xl font-black my-4 text-green-800">₹{player.soldPrice?.toLocaleString()}</p>
            <button 
              onClick={downloadPDF}
              className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 transition shadow-lg"
            >
              Download Official Contract (PDF)
            </button>
          </div>
        ) : (
          <div className="bg-yellow-50 border-2 border-yellow-200 p-6 rounded-2xl text-center">
            <p className="text-yellow-700 font-bold text-lg animate-pulse">
                Auction is currently live. Waiting for franchises to bid...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerDashboard;