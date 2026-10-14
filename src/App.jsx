import { useState } from "react";
import useHistory from "./hooks/useHistory.js";
import Validate from "./screens/Validate.jsx";
import Analytics from "./screens/Analytics.jsx";
import History from "./screens/History.jsx";

const TABS = [
  ["validate", "Validate"],
  ["analytics", "Analytics"],
  ["history", "History"],
];

export default function App() {
  const [tab, setTab] = useState("validate");
  const [history, add, clear] = useHistory();

  return (
    <div className="app">
      <header>
        <h1>Ticket validator</h1>
        <nav>
          {TABS.map(([key, label]) => (
            <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>
              {label}
            </button>
          ))}
        </nav>
      </header>

      <main>
        {tab === "validate" && <Validate add={add} history={history} />}
        {tab === "analytics" && <Analytics history={history} />}
        {tab === "history" && <History history={history} clear={clear} />}
      </main>
    </div>
  );
}