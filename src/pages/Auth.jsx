import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../api';

export default function Auth({ mode }) {
  const isLogin = mode === 'login';
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const dest = location.state?.from || '/play';
  if (user) return <Navigate to={dest} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const u = isLogin
        ? await login(form.email, form.password)
        : await register(form.name, form.email, form.password);
      navigate(u.role === 'admin' && isLogin && !location.state?.from ? '/admin' : dest, { replace: true });
    } catch (ex) {
      setErr(errMsg(ex));
    } finally {
      setBusy(false);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <div className="brand-mark big">₹</div>
        <h1>{isLogin ? 'Welcome back' : 'Create your account'}</h1>
        <p className="muted">
          {isLogin ? 'Log in to play, climb the leaderboard and add questions.' : 'It takes less than a minute.'}
        </p>

        <form className="form" onSubmit={submit}>
          {!isLogin && (
            <label className="field">
              <span>Full name</span>
              <input required minLength={2} autoComplete="name" value={form.name} onChange={set('name')} />
            </label>
          )}
          <label className="field">
            <span>Email</span>
            <input type="email" required autoComplete="email" value={form.email} onChange={set('email')} />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              required
              minLength={6}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              value={form.password}
              onChange={set('password')}
            />
          </label>
          {err && <div className="alert alert-error">{err}</div>}
          <button className="btn btn-gold btn-block" disabled={busy}>
            {busy ? 'Please wait…' : isLogin ? 'Log in' : 'Sign up'}
          </button>
        </form>

        <p className="muted small center">
          {isLogin ? (
            <>New here? <Link to="/register" state={location.state}>Create an account</Link></>
          ) : (
            <>Already registered? <Link to="/login" state={location.state}>Log in</Link></>
          )}
        </p>
      </div>
    </div>
  );
}
