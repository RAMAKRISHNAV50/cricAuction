import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  
  // Check for logged-in user data
  const userRole = localStorage.getItem('userRole');
  const franchiseName = localStorage.getItem('franchiseName');
  const userEmail = localStorage.getItem('userEmail');

  const handleLogout = () => {
    localStorage.clear(); // Clears all session data
    navigate('/login-franchise'); // Redirect to home page
  };

  return (
    <nav className="bg-blue-900 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="text-2xl font-black tracking-tighter hover:text-blue-400 transition">
              CRIC<span className="text-blue-400">AUCTION</span>
            </Link>
          </div>

          {/* Navigation Links */}
          {/* <div className="hidden md:flex space-x-8 font-medium">
            <Link to="/" className="hover:text-blue-400 transition">Home</Link>
            <Link to="/about" className="hover:text-blue-400 transition">About</Link>
            <Link to="/contact" className="hover:text-blue-400 transition">Contact</Link>
          </div> */}

          {/* Dynamic Action Buttons */}
          <div className="flex items-center space-x-4">
            {!userRole ? (
              // If NOT logged in, show both Login Buttons
              <>
                <Link to="/login-player" className="bg-transparent border border-white px-4 py-2 rounded-lg hover:bg-white hover:text-blue-900 transition text-sm">
                  Player Portal
                </Link>
                <Link to="/login-franchise" className="bg-blue-500 px-4 py-2 rounded-lg hover:bg-blue-600 transition text-sm font-bold">
                  Franchise Login
                </Link>
              </>
            ) : (
              // If logged in, show User Info and Logout
              <div className="flex items-center space-x-4">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-blue-300 uppercase leading-none">
                    {userRole === 'FRANCHISE' ? franchiseName : 'Player'}
                  </p>
                  <p className="text-[10px] text-gray-300 truncate max-w-[120px]">
                    {userEmail}
                  </p>
                </div>
                
                <button 
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition text-sm font-bold shadow-md"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;