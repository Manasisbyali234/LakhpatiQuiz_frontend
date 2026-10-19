import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { inr } from '../utils';

export default function Leaderboard() {
  const [items, setItems] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.get('/game/leaderboard').then((r) => setItems(r.data.items)).catch((e) => setErr(errMsg(e)));
  }, []);

  const medal = (i) => ['🥇', '🥈', '🥉'][i] || i + 1;

  return (
    <div className="container page">
      <h1 className="page-title">Leaderboard</h1>
      <p className="muted">The top 20 players ranked by their best winnings.</p>

      {err && <div className="alert alert-error">{err}</div>}
      {!items && !err && <div className="center-screen"><div className="spinner" /></div>}
      {items && items.length === 0 && <div className="card empty">No games finished yet. Be the first on the board!</div>}

      {items && items.length > 0 && (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr><th>Rank</th><th>Player</th><th className="num">Best winnings</th><th className="num hide-sm">Games</th><th className="num hide-sm">Top prizes</th></tr>
            </thead>
            <tbody>
              {items.map((r, i) => (
                <tr key={i}>
                  <td className="rank">{medal(i)}</td>
                  <td>{r.name}</td>
                  <td className="num gold-text">{inr(r.best)}</td>
                  <td className="num hide-sm">{r.games}</td>
                  <td className="num hide-sm">{r.wins}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
