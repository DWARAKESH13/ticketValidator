<<<<<<< HEAD
# Ticket QR Validator

React (Vite) web app for validating event tickets by QR code at the venue, with attendance analytics and a scan history.

## 1. Architecture
```
src/
  main.jsx      entry point
  App.jsx       tab shell + 3 screens (Validate, Analytics, History) + localStorage history hook
  Scanner.jsx   camera QR reader (html5-qrcode), 3s de-bounce for repeated frames
  api.js        payload parsing + validate API call + outcome classification
  styles.css    theme tokens (#9C5FFF #0A0A0B #1A1724 #F0F0F0 #C084FC #321064)
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

## 3. Setup & Run
Requires Node 18+.
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
npm run preview
```
If the browser blocks calls with a CORS error in development, run with the proxy: `echo "VITE_API_BASE=/api/transit-zero" > .env && npm run dev`. For production, the API must allow your origin or be reverse-proxied. Camera access needs HTTPS or localhost.

## 4. Git
Branch: `feature/ticket-qr-validator`. Remote: add yours with `git remote add origin <url> && git push -u origin feature/ticket-qr-validator`.
=======
# ticketValidator
>>>>>>> f6d6310213b014dcfd2cfe6957cd092ee4bc6197
