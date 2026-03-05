import { useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const PlayerDashboard = () => {
  const [player, setPlayer] = useState(null);
  // Assume player ID is stored in localStorage after login
  const playerId = localStorage.getItem('playerId'); 

  useEffect(() => {
    const fetchPlayerData = async () => {
      const response = await fetch(`http://localhost:8081/players/${playerId}`);
      const data = await response.json();
      setPlayer(data);
    };
    if (playerId) fetchPlayerData();
  }, [playerId]);

  const downloadPDF = () => {
    if (!player) return;
    const doc = new jsPDF();
    
    // Header Logic
    doc.setFillColor(30, 58, 138); 
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("PLAYER ACQUISITION AGREEMENT", 105, 25, { align: "center" });

    // FIX: Call autoTable as a function passing the 'doc' instance
    autoTable(doc, {
      startY: 45,
      head: [['Field', 'Value']],
      body: [
        ['Name', player.name],
        ['Email', player.email],
        ['Position', player.position],
        ['Country', player.country],
        ['Price', `INR ${(player.soldPrice || player.basicRemuneration).toLocaleString()}`],
        ['Bought By', player.boughtBy || 'N/A']
      ],
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138] }
    });

    // To get the Y position for the next section, use:
    const finalY = doc.lastAutoTable.finalY || 100;

    // 20 Legal Clauses
    doc.setTextColor(0);
    doc.setFontSize(10);
    doc.text("Agreement Terms:", 14, finalY + 10);
    
    const clauses = [
      "1. Exclusivity to Franchise.", "2. Payment in Installments.", "3. Medical Fitness required.",
      "4. Code of Conduct adherence.", "5. Image Rights usage.", "6. Anti-Corruption compliance.",
      "7. Official Kit usage.", "8. Injury Insurance provided.", "9. Travel arrangements covered.",
      "10. Mandatory Training attendance.", "11. Social Media restrictions.", "12. Brand exclusivity.",
      "13. Promotional availability.", "14. Performance Bonuses.", "15. Termination rights.",
      "16. Confidentiality of salary.", "17. Transfer window rules.", "18. Drug Testing consent.",
      "19. Governing Law of Franchise City.", "20. One-year extension option."
    ];
    
    doc.setFontSize(8);
    doc.text(clauses.join(' | '), 14, finalY + 18, { maxWidth: 180 });

    doc.save(`${player.name}_Contract.pdf`);
  };
  if (!player) return <p>Loading...</p>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen flex flex-col items-center">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-2xl border-t-8 border-blue-600">
        <h1 className="text-3xl font-black mb-4">Welcome, {player.name}</h1>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-gray-100 rounded-xl">
            <p className="text-gray-500 text-sm">Position</p>
            <p className="font-bold">{player.position}</p>
          </div>
          <div className="p-4 bg-gray-100 rounded-xl">
            <p className="text-gray-500 text-sm">Base Price</p>
            <p className="font-bold">₹{player.basicRemuneration}</p>
          </div>
        </div>

        {player.status === 'SOLD' ? (
          <div className="bg-green-50 border-2 border-green-500 p-6 rounded-2xl text-center">
            <h2 className="text-2xl font-black text-green-700">CONGRATULATIONS!</h2>
            <p className="text-lg">You have been bought by <strong>{player.boughtBy}</strong></p>
            <p className="text-3xl font-black my-4 text-green-800">₹{player.soldPrice}</p>
            <button 
              onClick={downloadPDF}
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 transition"
            >
              Download Contract (PDF)
            </button>
          </div>
        ) : (
          <div className="bg-yellow-50 p-6 rounded-2xl text-center">
            <p className="text-yellow-700 font-bold">Auction is still live. Waiting for bids...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerDashboard;