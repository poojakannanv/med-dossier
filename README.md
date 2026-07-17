# MedDossier

**A regulatory submission management platform for pharmaceutical companies, built on the MERN stack.**

MedDossier helps regulatory affairs teams track drug product dossiers, CTD module status, document versions, deadlines and audit trails in one place, replacing the spreadsheets, shared drives and email chains most teams still rely on.

> This is an educational and portfolio project. It is inspired by the workflows of commercial Regulatory Information Management platforms such as Veeva Vault RIM, LORENZ docuBridge and Ennov, and is built entirely from the publicly published ICH CTD format (ich.org). It is not a commercial replacement for any of those systems, and it uses no proprietary data, templates or processes from any employer.

---

## The problem

Regulatory affairs teams in pharma juggle dozens of drug product dossiers. Each dossier contains many CTD module documents at various draft, review, approved and submitted states. Today this is commonly tracked in Excel spreadsheets, shared drives and email chains. The consequences are predictable: deadlines slip, version control breaks, audit trails are weak, and submissions get rejected for trivial administrative reasons.

The enterprise market solves this with platforms like Veeva Vault RIM (used to manage tens of thousands of submissions globally), LORENZ docuBridge and Ennov. The open source landscape is almost empty: there is no open source MERN or JavaScript-based RIM tracker. MedDossier is a clean educational implementation that fills that gap as a learning resource and portfolio piece.

## Features

- **Role-based access control**: Regulatory Affairs, QA, Manufacturing and Admin roles with JWT authentication
- **Drug product master records**: name, active ingredient, dosage form, strength, manufacturer, MAH, ATC code
- **Submission dossiers** linked to products, with target authority (MHRA, EMA, FDA, other), submission type (new, variation, renewal) and target dates
- **CTD module tracking**: every new submission automatically gets the Module 3.2.P checklist (3.2.P.1 through 3.2.P.8) with per-module status workflow and owner assignment
- **Document upload and version history**: each upload becomes a new version, any version can be marked current, all versions downloadable
- **Audit trail**: every create, update, delete and upload is logged with before and after snapshots, viewable by admins and surfaced as activity feeds
- **Dashboard**: totals, submissions by status (pie chart), submissions by month (bar chart), upcoming deadlines
- **Email notifications**: welcome emails, module assignment notifications, and a daily 8am cron job that reminds module owners about submissions due within 7 days
- **Global search** across products, submissions and document filenames, grouped by type
- **PDF export** of any submission summary (product info, submission details, module checklist, progress)
- **Admin user management**: create users, change roles, deactivate accounts

## Tech stack

| Layer | Technology |
|---|---|
| Database | MongoDB (Atlas free tier) with Mongoose |
| API | Node.js, Express, express-validator, helmet, cors, morgan |
| Auth | JWT (jsonwebtoken) with bcryptjs password hashing |
| Files | multer (local disk storage) |
| Email | nodemailer (Mailtrap or Brevo compatible SMTP) |
| Scheduling | node-cron |
| PDF | pdfkit |
| Frontend | React 18 (Vite), React Router v6, Axios, Tailwind CSS v3 |
| Charts | Recharts |
| Notifications | react-hot-toast |
| Testing | Jest, Supertest, mongodb-memory-server |

## Screenshots

*(Screenshots to be added)*

- Dashboard with charts and deadlines: `docs/screenshots/dashboard.png`
- Submission detail with CTD module checklist: `docs/screenshots/submission-detail.png`
- Products list with search and filters: `docs/screenshots/products.png`
- Audit log viewer: `docs/screenshots/audit.png`

## Quick start

Full instructions are in [SETUP.md](SETUP.md). In short:

```bash
# Backend
cd server
npm install
cp .env.example .env   # then fill in MONGO_URI and JWT_SECRET
npm run dev            # starts on http://localhost:5000

# Frontend (new terminal)
cd client
npm install
npm run dev            # starts on http://localhost:5173

# Tests
cd server
npm test
```

## API overview

All routes are prefixed with `/api`. Authenticated routes require an `Authorization: Bearer <token>` header.

