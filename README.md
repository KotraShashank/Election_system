# ElectSys — Election Management System

ElectSys is a React, Express, and MongoDB portfolio app for constituency elections. Voters register, view relevant elections, vote once while an election is active, and view results after it ends. Admins manage elections and voter profiles.

## Stack and layout

- Frontend: React 19, Vite, React Router, Axios, Lucide icons
- Backend: Node.js, Express, Mongoose, MongoDB
- Authentication: JWT in an HttpOnly cookie, bcrypt password hashes
- Tests: Jest, Supertest, isolated MongoDB Memory Server

`app.js` configures and starts the API. `middlewares/` handles auth, roles, validation, and errors. `models/userModel/` and `models/electionModel/` hold schemas, routes, and controllers. `utils/` contains normalization and election-time helpers. `frontend/src/` contains the React pages, components, context and API client. `tests/` contains backend integration tests.

## Authentication, RBAC and voting

Public registration always creates a voter. Voter IDs are trimmed and uppercased. Passwords are hashed with bcrypt, excluded from normal database queries, and never returned in user responses. Login sets an eight-hour JWT cookie with `HttpOnly` and `SameSite=Lax`; production adds `Secure`. The frontend calls `GET /v1/me` on startup and does not trust saved browser role data. The backend reloads the user for each authenticated request.

Admin routes enforce the admin role on the server. Voters see only elections for their own constituency. Admin profile edits allow only name, gender, age, phone and constituency. Role and password changes are not exposed. Users with recorded participation cannot be deleted.

New elections store UTC `startAt` and `endAt`. Admins may edit or delete only upcoming elections without votes. Candidate counts cannot be supplied or changed through management endpoints. Status uses the full datetime. Legacy records with separate date and time fields remain readable using `LEGACY_TIME_OFFSET` (default `+05:30`) to interpret the old wall-clock time. No data is dropped or automatically rewritten. Review the offset if old data was recorded in another timezone.

Voting validates the user, constituency, election window, candidate, and prior participation. A single conditional MongoDB update both increments the candidate and records the voter, preventing two concurrent requests from both succeeding. Voter responses omit participation IDs and hide live vote counts. Voters can see results after an election ends; admins can see them at any time. Ties are reported as ties.

This portfolio app does not provide ballot anonymity or the controls needed for government elections.

## Setup

Use Node.js 20+ and npm. Start MongoDB locally or provide a MongoDB connection string. Tests use their own isolated database.

```bash
cd backend
test -f .env || cp .env.example .env
# Edit .env: set MONGO_URI and a random JWT_SECRET of at least 32 characters
npm install
cd ../frontend && npm install
```

| Variable | Purpose |
| --- | --- |
| `PORT` | API port; defaults to 5678 |
| `MONGO_URI` | MongoDB URL; legacy `MONGOURL` also works |
| `JWT_SECRET` | Signing secret, at least 32 characters |
| `FRONTEND_URL` | Allowed frontend origin(s), comma-separated when needed; development also allows `localhost` and `127.0.0.1` on port 5173 |
| `LEGACY_TIME_OFFSET` | Timezone offset for old election records |
| `ADMIN_FIRST_NAME`, `ADMIN_LAST_NAME`, `ADMIN_VOTER_ID`, `ADMIN_PASSWORD`, `ADMIN_CONSTITUENCY`, `ADMIN_AGE`, `ADMIN_PHONE_NUMBER`, `ADMIN_GENDER` | Initial admin seed values |
| `VITE_API_BASE_URL` | Optional frontend API base, default `/v1` |

Never commit `backend/.env`. Fill in the `ADMIN_*` values and run `npm run seed:admin` from `backend/` once to create the first admin. The seed does nothing if its voter ID exists. Public registration cannot create an admin.

Start the API and frontend in separate terminals:

```bash
cd backend
npm start
```

```bash
cd frontend
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/v1` to the API on port 5678. Production deployment should use a shared origin or configure `FRONTEND_URL`, the frontend API base URL and cookie transport accordingly.

## API summary

All routes are under `/v1`. Errors use `{ "success": false, "message": "..." }` and appropriate HTTP status codes.

| Method | Path | Access |
| --- | --- | --- |
| GET | `/health` | Public |
| POST | `/register`, `/login`, `/logout` | Public |
| GET | `/me` | Authenticated |
| GET | `/users` | Admin |
| PUT, DELETE | `/users/:id` | Admin |
| GET | `/elections`, `/elections/:id` | Authenticated; constituency filtered for voters |
| GET | `/elections/:id/results` | Admin, or voter after election ends |
| POST | `/elections` | Admin |
| PUT, DELETE | `/elections/:id` | Admin |
| POST | `/elections/:id/vote` | Voter |

A vote body is `{ "candidateId": "..." }`. Election creation and update accept `constituency`, ISO `startAt` and `endAt`, and at least two `{ candidateName, party }` entries.

## Verification

```bash
cd backend
npm test
cd ../frontend
npm run build
npm run lint
```

Tests cover registration, hashing, login, RBAC, constituency access, election management, vote validation, and concurrent duplicate vote attempts. The first run may download a MongoDB binary.

## Known limits

- Participation IDs are stored for duplicate prevention, so votes are not anonymous.
- Existing duplicate voter IDs must be resolved before MongoDB can create the unique index. The app does not alter existing records automatically.
- Legacy date/time records require the correct `LEGACY_TIME_OFFSET`.
- Password resets and role changes are not exposed in the UI.

## Publishing this copy

The inherited local Git history included `.env` and `node_modules`. They are ignored and removed from the current Git index, while local files remain available. Before publishing to a new GitHub repository, rotate any credentials that were in the old `.env` and create clean Git history; removing a file in a later commit does not remove it from earlier commits. No push is part of this setup.
