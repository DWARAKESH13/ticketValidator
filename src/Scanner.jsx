import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

export default function Scanner({ onScan, paused }) {
  const [err, setErr] = useState("");
  const cb = useRef(onScan); cb.current = onScan;
  const pausedRef = useRef(paused); pausedRef.current = paused;
  const last = useRef({ t: "", at: 0 });

  useEffect(() => {
    const s = new Html5Qrcode("qr-reader");
    const started = s.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 240, height: 240 } },
      (text) => {
        const now = Date.now();
        if (pausedRef.current || (text === last.current.t && now - last.current.at < 3000)) return;
        last.current = { t: text, at: now };
        cb.current(text);
      }, () => {}).catch(() => setErr("Camera unavailable. Allow camera access or enter the number manually."));
    return () => { started.then(() => s.stop()).then(() => s.clear()).catch(() => {}); };
  }, []);

  return (<div><div id="qr-reader" className="reader" />{err && <p className="muted">{err}</p>}</div>);
}
