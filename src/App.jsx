import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Navbar             from './components/Navbar';
import Home               from './pages/Home';
import Psignup            from './pages/Psignup';
import Plogin             from './pages/Plogin';
import PlayerDashboard    from './components/PlayerDashboard';
import Fsignup            from './pages/Fsignup';
import Flogin             from './pages/Flogin';
import FranchiseDashboard from './components/FranchiseDashboard';
import AuctionDashboard   from './components/AuctionDashboard';
import AdminLogin         from './pages/AdminLogin';
import AdminDashboard     from './components/AdminDashboard';
import AdminPanel         from './components/AdminPanel';

// ── Route Guards ──────────────────────────────────────────────────────────────

const ProtectedRoute = ({ role, children }) => {
  const userRole = localStorage.getItem('userRole');
  if (userRole !== role) {
    if (role === 'ADMIN')     return <Navigate to="/admin-login"     replace />;
    if (role === 'FRANCHISE') return <Navigate to="/login-franchise" replace />;
    return                           <Navigate to="/login-player"    replace />;
  }
  return children;
};

const GuestRoute = ({ children }) => {
  const userRole = localStorage.getItem('userRole');
  if (userRole === 'FRANCHISE') return <Navigate to="/dashboard-franchise" replace />;
  if (userRole === 'PLAYER')    return <Navigate to="/dashboard-player"    replace />;
  if (userRole === 'ADMIN')     return <Navigate to="/admin-dashboard"     replace />;
  return children;
};

// ── App ───────────────────────────────────────────────────────────────────────

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#04091c] flex flex-col">
        <Routes>

          {/* ADMIN routes — full-screen, no Navbar */}
          <Route path="/admin-login" element={
            <GuestRoute><AdminLogin /></GuestRoute>
          } />
          <Route path="/admin-dashboard" element={
            <ProtectedRoute role="ADMIN"><AdminDashboard /></ProtectedRoute>
          } />
          <Route path="/admin-control" element={
            <ProtectedRoute role="ADMIN"><AdminPanel /></ProtectedRoute>
          } />

          {/* All other routes — with Navbar */}
          <Route path="*" element={
            <>
              <Navbar />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Home />} />

                  <Route path="/signup-player"   element={<GuestRoute><Psignup /></GuestRoute>} />
                  <Route path="/login-player"    element={<GuestRoute><Plogin  /></GuestRoute>} />

                  <Route path="/signup-franchise" element={<GuestRoute><Fsignup /></GuestRoute>} />
                  <Route path="/login-franchise"  element={<GuestRoute><Flogin  /></GuestRoute>} />

                  <Route path="/dashboard-player" element={
                    <ProtectedRoute role="PLAYER"><PlayerDashboard /></ProtectedRoute>
                  } />

                  <Route path="/dashboard-franchise" element={
                    <ProtectedRoute role="FRANCHISE"><FranchiseDashboard /></ProtectedRoute>
                  } />
                  <Route path="/live-auction" element={
                    <ProtectedRoute role="FRANCHISE"><AuctionDashboard /></ProtectedRoute>
                  } />

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
            </>
          } />

        </Routes>
      </div>
    </Router>
  );
}

export default App;