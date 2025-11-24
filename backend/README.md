# Bus Ticketing Backend (Dev)

This is a minimal Node.js + Express backend for development and local testing of the bus-ticketing frontend.

Features
- In-memory users and tickets (no DB)
- JWT authentication
- Endpoints:
  - `POST /api/auth/login` - login with `email` or `username` + `password`. Returns `{ token, user }`.
  - `GET /api/tickets` - list tickets (protected)
  - `POST /api/tickets` - create ticket with `{ email }` (protected)
  - `POST /api/tickets/verify` - verify ticket `{ id }` (protected)
  - `POST /api/tickets/scan` - mark ticket used `{ id }` (protected)

Seeded users
- admin@example.com / AdminPass1 (role: admin)
- user@example.com / UserPass1 (role: user)

Quick start

1. Install dependencies:

```bash
cd backend
npm install
```

2. Create `.env` (optional) by copying `.env.example` and set `JWT_SECRET` if desired.

3. Run in development mode:

```bash
npm run dev
```

4. Test login (curl):

```bash
curl -v -X POST http://localhost:4000/api/auth/login \ 
  -H 'Content-Type: application/json' \ 
  -d '{"email":"user@example.com","password":"UserPass1","role":"user"}'
```

Connecting the frontend
- Frontend expects `http://localhost:4000` as the backend when the `proxy` field in the frontend `package.json` is set to that address. You can also set `REACT_APP_API_BASE` in the frontend to `http://localhost:4000`.

Notes
- This backend is for local development only. Do not use the seeded JWT secret in production.
- Data is stored in memory and will be reset on server restart.
