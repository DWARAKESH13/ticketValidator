import { useState } from "react";
import Badge from "../components/Badge.jsx";
import { LABEL, fmt } from "../constants.js";

export default function History({ history, clear }) {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  const rows = history.filter(
    (h) =>
      (filter === "all" || h.status === filter) &&
      h.registration.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <section className="panel">
      <div className="row">
        <h2>Validation history</h2>
        <button
          className="ghost"
          disabled={!history.length}
          onClick={() => confirm("Clear all local history?") && clear()}
        >
          Clear history
        </button>
      </div>

      <div className="filters">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search registration number"
          aria-label="Search"
        />
        <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter by outcome">
          <option value="all">All outcomes</option>
          {Object.keys(LABEL).map((k) => (
            <option key={k} value={k}>{LABEL[k]}</option>
          ))}
        </select>
      </div>

      {rows.length ? (
        <div className="scroll">
          <table>
            <thead>
              <tr><th>Time</th><th>Registration</th><th>Outcome</th><th>Detail</th></tr>
            </thead>
            <tbody>
              {rows.map((h) => (
                <tr key={h.id}>
                  <td>{fmt(h.at)}</td>
                  <td>{h.registration}</td>
                  <td><Badge status={h.status} /></td>
                  <td>{h.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="muted">No matching scans.</p>
      )}
    </section>
  );
}