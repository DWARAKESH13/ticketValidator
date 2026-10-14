const BASE = import.meta.env.VITE_API_BASE || "https://internal.goxploronline.net/api/transit-zero";

export function parsePayload(raw) {
  const text = String(raw || "").trim();
  try {
    const j = JSON.parse(text);
    const v = j.registration_number ?? j.registrationNumber ?? j.reg ?? j.id;
    if (v) return String(v).trim();
  } catch { /* if not the required json */ }
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


//mock ticket body
const MOCK_TICKETS = {
  "TEST-VALID-001": {
    registration_number: "TEST-VALID-001",
    name: "Test Attendee",
    email: "test@example.com",
    ticket_type: "General",
    is_validated: true,
  },
};
const mockValidated = {};

export async function validateTicket(registration) {
  const requestedAt = Date.now();

  const base = { id: `${requestedAt}-${Math.random().toString(36).slice(2, 7)}`, registration, at: new Date(requestedAt).toISOString() };

  //mocking a ticket for testing

  const mock = MOCK_TICKETS[registration];
  if (mock) {
    if (!mockValidated[registration]) mockValidated[registration] = new Date().toISOString();
    const ticket = { ...mock, validated_at: mockValidated[registration] };
    const duplicate = requestedAt - new Date(ticket.validated_at).getTime() > 15000;
    return { ...base, ticket, status: duplicate ? "duplicate" : "valid", message: duplicate ? "Already validated earlier" : "Ticket validated" };
  }



  try {
    const res = await fetch(`${BASE}/tickets/${encodeURIComponent(registration)}/validate`, { method: "POST", headers: { Accept: "application/json" } });

    if (res.status === 404) 
      return { ...base, status: "not_found", message: "Ticket not found" };

    if (!res.ok) 
      return { ...base, status: "error", message: `Server returned ${res.status}` };
    const ticket = await res.json();
    const prior = ticket.validated_at ? new Date(ticket.validated_at).getTime() : requestedAt;
    const duplicate = requestedAt - prior > 15000;

    return { ...base, ticket, status: duplicate ? "duplicate" : "valid", message: duplicate ? "Already validated earlier" : "Ticket validated" };

  } catch {
    return { ...base, status: "error", message: "Network error. Check connection setings." };
  }
}
