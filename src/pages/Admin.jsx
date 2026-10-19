import { useCallback, useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import useConfig from '../useConfig';
import QuestionForm from '../components/QuestionForm';
import { fmtDate, inr } from '../utils';

const TABS = [
  ['overview', 'Overview'],
  ['questions', 'Questions'],
  ['users', 'Players'],
];

export default function Admin() {
  const cfg = useConfig();
  const [tab, setTab] = useState('overview');

  return (
    <div className="container page">
      <h1 className="page-title">Admin panel</h1>
      <div className="tabs" role="tablist">
        {TABS.map(([key, label]) => (
          <button key={key} role="tab" aria-selected={tab === key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'overview' && <Overview cfg={cfg} goQuestions={() => setTab('questions')} />}
      {tab === 'questions' && <Questions cfg={cfg} />}
      {tab === 'users' && <Players />}
    </div>
  );
}

function Overview({ cfg, goQuestions }) {
  const [s, setS] = useState(null);
  useEffect(() => {
    api.get('/admin/stats').then((r) => setS(r.data)).catch(() => {});
  }, []);
  if (!s) return <div className="center-screen"><div className="spinner" /></div>;

  const counts = Object.fromEntries(s.byLevel.map((l) => [l.level, l.count]));
  const max = Math.max(1, ...Object.values(counts));

  return (
    <>
      <div className="stats">
        <Stat label="Players" value={s.users} />
        <Stat label="Games finished" value={s.games} />
        <Stat label="Top prizes won" value={s.won} />
        <Stat label="Live questions" value={s.questions.approved} />
        <button className="stat stat-alert" onClick={goQuestions}>
          <b>{s.questions.pending}</b><span>Awaiting review</span>
        </button>
      </div>

      <div className="card pad">
        <h3>Approved questions per level</h3>
        <p className="muted small">Aim for at least 3 per level so games feel fresh.</p>
        <div className="bars">
          {(cfg?.levels || []).map((amt, i) => {
            const n = counts[i + 1] || 0;
            return (
              <div className="bar-row" key={i}>
                <span>Q{i + 1} · {inr(amt)}</span>
                <div className="bar"><i style={{ width: `${(n / max) * 100}%` }} className={n < 3 ? 'low' : ''} /></div>
                <b>{n}</b>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

const Stat = ({ label, value }) => (
  <div className="stat"><b>{value}</b><span>{label}</span></div>
);

function Questions({ cfg }) {
  const [filters, setFilters] = useState({ status: '', level: '', q: '' });
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState(null); // null | 'new' | question
  const [msg, setMsg] = useState({ type: '', text: '' });

  const load = useCallback(() => {
    setLoading(true);
    api
      .get('/admin/questions', { params: { ...filters, page } })
      .then((r) => setData(r.data))
      .catch((e) => setMsg({ type: 'error', text: errMsg(e) }))
      .finally(() => setLoading(false));
  }, [filters, page]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const setFilter = (k, v) => {
    setFilters((f) => ({ ...f, [k]: v }));
    setPage(1);
  };

  const save = async (form) => {
    if (edit === 'new') await api.post('/admin/questions', form);
    else await api.put(`/admin/questions/${edit._id}`, form);
    setEdit(null);
    setMsg({ type: 'ok', text: 'Question saved.' });
    load();
  };

  const setStatus = async (id, status) => {
    try {
      await api.patch(`/admin/questions/${id}/status`, { status });
      load();
    } catch (e) {
      setMsg({ type: 'error', text: errMsg(e) });
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this question permanently?')) return;
    try {
      await api.delete(`/admin/questions/${id}`);
      setMsg({ type: 'ok', text: 'Question deleted.' });
      load();
    } catch (e) {
      setMsg({ type: 'error', text: errMsg(e) });
    }
  };

  return (
    <>
      <div className="toolbar">
        <input
          type="search"
          placeholder="Search questions…"
          value={filters.q}
          onChange={(e) => setFilter('q', e.target.value)}
        />
        <select value={filters.status} onChange={(e) => setFilter('status', e.target.value)}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select value={filters.level} onChange={(e) => setFilter('level', e.target.value)}>
          <option value="">All levels</option>
          {(cfg?.levels || []).map((amt, i) => <option key={i} value={i + 1}>Level {i + 1} · {inr(amt)}</option>)}
        </select>
        <button className="btn btn-gold" onClick={() => setEdit('new')}>+ New question</button>
      </div>

      {msg.text && <div className={`alert alert-${msg.type === 'ok' ? 'ok' : 'error'}`}>{msg.text}</div>}

      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr><th>Question</th><th>Level</th><th>Status</th><th className="hide-sm">Added by</th><th className="num">Actions</th></tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan="5" className="center muted">Loading…</td></tr>}
            {!loading && data.items.length === 0 && <tr><td colSpan="5" className="center muted">No questions match.</td></tr>}
            {!loading && data.items.map((q) => (
              <tr key={q._id}>
                <td>
                  <div className="mine-q">{q.text}</div>
                  <div className="opt-chips">
                    {q.options.map((o, i) => (
                      <span key={i} className={i === q.correctIndex ? 'chip ok' : 'chip'}>{'ABCD'[i]}. {o}</span>
                    ))}
                  </div>
                </td>
                <td>{q.level}</td>
                <td><span className={`badge badge-${q.status}`}>{q.status}</span></td>
                <td className="hide-sm">{q.createdBy?.name || '—'}</td>
                <td className="num actions">
                  {q.status !== 'approved' && <button className="link ok" onClick={() => setStatus(q._id, 'approved')}>Approve</button>}
                  {q.status === 'pending' && <button className="link warn" onClick={() => setStatus(q._id, 'rejected')}>Reject</button>}
                  <button className="link" onClick={() => setEdit(q)}>Edit</button>
                  <button className="link danger" onClick={() => remove(q._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pager">
        <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
        <span>Page {data.page || page} of {data.pages} · {data.total} questions</span>
        <button className="btn btn-ghost btn-sm" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next →</button>
      </div>

      {edit && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setEdit(null)}>
          <div className="modal card" role="dialog" aria-modal="true">
            <h3>{edit === 'new' ? 'Add question' : 'Edit question'}</h3>
            <QuestionForm
              initial={edit === 'new' ? null : edit}
              levels={cfg?.levels}
              onSubmit={save}
              onCancel={() => setEdit(null)}
              submitLabel={edit === 'new' ? 'Add question' : 'Save changes'}
            />
          </div>
        </div>
      )}
    </>
  );
}

function Players() {
  const [items, setItems] = useState(null);
  useEffect(() => {
    api.get('/admin/users').then((r) => setItems(r.data.items)).catch(() => setItems([]));
  }, []);
  if (!items) return <div className="center-screen"><div className="spinner" /></div>;

  return (
    <div className="card table-wrap">
      <table className="table">
        <thead>
          <tr><th>Name</th><th className="hide-sm">Email</th><th>Role</th><th className="num">Games</th><th className="num">Best</th><th className="hide-sm">Joined</th></tr>
        </thead>
        <tbody>
          {items.map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td className="hide-sm">{u.email}</td>
              <td><span className={`badge ${u.role === 'admin' ? 'badge-approved' : 'badge-pending'}`}>{u.role}</span></td>
              <td className="num">{u.games}</td>
              <td className="num">{inr(u.best)}</td>
              <td className="hide-sm">{fmtDate(u.joined)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
