import { useMemo } from "react";
import { LABEL } from "../constants.js";

export default function Analytics({ history }) {
  const s = useMemo(() => {
    const c = { valid: 0, duplicate: 0, not_found: 0, error: 0 };
    history.forEach((h) => c[h.status]++);

    const total = history.length;
    const unique = new Set(
      history
        .filter((h) => h.status === "valid" || h.status === "duplicate")
        .map((h) => h.registration)
    ).size;

    const now = new Date();
    now.setMinutes(0, 0, 0);
    const hours = Array.from({ length: 12 }, (_, i) => ({
      d: new Date(now.getTime() - (11 - i) * 3600000),
      n: 0,
    }));

    history.forEach((h) => {
      if (h.status !== "valid") return;
      const t = new Date(h.at).getTime();
      const bucket = hours.find((x) => t >= x.d.getTime() && t < x.d.getTime() + 3600000);
      if (bucket) bucket.n++;
    });

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
        <section className="panel">
          <h2>Check-ins per hour</h2>
          <div className="bars" role="img" aria-label="Check-ins in the last 12 hours">
            {s.hours.map((h, i) => (
              <div key={i} className="bar">
                <i style={{ height: `${(h.n / s.max) * 100}%` }} title={`${h.n}`} />
                <small>{h.d.getHours()}h</small>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>Outcome mix</h2>
          {Object.keys(LABEL).map((k) => (
            <div key={k} className="mix">
              <span>{LABEL[k]} ({s.c[k]})</span>
              <div className="track">
                <i className={k} style={{ width: `${pct(s.c[k])}%` }} />
              </div>
            </div>
          ))}
          {!s.total && <p className="muted">No scans yet. Validate a ticket to see analytics.</p>}
        </section>
      </div>
    </div>
  );
}