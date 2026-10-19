import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Play from './pages/Play';
import Submit from './pages/Submit';
import Leaderboard from './pages/Leaderboard';
import Admin from './pages/Admin';

function Protected({ children, admin }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="center-screen"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (admin && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Auth mode="login" />} />
          <Route path="/register" element={<Auth mode="register" />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/play" element={<Protected><Play /></Protected>} />
          <Route path="/submit" element={<Protected><Submit /></Protected>} />
          <Route path="/admin" element={<Protected admin><Admin /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="footer">
        <div className="container">
          <span>© {new Date().getFullYear()} Lakhpati Quiz · Play for fun. No real money is involved.</span>
        </div>
      </footer>
    </>
  );
}