| Method | Path | Description | Access |
|---|---|---|---|
| GET | `/health` | Health check | Public |
| POST | `/auth/register` | Register and receive a JWT | Public |
| POST | `/auth/login` | Log in and receive a JWT | Public |
| GET | `/auth/me` | Current user profile | Authenticated |
| GET | `/products` | List products (search, dosageForm filter, page, limit) | Authenticated |
| GET | `/products/:id` | Product detail | Authenticated |
| POST | `/products` | Create product | Regulatory, Admin |
| PUT | `/products/:id` | Update product | Regulatory, Admin |
| DELETE | `/products/:id` | Delete product (blocked if submissions exist) | Regulatory, Admin |
| GET | `/submissions` | List submissions (status filter, pagination) | Authenticated |
| GET | `/submissions/:id` | Submission detail with modules | Authenticated |
| POST | `/submissions` | Create submission (auto-creates CTD checklist) | Regulatory, Admin |
| PUT | `/submissions/:id` | Update submission meta and status | Regulatory, Admin |
| DELETE | `/submissions/:id` | Delete submission | Regulatory, Admin |
| PATCH | `/submissions/:id/modules/:moduleId/status` | Inline module status change | Authenticated |
| PATCH | `/submissions/:id/modules/:moduleId/owner` | Assign module owner (sends email) | Regulatory, Admin |
| POST | `/submissions/:id/modules/:moduleId/documents` | Upload document version | Authenticated |
| GET | `/submissions/:id/modules/:moduleId/documents/:documentId/download` | Download a version | Authenticated |
| PATCH | `/submissions/:id/modules/:moduleId/documents/:documentId/current` | Mark version current | Authenticated |
| GET | `/submissions/:id/export` | PDF summary export | Authenticated |
| GET | `/dashboard` | Dashboard aggregates | Authenticated |
| GET | `/search?q=` | Global search grouped by type | Authenticated |
| GET | `/audit` | Full audit log with pagination | Admin |
| GET | `/audit/recent` | Recent activity feed (optionally scoped) | Authenticated |
| GET | `/users` | List all users | Admin |
| GET | `/users/assignable` | Active users for owner dropdowns | Authenticated |
| POST | `/users` | Create user | Admin |
| PATCH | `/users/:id/role` | Change role | Admin |
| PATCH | `/users/:id/status` | Activate or deactivate | Admin |

## Project structure

```
meddossier/
  server/
    src/
      config/        # database connection
      models/        # User, Product, Submission (with embedded modules), AuditLog
      routes/        # route definitions and validation chains
      controllers/   # request handlers
      middleware/    # auth, validation, upload, error handling
      services/      # audit, email, cron, pdf
      utils/         # CTD module list, async wrapper
    tests/           # Jest + Supertest with in-memory MongoDB
  client/
    src/
      api/           # axios instance with JWT interceptor
      context/       # AuthContext
      components/    # layout, shared UI, forms
      pages/         # one file per route
      utils/         # constants and formatters
```

## What I learned

- **Designing embedded documents vs separate collections**: CTD modules live inside the Submission document because they are always read together, never queried independently at scale, and bounded in number (11 per submission). This gave atomic updates and simpler code than a separate Modules collection.
- **Audit logging as a service, not middleware magic**: an explicit `logAudit()` call from each controller keeps before and after snapshots accurate and makes the audit code easy to reason about, at the cost of a little repetition.
- **File versioning semantics**: modelling versions as an append-only array with an `isCurrent` flag makes both history and rollback trivial, and maps directly onto how regulatory teams think about document lifecycles.
- **Fail-soft integrations**: email and cron are wrapped so that a missing SMTP config or a transient failure never breaks a user-facing request. In regulated environments the tracker must keep working even when peripherals are down.
- **Testing against an in-memory database**: mongodb-memory-server gives fast, isolated integration tests without mocking Mongoose, which caught several validation and role-guard bugs during development.
- **Domain modelling from public standards**: everything here is built from the publicly published ICH M4Q CTD structure, which shows that useful regulated-industry tooling can be built without any proprietary knowledge.

## Roadmap

See [ROADMAP.md](ROADMAP.md) for the full 30-day build plan and the optional AI module review extension (ICH M4Q section detection with an LLM).

## Interview notes

Architecture decisions, request lifecycles and likely interview questions are documented in [WALKTHROUGH.md](WALKTHROUGH.md).

## Licence

MIT. Built by Pooja Kannan as a portfolio project.
