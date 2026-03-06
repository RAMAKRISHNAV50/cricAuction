import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Psignup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    country: '',
    position: '', // e.g., Batsman, Bowler
    age: '',
    mobile: '',
    basicRemuneration: '', // Base Price
    averagePerformance: '' // e.g., Strike Rate or Average
  });

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      // UPDATED: Pointing to your live Render Player Backend
      const response = await fetch('https://springboot-players-2.onrender.com/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          status: 'AVAILABLE', 
          soldPrice: 0,
          boughtBy: null
        }),
      });

      if (response.ok) {
        alert("Player Profile Created Successfully!");
        navigate('/login-player'); // Updated to point to your player login path
      } else {
        const errorText = await response.text();
        console.error("Server Error:", errorText);
        alert("Error saving player. Check if the Render service is active.");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      alert("Network error: Could not reach the live Players API.");
    }
  };
  return (
    <div className="flex justify-center items-center min-h-screen bg-slate-100 py-12 px-4">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-4">
        <h2 className="col-span-full text-3xl font-bold text-center text-blue-900 mb-4">Player Registration</h2>
        
        {/* Dynamic Input Fields */}
        {Object.keys(formData).map((key) => (
          <div key={key} className="flex flex-col">
            <label className="text-sm font-semibold text-gray-600 capitalize">
              {key.replace(/([A-Z])/g, ' $1')}
            </label>
            <input 
              type={key.includes('password') ? 'password' : (key === 'age' || key === 'basicRemuneration' ? 'number' : 'text')}
              required
              className="mt-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 outline-none transition"
              placeholder={`Enter ${key}`}
              onChange={(e) => setFormData({...formData, [key]: e.target.value})}
            />
          </div>
        ))}

        <button className="col-span-full mt-6 bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 rounded-xl transition duration-300 shadow-lg">
          Register for Auction
        </button>
      </form>
    </div>
  );
};

export default Psignup;