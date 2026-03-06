import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false); // For mobile menu toggle
  
  const userRole = localStorage.getItem('userRole');
  const franchiseName = localStorage.getItem('franchiseName');
  const userEmail = localStorage.getItem('userEmail');

  const handleLogout = () => {
    localStorage.clear();
    setIsOpen(false);
    navigate('/login-franchise');
  };

  return (
    <nav className="bg-blue-900 text-white shadow-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="text-xl md:text-2xl font-black tracking-tighter hover:text-blue-400 transition">
              CRIC<span className="text-blue-400">AUCTION</span>
            </Link>
          </div>

          {/* Hamburger Icon for Mobile */}
          <div className="md:hidden">
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className="text-white focus:outline-none p-2"
            >
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                )}
              </svg>
            </button>
          </div>

          {/* Desktop Desktop Actions */}
          <div className="hidden md:flex items-center space-x-6">
            {!userRole ? (
              <>
                <Link to="/login-player" className="hover:text-blue-300 font-medium transition">Player Portal</Link>
                <Link to="/login-franchise" className="bg-blue-500 px-6 py-2 rounded-full hover:bg-blue-600 transition font-bold shadow-lg">
                  Franchise Login
                </Link>
              </>
            ) : (
              <div className="flex items-center space-x-4 border-l border-blue-700 pl-6">
                <div className="text-right">
                  <p className="text-xs font-black text-blue-300 uppercase leading-none">
                    {userRole === 'FRANCHISE' ? franchiseName : 'Player Account'}
                  </p>
                  <p className="text-[10px] text-gray-300 italic">{userEmail}</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 px-5 py-2 rounded-full transition text-sm font-bold shadow-md"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <div className={`${isOpen ? 'block' : 'hidden'} md:hidden bg-blue-800 border-t border-blue-700`}>
        <div className="px-4 pt-4 pb-6 space-y-4">
          {!userRole ? (
            <div className="flex flex-col space-y-3">
              <Link onClick={() => setIsOpen(false)} to="/login-player" className="block text-center border border-blue-400 py-3 rounded-xl font-bold">
                Player Portal
              </Link>
              <Link onClick={() => setIsOpen(false)} to="/login-franchise" className="block text-center bg-blue-500 py-3 rounded-xl font-bold">
                Franchise Login
              </Link>
            </div>
          ) : (
            <div className="flex flex-col space-y-4">
              <div className="bg-blue-900 p-4 rounded-xl text-center">
                <p className="text-sm font-black text-blue-300 uppercase">
                  {userRole === 'FRANCHISE' ? franchiseName : 'Player'}
                </p>
                <p className="text-xs text-gray-400">{userEmail}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full bg-red-500 py-4 rounded-xl font-black text-lg shadow-lg"
              >
                LOGOUT
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;