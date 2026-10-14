const BASE = import.meta.env.VITE_API_BASE || "https://internal.goxploronline.net/api/transit-zero";

/** Pull a registration number out of a QR payload: JSON, URL, or plain text. */
export function parsePayload(raw) {
  const text = String(raw || "").trim();
  try {
    const j = JSON.parse(text);
    const v = j.registration_number ?? j.registrationNumber ?? j.reg ?? j.id;
    if (v) return String(v).trim();
  } catch { /* not JSON */ }
  try {
    const u = new URL(text);
    const q = u.searchParams.get("registration_number");
    if (q) return q;
    const parts = u.pathname.split("/").filter(Boolean);
    const i = parts.indexOf("tickets");
    return decodeURIComponent(i >= 0 && parts[i + 1] ? parts[i + 1] : parts[parts.length - 1] || text);
  } catch { /* not URL */ }
  return text;
}

/** POST /tickets/{registration_number}/validate. Returns a normalized history record. */
export async function validateTicket(registration) {
  const requestedAt = Date.now();
  const base = { id: `${requestedAt}-${Math.random().toString(36).slice(2, 7)}`, registration, at: new Date(requestedAt).toISOString() };
  try {
    const res = await fetch(`${BASE}/tickets/${encodeURIComponent(registration)}/validate`, { method: "POST", headers: { Accept: "application/json" } });
    if (res.status === 404) return { ...base, status: "not_found", message: "Ticket not found" };
    if (!res.ok) return { ...base, status: "error", message: `Server returned ${res.status}` };
    const ticket = await res.json();
    // The endpoint is idempotent: a repeat scan returns the original validated_at.
    // If it predates this request, the ticket was already used.
    const prior = ticket.validated_at ? new Date(ticket.validated_at).getTime() : requestedAt;
    const duplicate = requestedAt - prior > 15000;
    return { ...base, ticket, status: duplicate ? "duplicate" : "valid", message: duplicate ? "Already validated earlier" : "Ticket validated" };
  } catch {
    return { ...base, status: "error", message: "Network error. Check connection or CORS settings." };
  }
}
