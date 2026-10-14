# Ticket QR Validator

React (Vite) web app for validating event tickets by QR code at the venue, with attendance analytics and a scan history.

## 1. Architecture
```
ticket-qr-validator/
├── index.html               Vite entry page (loads fonts and /src/main.jsx)
├── vite.config.js           React plugin + dev proxy for /api
├── .env.example             VITE_API_BASE
└── src/
    ├── main.jsx             mounts <App /> and imports styles.css
    ├── App.jsx              tab shell: header, nav, picks the active screen
    ├── api.js               parsePayload() and validateTicket()
    ├── constants.js         LABEL (status names), KEY (storage key), fmt() (date format)
    ├── styles.css           design tokens and all styling
    ├── hooks/
    │   └── useHistory.js    scan history state, synced to localStorage
    ├── components/
    │   ├── Scanner.jsx      camera QR reader (html5-qrcode)
    │   └── Badge.jsx        coloured status pill
    └── screens/
        ├── Validate.jsx     scan, manual entry, result panel
        ├── Analytics.jsx    stat cards, hourly chart, outcome mix
        └── History.jsx      searchable, filterable table of scans
```
- State: React hooks only. `useHistory` keeps every scan record in React state and mirrors it to `localStorage` (key `tqv.history.v1`, capped at 1000).
- Analytics are derived from history (no extra storage): checked-in, unique tickets, rejected scans, acceptance rate, hourly check-ins (last 12h), outcome mix.
- Outcomes: `valid`, `duplicate` (already used), `not_found` (404), `error` (network or non-200/404).

## 2. Backend Integration Flow
1. Scanner (or manual input) yields raw text. `parsePayload` accepts a plain registration number, a JSON object (`registration_number`), or a URL (`.../tickets/{id}/...`).
2. `POST {API_BASE}/tickets/{registration_number}/validate` (no body). Default base: `https://internal.goxploronline.net/api/transit-zero`.
3. Response handling:
   - **200**: ticket object with `is_validated: true`. Because the endpoint is idempotent, a repeat scan returns the original `validated_at`. If that timestamp is more than 15 s older than the request, the scan is classed **duplicate**, otherwise **valid**.
   - **404** `{ "detail": "Ticket not found" }`: classed **not_found**.
   - Other status or network failure: classed **error**.
4. The record is added to history, shown on the Validate screen, and feeds Analytics and History.

Known limits: the duplicate check relies on the server clock being close to the device clock; analytics and history are per-device (localStorage), not server-wide. The API may need CORS enabled for your origin (see dev proxy below).

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


## 3. Setup & Run
Requires Node 18+.
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
npm run preview
```
If the browser blocks calls with a CORS error in development, run with the proxy: `echo "VITE_API_BASE=/api/transit-zero" > .env && npm run dev`. For production, the API must allow your origin or be reverse-proxied. Camera access needs HTTPS or localhost.

## 4. Figma Referene
Figma File for branding Layout Design:
https://www.figma.com/design/H47nI1rGE3PHPBi6eFjUyx/Ticket-QR-Validator?node-id=0-1&t=VJlR8VaJpfoMl55I-1

## 5. Claude Development Chat
Chats Performed on Claude for Development:
https://claude.ai/share/5af6c110-6560-4c0f-820e-25dbf40dfee5





