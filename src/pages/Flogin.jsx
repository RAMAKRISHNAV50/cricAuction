import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Flogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8080/franchises');
      const franchises = await response.json();
      
      const user = franchises.find(f => f.email === email && f.password === password);

      if (user) {
        localStorage.setItem('userRole', 'FRANCHISE');
        localStorage.setItem('userId', user.id);
        
        // --- CRUCIAL FIX HERE ---
        // This must match the key used in your FranchiseDashboard
        localStorage.setItem('franchiseName', user.franchiseName); 
        localStorage.setItem('userEmail', user.email);
        
        alert(`Welcome back, ${user.franchiseName}!`);
        navigate('/dashboard-franchise');
      } else {
        alert("Invalid Email or Password");
      }
    } catch (err) {
      console.error("Login Error:", err);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-blue-900">
      <div className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-blue-900 mb-6 text-center italic tracking-tighter">Franchise Login</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="email" 
            placeholder="Corporate Email" 
            className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all active:scale-95 shadow-lg">
            Enter Auction Room
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          New Team? <Link to="/signup-franchise" className="text-blue-600 font-bold hover:underline">Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default Flogin;