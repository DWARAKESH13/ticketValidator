import { useState } from "react";
import Scanner from "../components/Scanner.jsx";
import Badge from "../components/Badge.jsx";
import { parsePayload, validateTicket } from "../api.js";
import { fmt } from "../constants.js";

export default function Validate({ add, history }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [manual, setManual] = useState("");
  const [cam, setCam] = useState(true);

  async function run(raw) {
    const reg = parsePayload(raw);
    if (!reg || busy) return;
    setBusy(true);
    try {
      const r = await validateTicket(reg);
      add(r);
      setResult(r);
    } catch {
      const r = {
        id: `${Date.now()}`,
        registration: reg,
        at: new Date().toISOString(),
        status: "error",
        message: "Unexpected error. Try again.",
      };
      add(r);
      setResult(r);
    } finally {
      setBusy(false);
    }
  }

  function submitManual() {
    run(manual);
    setManual("");
  }

  const today = history.filter(
    (h) => new Date(h.at).toDateString() === new Date().toDateString()
  ).length;

  return (
    <div className="grid two">
      <section className="panel">
        <div className="row">
          <h2>Scan ticket</h2>
          <button className="ghost" onClick={() => setCam((c) => !c)}>
            {cam ? "Turn camera off" : "Turn camera on"}
          </button>
        </div>

        {cam ? <Scanner onScan={run} paused={busy} /> : <p className="muted">Camera is off.</p>}

        <div className="manual">
          <input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitManual()}
            placeholder="Registration number"
            aria-label="Registration number"
          />
          <button disabled={busy || !manual.trim()} onClick={submitManual}>
            Validate
          </button>
        </div>
      </section>

      <section className={`panel result ${result?.status || ""}`} aria-live="polite">
        <h2>Result</h2>

        {busy && <p className="muted">Validating…</p>}

        {!busy && !result && (
          <p className="muted">Point the camera at a ticket QR code. {today} scanned today.</p>
        )}

        {!busy && result && (
          <>
            <div className="verdict">
              <Badge status={result.status} />
              <strong>{result.message}</strong>
            </div>
            <p className="reg">{result.registration}</p>

            {result.ticket && (
              <dl className="kv">
                {Object.entries(result.ticket)
                  .filter(([, v]) => v !== null && typeof v !== "object")
                  .map(([k, v]) => (
                    <div key={k}>
                      <dt>{k.replace(/_/g, " ")}</dt>
                      <dd>{String(v)}</dd>
                    </div>
                  ))}
              </dl>
            )}

            <p className="muted">{fmt(result.at)}</p>
          </>
        )}
      </section>
    </div>
  );
}