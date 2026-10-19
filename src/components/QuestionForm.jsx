import { useState } from 'react';
import { errMsg } from '../api';
import { inr } from '../utils';

const CATEGORIES = ['General Knowledge', 'History', 'Geography', 'Science', 'Polity', 'Sports', 'Entertainment', 'Technology'];
const empty = { text: '', options: ['', '', '', ''], correctIndex: 0, level: 1, category: 'General Knowledge' };

// Shared by the admin panel and the user "Add Question" page.
export default function QuestionForm({ initial, levels = [], onSubmit, submitLabel = 'Save question', onCancel }) {
  const [form, setForm] = useState(initial ? { ...empty, ...initial, options: [...initial.options] } : empty);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const setOption = (i, v) => setForm((f) => ({ ...f, options: f.options.map((o, idx) => (idx === i ? v : o)) }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      await onSubmit(form);
      if (!initial) setForm(empty);
    } catch (ex) {
      setErr(errMsg(ex));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="form" onSubmit={submit}>
      <label className="field">
        <span>Question</span>
        <textarea
          rows={3}
          maxLength={300}
          required
          placeholder="Type your question here…"
          value={form.text}
          onChange={(e) => setForm({ ...form, text: e.target.value })}
        />
        <small>{form.text.length}/300</small>
      </label>

      <fieldset className="options-grid">
        <legend>Four options — select the correct one</legend>
        {form.options.map((o, i) => (
          <div key={i} className={`option-input ${form.correctIndex === i ? 'is-correct' : ''}`}>
            <label className="radio" title="Mark as correct answer">
              <input
                type="radio"
                name="correct"
                checked={form.correctIndex === i}
                onChange={() => setForm({ ...form, correctIndex: i })}
              />
              <span className="letter">{'ABCD'[i]}</span>
            </label>
            <input
              type="text"
              required
              maxLength={80}
              placeholder={`Option ${'ABCD'[i]}`}
              value={o}
              onChange={(e) => setOption(i, e.target.value)}
            />
          </div>
        ))}
      </fieldset>

      <div className="row">
        <label className="field">
          <span>Difficulty level</span>
          <select value={form.level} onChange={(e) => setForm({ ...form, level: Number(e.target.value) })}>
            {(levels.length ? levels : [1000]).map((amt, i) => (
              <option key={i} value={i + 1}>
                Level {i + 1} — {inr(amt)}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Category</span>
          <input
            list="categories"
            value={form.category}
            maxLength={40}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
          <datalist id="categories">
            {CATEGORIES.map((c) => <option key={c} value={c} />)}
          </datalist>
        </label>
      </div>

      {err && <div className="alert alert-error">{err}</div>}

      <div className="form-actions">
        {onCancel && <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>}
        <button className="btn btn-gold" disabled={busy}>{busy ? 'Saving…' : submitLabel}</button>
      </div>
    </form>
  );
}
