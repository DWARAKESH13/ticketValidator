import { useEffect, useMemo, useState } from "react";
import Scanner from "./Scanner.jsx";
import { parsePayload, validateTicket } from "./api.js";

const LABEL = { valid: "Valid", duplicate: "Already used", not_found: "Not found", error: "Error" };
const KEY = "tqv.history.v1";
const fmt = (iso) => new Date(iso).toLocaleString();

function useHistory() {
  const [items, setItems] = useState(() => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } });
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(items.slice(0, 1000))); } catch {} }, [items]);
  return [items, (r) => setItems((p) => [r, ...p]), () => setItems([])];
}

function Badge({ status }) { return <span className={`badge ${status}`}>{LABEL[status]}</span>; }

function Validate({ add, history }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [manual, setManual] = useState("");
  const [cam, setCam] = useState(true);

  async function run(raw) {
    const reg = parsePayload(raw);
    if (!reg || busy) return;
    setBusy(true);
    const r = await validateTicket(reg);
    add(r); setResult(r); setBusy(false);
  }
  const today = history.filter((h) => new Date(h.at).toDateString() === new Date().toDateString()).length;

  return (
    <div className="grid two">
      <section className="panel">
        <div className="row"><h2>Scan ticket</h2>
          <button className="ghost" onClick={() => setCam((c) => !c)}>{cam ? "Turn camera off" : "Turn camera on"}</button></div>
        {cam ? <Scanner onScan={run} paused={busy} /> : <p className="muted">Camera is off.</p>}
        <div className="manual">
          <input value={manual} onChange={(e) => setManual(e.target.value)} placeholder="Registration number"
            onKeyDown={(e) => e.key === "Enter" && (run(manual), setManual(""))} aria-label="Registration number" />
          <button disabled={busy || !manual.trim()} onClick={() => { run(manual); setManual(""); }}>Validate</button>
        </div>
      </section>
      <section className={`panel result ${result?.status || ""}`} aria-live="polite">
        <h2>Result</h2>
        {busy && <p className="muted">Validating…</p>}
        {!busy && !result && <p className="muted">Point the camera at a ticket QR code. {today} scanned today.</p>}
        {!busy && result && (<>
          <div className="verdict"><Badge status={result.status} /><strong>{result.message}</strong></div>
          <p className="reg">{result.registration}</p>
          {result.ticket && (<dl className="kv">
            {Object.entries(result.ticket).filter(([, v]) => v !== null && typeof v !== "object").map(([k, v]) => (
              <div key={k}><dt>{k.replace(/_/g, " ")}</dt><dd>{String(v)}</dd></div>))}
          </dl>)}
          <p className="muted">{fmt(result.at)}</p>
        </>)}
      </section>
    </div>
  );
}

function Analytics({ history }) {
  const s = useMemo(() => {
    const c = { valid: 0, duplicate: 0, not_found: 0, error: 0 };
    history.forEach((h) => c[h.status]++);
    const total = history.length;
    const unique = new Set(history.filter((h) => h.status === "valid" || h.status === "duplicate").map((h) => h.registration)).size;
    const now = new Date(); now.setMinutes(0, 0, 0);
    const hours = Array.from({ length: 12 }, (_, i) => { const d = new Date(now.getTime() - (11 - i) * 3600000); return { d, n: 0 }; });
    history.forEach((h) => { if (h.status !== "valid") return; const t = new Date(h.at).getTime();
      const b = hours.find((x) => t >= x.d.getTime() && t < x.d.getTime() + 3600000); if (b) b.n++; });
    return { c, total, unique, hours, max: Math.max(1, ...hours.map((x) => x.n)) };
  }, [history]);
  const pct = (n) => (s.total ? Math.round((n / s.total) * 100) : 0);
  return (
    <div>
      <div className="grid four">
        <div className="panel stat"><span>Checked in</span><b>{s.c.valid}</b></div>
        <div className="panel stat"><span>Unique tickets</span><b>{s.unique}</b></div>
        <div className="panel stat"><span>Rejected scans</span><b>{s.c.duplicate + s.c.not_found}</b></div>
        <div className="panel stat"><span>Acceptance rate</span><b>{pct(s.c.valid)}%</b></div>
      </div>
      <div className="grid two">
        <section className="panel"><h2>Check-ins per hour</h2>
          <div className="bars" role="img" aria-label="Check-ins in the last 12 hours">
            {s.hours.map((h, i) => (<div key={i} className="bar"><i style={{ height: `${(h.n / s.max) * 100}%` }} title={`${h.n}`} />
              <small>{h.d.getHours()}h</small></div>))}
          </div></section>
        <section className="panel"><h2>Outcome mix</h2>
          {Object.keys(LABEL).map((k) => (<div key={k} className="mix"><span>{LABEL[k]} ({s.c[k]})</span>
            <div className="track"><i className={k} style={{ width: `${pct(s.c[k])}%` }} /></div></div>))}
          {!s.total && <p className="muted">No scans yet. Validate a ticket to see analytics.</p>}
        </section>
      </div>
    </div>
  );
}

function History({ history, clear }) {
  const [f, setF] = useState("all"); const [q, setQ] = useState("");
  const rows = history.filter((h) => (f === "all" || h.status === f) && h.registration.toLowerCase().includes(q.toLowerCase()));
  return (
    <section className="panel">
      <div className="row"><h2>Validation history</h2>
        <button className="ghost" disabled={!history.length} onClick={() => confirm("Clear all local history?") && clear()}>Clear history</button></div>
      <div className="filters">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search registration number" aria-label="Search" />
        <select value={f} onChange={(e) => setF(e.target.value)} aria-label="Filter by outcome">
          <option value="all">All outcomes</option>{Object.keys(LABEL).map((k) => <option key={k} value={k}>{LABEL[k]}</option>)}</select>
      </div>
      {rows.length ? (<div className="scroll"><table><thead><tr><th>Time</th><th>Registration</th><th>Outcome</th><th>Detail</th></tr></thead>
        <tbody>{rows.map((h) => (<tr key={h.id}><td>{fmt(h.at)}</td><td>{h.registration}</td><td><Badge status={h.status} /></td><td>{h.message}</td></tr>))}</tbody></table></div>)
        : <p className="muted">No matching scans.</p>}
    </section>
  );
}

export default function App() {
  const [tab, setTab] = useState("validate");
  const [history, add, clear] = useHistory();
  const tabs = [["validate", "Validate"], ["analytics", "Analytics"], ["history", "History"]];
  return (
    <div className="app">
      <header><h1>Ticket validator</h1>
        <nav>{tabs.map(([k, l]) => (<button key={k} className={tab === k ? "active" : ""} onClick={() => setTab(k)}>{l}</button>))}</nav></header>
      <main>
        {tab === "validate" && <Validate add={add} history={history} />}
        {tab === "analytics" && <Analytics history={history} />}
        {tab === "history" && <History history={history} clear={clear} />}
      </main>
    </div>
  );
}
