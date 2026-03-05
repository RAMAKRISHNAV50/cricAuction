    import { useState } from 'react';
    import { useNavigate } from 'react-router-dom';

    const Fsignup = () => {
    const [formData, setFormData] = useState({
        name: '',
        franchiseName: '',
        ownerName: '',
        state: '',
        networth: '', // Sent as string, Java Double handles the conversion
        email: '',
        password: '',
        confirmPassword: '' // Added for validation
    });

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Frontend Validation
        if (formData.password !== formData.confirmPassword) {
        alert("Passwords do not match!");
        return;
        }

        try {
        // Destructure to remove confirmPassword before sending to Backend
        const { confirmPassword, ...dataToSend } = formData;

        const response = await fetch('http://localhost:8080/franchises', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSend),
        });

        if (response.ok) {
            alert("Franchise Registered Successfully!");
            navigate('/login-franchise'); // Navigate to login after success
        } else {
            const errorData = await response.text();
            console.error("Server Error:", errorData);
            alert("Registration failed. Check if port 8080 is accessible.");
        }
        } catch (err) {
        console.error("Fetch Error:", err);
        alert("Cannot connect to server. Ensure Spring Boot is running on 8080.");
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100 py-10 px-4">
        <form 
            onSubmit={handleSubmit} 
            className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-lg border-t-8 border-blue-600"
        >
            <h2 className="text-3xl font-black mb-6 text-blue-900 text-center uppercase tracking-tight">
            Franchise Registration
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.keys(formData).map((key) => (
                <div key={key} className={key === 'email' || key.includes('password') ? "md:col-span-2" : ""}>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    {key.replace(/([A-Z])/g, ' $1')}
                </label>
                <input 
                    type={key.includes('password') ? 'password' : (key === 'networth' ? 'number' : 'text')} 
                    placeholder={`Enter ${key}`}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-gray-50"
                    onChange={(e) => setFormData({...formData, [key]: e.target.value})} 
                    required
                />
                </div>
            ))}
            </div>

            <button 
            type="submit"
            className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-black text-lg shadow-lg transform transition active:scale-95"
            >
            REGISTER FRANCHISE
            </button>
            
            <p className="text-center mt-4 text-sm text-gray-500">
            Already have a team? <span className="text-blue-600 font-bold cursor-pointer" onClick={() => navigate('/login-franchise')}>Login</span>
            </p>
        </form>
        </div>
    );
    };

    export default Fsignup;