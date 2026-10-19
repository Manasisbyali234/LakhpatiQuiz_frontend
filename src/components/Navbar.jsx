import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const close = () => setOpen(false);

  const signOut = () => {
    logout();
    close();
    navigate('/');
  };

  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link to="/" className="brand" onClick={close}>
          <span className="brand-mark">₹</span>
          <span>Lakhpati<b>Quiz</b></span>
        </Link>

        <button className="burger" aria-label="Toggle menu" aria-expanded={open} onClick={() => setOpen(!open)}>
          <span /><span /><span />
        </button>

        <nav className={`nav-links ${open ? 'open' : ''}`}>
          <NavLink to="/play" onClick={close}>Play</NavLink>
          <NavLink to="/leaderboard" onClick={close}>Leaderboard</NavLink>
          {user && <NavLink to="/submit" onClick={close}>Add Question</NavLink>}
          {user?.role === 'admin' && <NavLink to="/admin" onClick={close}>Admin</NavLink>}
          <div className="nav-auth">
            {user ? (
              <>
                <span className="hello">Hi, {user.name.split(' ')[0]}</span>
                <button className="btn btn-ghost btn-sm" onClick={signOut}>Log out</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm" onClick={close}>Log in</Link>
                <Link to="/register" className="btn btn-gold btn-sm" onClick={close}>Sign up</Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
