import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Components
import Navbar from './components/Navbar';

// Standard Pages
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';

// Player Routes
import Psignup from './pages/Psignup';
import Plogin from './pages/Plogin';
import PlayerDashboard from './components/PlayerDashboard';

// Franchise Routes
import Fsignup from './pages/Fsignup';
import Flogin from './pages/Flogin';
import FranchiseDashboard from './components/FranchiseDashboard'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Navbar stays at the top of every page */}
        <Navbar />

        {/* Main Content Area */}
        <main className="flex-grow">
          <Routes>
            {/* General Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />

            {/* Player Specific Routes */}
            <Route path="/signup-player" element={<Psignup />} />
            <Route path="/login-player" element={<Plogin />} />
            <Route path="/dashboard-player" element={<PlayerDashboard />} />

            {/* Franchise Specific Routes */}
            <Route path="/signup-franchise" element={<Fsignup />} />
            <Route path="/login-franchise" element={<Flogin />} />
            <Route path="/dashboard-franchise" element={<FranchiseDashboard />} />
          </Routes>
        </main>

        {/* Optional: Add a Footer here later */}
      </div>
    </Router>
  );
}

export default App;