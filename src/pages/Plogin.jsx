import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Plogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // Logic: Fetch players from Port 8081
      const response = await fetch('http://localhost:8081/players');
      const players = await response.json();
      
      const user = players.find(p => p.email === email && p.password === password);

      if (user) {
        localStorage.setItem('userRole', 'PLAYER');
        localStorage.setItem('playerId', user.id); // Save ID to show specific player data
        alert(`Hello ${user.name}, checking your auction status...`);
        navigate('/dashboard-player');
      } else {
        alert("Invalid Player Credentials");
      }
    } catch (err) {
      console.error("Login Error:", err);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-green-800">
      <div className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-green-800 mb-6 text-center">Player Login</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" placeholder="Player Email" className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-green-500" 
            onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-green-500" 
            onChange={(e) => setPassword(e.target.value)} required />
          <button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition">View My Status</button>
        </form>
        <p className="mt-4 text-center text-sm">Not in the Pool? <Link to="/signup-player" className="text-green-600 font-bold">Sign up for Auction</Link></p>
      </div>
    </div>
  );
};

export default Plogin;