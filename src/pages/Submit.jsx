import { useCallback, useEffect, useState } from 'react';
import api from '../api';
import useConfig from '../useConfig';
import QuestionForm from '../components/QuestionForm';
import { fmtDate } from '../utils';

export default function Submit() {
  const cfg = useConfig();
  const [mine, setMine] = useState([]);
  const [msg, setMsg] = useState('');

  const load = useCallback(() => {
    api.get('/questions/mine').then((r) => setMine(r.data.items)).catch(() => {});
  }, []);
  useEffect(load, [load]);

  const submit = async (form) => {
    const { data } = await api.post('/questions/submit', form);
    setMsg(data.message);
    load();
  };

  return (
    <div className="container page">
      <h1 className="page-title">Add a question</h1>
      <p className="muted">Write a question with four options and mark the right one. An admin reviews it before it appears in the game.</p>

      <div className="two-col">
        <div className="card pad">
          {msg && <div className="alert alert-ok">{msg}</div>}
          <QuestionForm levels={cfg?.levels} onSubmit={submit} submitLabel="Submit for review" />
        </div>

        <div className="card pad">
          <h3>Your submissions</h3>
          {mine.length === 0 && <p className="muted">Nothing yet — your questions will show up here.</p>}
          <ul className="mine-list">
            {mine.map((q) => (
              <li key={q._id}>
                <div>
                  <div className="mine-q">{q.text}</div>
                  <small className="muted">{fmtDate(q.createdAt)} · Level {q.level}</small>
                </div>
                <span className={`badge badge-${q.status}`}>{q.status}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
