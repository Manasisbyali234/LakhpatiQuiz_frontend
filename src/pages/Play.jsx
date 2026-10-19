import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api';
import useConfig from '../useConfig';
import { inr } from '../utils';

const LIFELINES = [
  { key: 'fifty', label: '50:50', icon: '½' },
  { key: 'poll', label: 'Audience Poll', icon: '📊' },
  { key: 'phone', label: 'Phone a Friend', icon: '📞' },
  { key: 'flip', label: 'Flip Question', icon: '🔄' },
];

const REVEAL_MS = 2200;

export default function Play() {
  const cfg = useConfig();
  const [game, setGame] = useState(null);
  const [ready, setReady] = useState(false);
  const [pick, setPick] = useState(null); // option highlighted, not yet locked
  const [locked, setLocked] = useState(null); // option locked in (-1 = timed out)
  const [reveal, setReveal] = useState(null);
  const [busy, setBusy] = useState(false);
  const [time, setTime] = useState(45);
  const [err, setErr] = useState('');
  const [ended, setEnded] = useState(null);

  // Resume an unfinished game after a refresh.
  useEffect(() => {
    api
      .get('/game/active')
      .then((r) => r.data.game && setGame(r.data.game))
      .catch((e) => setErr(errMsg(e)))
      .finally(() => setReady(true));
  }, []);

  // Reset the countdown whenever a new question appears.
  useEffect(() => {
    if (cfg && game?.question) setTime(cfg.timer);
  }, [game?.question?.id, cfg]);

  // Countdown.
  useEffect(() => {
    if (!game?.question || locked !== null || busy) return;
    if (time <= 0) {
      lock(-1);
      return;
    }
    const t = setTimeout(() => setTime((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [time, game, locked, busy]);

  async function start() {
    setBusy(true);
    setErr('');
    setEnded(null);
    try {
      const { data } = await api.post('/game/start');
      setGame(data.game);
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  async function lock(choice) {
    if (locked !== null || !game?.question) return;
    const q = game.question;
    setLocked(choice);
    setBusy(true);
    setErr('');
    try {
      const { data } = await api.post(`/game/${game.id}/answer`, { choice });
      setReveal({ correctIndex: data.correctIndex, correct: data.correct });
      await new Promise((r) => setTimeout(r, REVEAL_MS));
      if (data.game.status !== 'active') {
        setEnded({ ...data.game, question: q, correctIndex: data.correctIndex, timedOut: data.timedOut });
      }
      setGame(data.game);
      setPick(null);
      setLocked(null);
      setReveal(null);
    } catch (e) {
      setErr(errMsg(e));
      setLocked(null);
    } finally {
      setBusy(false);
    }
  }

  async function playLifeline(key) {
    if (busy || locked !== null || game.lifelines[key]) return;
    setBusy(true);
    setErr('');
    try {
      const { data } = await api.post(`/game/${game.id}/lifeline`, { type: key });
      setGame(data.game);
      if (key === 'flip') setPick(null);
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  async function quit() {
    if (!window.confirm(`Quit now and take home ${inr(game.winnings)}?`)) return;
    setBusy(true);
    try {
      const { data } = await api.post(`/game/${game.id}/quit`);
      setEnded({ ...data.game, question: game.question, correctIndex: data.correctIndex });
      setGame(data.game);
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  if (!ready || !cfg) return <div className="center-screen"><div className="spinner" /></div>;

  // ---------- Start / result screens ----------
  if (!game || game.status !== 'active') {
    return (
      <div className="container page narrow">
        {ended ? <Result ended={ended} /> : (
          <div className="card pad center">
            <h1 className="page-title">Ready to play?</h1>
            <p className="muted">
              {cfg.levels.length} questions · {cfg.timer} seconds each · checkpoints at {cfg.safeLevels.map((l) => inr(cfg.levels[l - 1])).join(' and ')}.
            </p>
          </div>
        )}
        {err && <div className="alert alert-error">{err}</div>}
        <div className="center actions-row">
          <button className="btn btn-gold btn-lg" onClick={start} disabled={busy}>
            {busy ? 'Starting…' : ended ? 'Play again' : 'Start game'}
          </button>
          {ended && <Link to="/leaderboard" className="btn btn-ghost btn-lg">Leaderboard</Link>}
        </div>
      </div>
    );
  }

  // ---------- Live game ----------
  const q = game.question;
  const playingFor = cfg.levels[game.level - 1];
  const guaranteed = Math.max(0, ...cfg.safeLevels.filter((s) => s < game.level).map((s) => cfg.levels[s - 1]));
  const pct = Math.max(0, (time / cfg.timer) * 100);

  const optClass = (i) => {
    if (game.hidden.includes(i)) return 'opt hidden';
    if (reveal) {
      if (i === reveal.correctIndex) return 'opt correct';
      if (i === locked) return 'opt wrong';
      return 'opt dim';
    }
    if (locked === i) return 'opt locked';
    if (pick === i) return 'opt picked';
    return 'opt';
  };

  const disabled = busy || locked !== null;

  return (
    <div className="container page">
      <div className="play-grid">
        <section className="play-main">
          <div className="prize-bar">
            <div><small>Question {game.level} of {cfg.levels.length}</small><b>Playing for {inr(playingFor)}</b></div>
            <div className="right"><small>Safe amount</small><b>{inr(guaranteed)}</b></div>
          </div>

          <div className={`timer ${time <= 10 ? 'danger' : ''}`} role="timer" aria-label={`${time} seconds left`}>
            <div className="timer-fill" style={{ width: `${pct}%` }} />
            <span>{time}s</span>
          </div>

          <div className="card question-card">
            <small className="category">{q.category}</small>
            <h2>{q.text}</h2>
          </div>

          <div className="options">
            {q.options.map((text, i) => (
              <button
                key={i}
                className={optClass(i)}
                disabled={disabled || game.hidden.includes(i)}
                onClick={() => (pick === i ? lock(i) : setPick(i))}
              >
                <span className="letter">{'ABCD'[i]}</span>
                <span className="opt-text">{game.hidden.includes(i) ? '' : text}</span>
                {game.hints.poll && !game.hidden.includes(i) && (
                  <span className="poll" aria-label={`${game.hints.poll[i]} percent`}>
                    <i style={{ width: `${game.hints.poll[i]}%` }} />
                    <b>{game.hints.poll[i]}%</b>
                  </span>
                )}
              </button>
            ))}
          </div>

          {game.hints.phone && (
            <div className="alert alert-info">
              📞 Your friend says: “I'm about {game.hints.phone.confidence}% sure it's <b>option {'ABCD'[game.hints.phone.answer]}</b>.”
            </div>
          )}
          {err && <div className="alert alert-error">{err}</div>}

          <div className="controls">
            <button className="btn btn-gold btn-lg" disabled={disabled || pick === null} onClick={() => lock(pick)}>
              Lock final answer
            </button>
            <button className="btn btn-ghost" disabled={disabled} onClick={quit}>
              Quit &amp; take {inr(game.winnings)}
            </button>
          </div>

          <div className="lifelines" aria-label="Lifelines">
            {LIFELINES.map((l) => (
              <button
                key={l.key}
                className={`lifeline ${game.lifelines[l.key] ? 'used' : ''}`}
                disabled={disabled || game.lifelines[l.key]}
                onClick={() => playLifeline(l.key)}
              >
                <span className="lf-icon">{l.icon}</span>
                <span>{l.label}</span>
              </button>
            ))}
          </div>
        </section>

        <aside className="ladder" aria-label="Prize ladder">
          <ol>
            {cfg.levels.map((amt, i) => ({ amt, lvl: i + 1 })).reverse().map(({ amt, lvl }) => (
              <li
                key={lvl}
                className={[
                  lvl === game.level ? 'current' : '',
                  lvl < game.level ? 'done' : '',
                  cfg.safeLevels.includes(lvl) ? 'safe' : '',
                ].join(' ')}
              >
                <span>{lvl}</span>
                <b>{inr(amt)}</b>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </div>
  );
}

function Result({ ended }) {
  const { status, winnings, timedOut, question, correctIndex } = ended;
  const won = status === 'won';
  const title = won ? '🏆 You are a Lakhpati!' : status === 'lost' ? (timedOut ? "⏰ Time's up!" : '❌ Wrong answer') : '👏 Well played!';
  const sub = won
    ? 'You answered every question correctly.'
    : status === 'lost'
    ? 'Better luck next time — you fall back to your last checkpoint.'
    : 'You decided to walk away with your winnings.';

  return (
    <div className={`card pad center result ${won ? 'result-win' : ''}`}>
      <h1 className="page-title">{title}</h1>
      <p className="muted">{sub}</p>
      <div className="result-amount">{inr(winnings)}</div>
      <small className="muted">Total winnings</small>
      {status !== 'won' && question && (
        <p className="correct-line">
          Correct answer: <b>{'ABCD'[correctIndex]}. {question.options[correctIndex]}</b>
        </p>
      )}
    </div>
  );
}
