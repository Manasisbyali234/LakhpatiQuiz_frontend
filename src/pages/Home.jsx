import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useConfig from '../useConfig';
import { inr } from '../utils';

const LIFELINES = [
  { icon: '½', title: '50:50', text: 'Two wrong answers vanish, leaving you a coin-flip.' },
  { icon: '📊', title: 'Audience Poll', text: 'See how the crowd voted. Harder questions fool them more often.' },
  { icon: '📞', title: 'Phone a Friend', text: 'Your friend gives their best guess and how sure they are.' },
  { icon: '🔄', title: 'Flip the Question', text: 'Not your topic? Swap it for a fresh question of the same value.' },
];

const STEPS = [
  { n: 1, title: 'Create a free account', text: 'Sign up in seconds so your winnings reach the leaderboard.' },
  { n: 2, title: 'Answer & climb', text: 'Lock in your answer within 45 seconds. Each correct answer is worth more.' },
  { n: 3, title: 'Walk away or risk it', text: 'Quit any time to keep your prize, or go for the ₹5,00,000 top prize.' },
];

export default function Home() {
  const { user } = useAuth();
  const cfg = useConfig();
  const cta = user ? '/play' : '/register';

  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <span className="pill">11 levels · 4 lifelines · ₹5,00,000 top prize</span>
            <h1>
              Think you can become a <span className="gold-text">Lakhpati</span>?
            </h1>
            <p className="lead">
              Climb the prize ladder one question at a time. Use your lifelines wisely, bank your checkpoints
              and see how far your knowledge can take you.
            </p>
            <div className="hero-actions">
              <Link to={cta} className="btn btn-gold btn-lg">{user ? 'Play now' : 'Start playing free'}</Link>
              <Link to="/leaderboard" className="btn btn-ghost btn-lg">View leaderboard</Link>
            </div>
          </div>

          <div className="hero-card card" aria-hidden="true">
            <div className="mini-q">Which planet is known as the Red Planet?</div>
            <div className="mini-opts">
              <span>A: Venus</span><span className="ok">B: Mars</span>
              <span>C: Jupiter</span><span>D: Mercury</span>
            </div>
            <div className="mini-foot">Question 2 · {inr(2000)}</div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">How it works</h2>
          <div className="grid-3">
            {STEPS.map((s) => (
              <div className="card step" key={s.n}>
                <div className="step-n">{s.n}</div>
                <h3>{s.title}</h3>
                <p className="muted">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="container split">
          <div>
            <h2 className="section-title left">The prize ladder</h2>
            <p className="muted">
              Reach <b>Level 5</b> and <b>Level 9</b> to lock in a guaranteed checkpoint. A wrong answer drops you
              back to your last checkpoint — or you can quit early and keep everything you've won.
            </p>
          </div>
          <ol className="ladder-preview">
            {cfg
              ? [...cfg.levels].map((amt, i) => ({ amt, lvl: i + 1 })).reverse().map(({ amt, lvl }) => (
                  <li key={lvl} className={cfg.safeLevels.includes(lvl) ? 'safe' : ''}>
                    <span>Q{lvl}</span>
                    <b>{inr(amt)}</b>
                    {cfg.safeLevels.includes(lvl) && <em>Checkpoint</em>}
                  </li>
                ))
              : <li>Loading…</li>}
          </ol>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">Your four lifelines</h2>
          <div className="grid-4">
            {LIFELINES.map((l) => (
              <div className="card lifeline-card" key={l.title}>
                <div className="lf-icon">{l.icon}</div>
                <h3>{l.title}</h3>
                <p className="muted">{l.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="card cta">
            <div>
              <h2>Got a tricky question?</h2>
              <p className="muted">Logged-in players can submit their own questions with four options. Approved ones go live in the game.</p>
            </div>
            <Link to={user ? '/submit' : '/login'} state={{ from: '/submit' }} className="btn btn-gold btn-lg">
              Add a question
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
