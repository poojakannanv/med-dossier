# MedDossier: 30-Day MERN Project Roadmap

**Project Name:** MedDossier (working title)
**Tagline:** A Regulatory Submission Management Platform for Pharmaceutical Companies
**Stack:** MongoDB, Express.js, React, Node.js (MERN)
**Goal:** Build, ship, and commit daily for 30 days to GitHub, producing a portfolio-grade project that combines your pharma regulatory expertise with full-stack engineering.
**Start Date:** 2026-05-14
**End Date:** 2026-06-12

---

## Why This Project

Most developers applying for UK jobs build yet another to-do app, e-commerce clone, or weather widget. You can build something that solves a real, specific, painful problem in a regulated industry that very few engineers understand. UK pharma hubs (Cambridge, Oxford, London, Stevenage) actively hire developers who can speak the language of regulated industries, and ICH CTD guidelines are a publicly published international standard that any developer can build tooling against. This project signals both technical skill and rare domain fluency, entirely from public industry knowledge.

## Important Boundary: This Is a Personal Project

Everything in MedDossier is built from publicly available sources only. No employer details, internal documents, SOPs, templates, house styles, or proprietary data of any kind are used. Public sources to draw on include the official ICH website (ich.org) for CTD format guidance, the MHRA, EMA, and FDA public guidance documents, public regulatory textbooks and courses, and your own original design choices. If you ever find yourself about to copy a format or process from your day job, stop and either find a public equivalent or invent your own.

## The Real Problem You Are Solving

Regulatory affairs teams in pharma juggle dozens of drug product dossiers, each containing 50+ CTD module documents at various draft, review, approved, and submitted states. They track this today in Excel spreadsheets, shared drives, and email chains. Deadlines slip, version control breaks, audit trails are weak, and submissions get rejected for trivial reasons. MedDossier replaces that mess with a structured web platform.

## Prior Art and Inspiration

This space is well established commercially and almost untouched in open source, which is exactly why a clean educational implementation is worth building.

**Commercial landscape (the enterprise market, for context only):**
- Veeva Vault RIM is the dominant cloud-native Regulatory Information Management platform, used to manage over 70,000 submissions and 100,000 product registrations across global pharma.
- LORENZ docuBridge is a long-running eCTD publishing and submission management platform, strong in EU and EMA contexts.
- Ennov offers a modular regulatory suite positioned as a more accessible alternative to Veeva and ArisGlobal.
- IQVIA RIM Smart, ArisGlobal LifeSphere, and DXC TotalReg cover the rest of the large-enterprise market.
- Newer SaaS-native entrants targeting smaller biotech include Kivo, RegDesk, and Rimsys.
- The current frontier in 2026 is AI assistance: Veeva launched AI Agents in 2025 to 2026 for document summarisation, compliance checks, and Health Authority Question drafting. eCTD v4.0 is being mandated in new regions (India CDSCO, Brazil ANVISA) during 2026.

**Open source landscape (close to empty):**
- eCTD.is Indexer (GPL v3, C#) generates the XML backbones (`eu-regional.xml`, `index.xml`) required for actual eCTD submissions. Narrow scope, not a full tracker.
- R Consortium Submissions Working Group has open-source R demos (`esubdemo`, `ectddemo`) for clinical study report submissions using R.
- pkglite (R, CRAN and GitHub) converts R packages into eCTD-compatible text formats.
- PHUSE publishes working papers on open-source approaches to regulatory submissions.

**The gap MedDossier fills:** there is no open-source MERN or JavaScript-based RIM tracker, so this project is genuinely novel as a learning resource and portfolio piece. Position it honestly in your README: inspired by the workflows of Veeva Vault RIM, LORENZ docuBridge, and Ennov, built entirely from the publicly published ICH CTD format, intended as an educational and portfolio project, not a commercial replacement.

## Core Features (End State after Day 30)

1. User accounts with role-based access: Regulatory Affairs, QA, Manufacturing, Admin
2. Drug product master records (name, dosage form, strength, manufacturer, MAH)
3. Submission dossiers linked to drug products, with target regulatory authority (MHRA, EMA, FDA)
4. CTD module tracking (3.2.P.1, P.2, P.3.1 through P.3.5, P.4, P.5, P.7, P.8) with status workflow
5. Document upload, version history, and approval signoffs
6. Deadline tracking with email reminders
7. Dashboard with submission progress charts and team workload
8. Audit log of every change
9. Search across products, submissions, and documents
10. Export submission summary as PDF

---

## Daily Commit Strategy

**One meaningful commit per day, minimum.** Each day's task is scoped so you finish in 1 to 2 hours. If you have more time, push further into the next day. If you have less time, just do the commit message, README update, or one small refactor so the streak continues. Your GitHub contribution graph is a hiring signal, treat it as such.

**Commit message format:**
```
feat: add JWT auth middleware
fix: correct pagination off-by-one on submissions list
docs: update README with API examples
test: add unit tests for submission model
refactor: extract validation helpers
```

---

## Week 1: Foundation and Authentication (Days 1 to 7)

### Day 1 (Wed, 14 May 2026): Project Kickoff
- Create a private GitHub repo called `meddossier`
- Initialise with a strong README (project description, tech stack, problem statement, screenshots placeholder)
- Add a `.gitignore` for Node, environment files, IDE folders
- Draw a simple architecture diagram (use Excalidraw or draw.io) and commit the PNG
- **Deliverable:** Repo exists, README v1, architecture diagram

### Day 2: Backend Scaffolding
- Initialise Node project: `npm init -y`
- Install dependencies: `express`, `mongoose`, `dotenv`, `cors`, `helmet`, `morgan`, `nodemon` (dev)
- Set up folder structure: `src/config`, `src/models`, `src/routes`, `src/controllers`, `src/middleware`
- Connect to MongoDB Atlas (free tier) using Mongoose
- Create a health-check endpoint at `GET /api/health`
- **Deliverable:** Server runs on localhost, responds to /api/health

### Day 3: User Model and Registration
- Create `User` model: name, email, password (hashed), role enum, createdAt
- Install `bcryptjs` for password hashing
- Build `POST /api/auth/register` endpoint with input validation (express-validator)
- Write Postman or Thunder Client tests for the endpoint
- **Deliverable:** New users can register, passwords are hashed

### Day 4: Login and JWT
- Install `jsonwebtoken`
- Build `POST /api/auth/login` endpoint returning a JWT
- Build `verifyToken` middleware
- Build `requireRole(role)` middleware for role-based access
- **Deliverable:** Users can log in, protected routes work

### Day 5: Frontend Scaffolding
- Initialise React app with Vite: `npm create vite@latest meddossier-client -- --template react`
- Install Tailwind CSS, React Router DOM, Axios
- Set up the basic layout: header, sidebar, main content area
- Create page placeholders: Login, Register, Dashboard, Products, Submissions
- **Deliverable:** Frontend runs, navigation works between empty pages

### Day 6: Auth UI
- Build Login and Register forms with form validation
- Hook them up to the backend auth endpoints
- Store JWT in `localStorage` and Axios default headers
- Build `AuthContext` for global auth state
- **Deliverable:** Users can register and log in from the UI

### Day 7: Protected Routes and Layout Polish
- Build a `PrivateRoute` wrapper that redirects to `/login` if no token
- Add logout button in header
- Build a basic user profile dropdown
- Polish layout responsiveness
- **End of Week 1 retro:** push tag `v0.1-auth`

---

## Week 2: Drug Products Module (Days 8 to 14)

### Day 8: Drug Product Model
- Create `Product` Mongoose model with fields: productName, activeIngredient, dosageForm, strength, manufacturer, mah, atcCode, createdBy, createdAt, updatedAt
- Add validation rules and indexes on productName
- **Deliverable:** Product schema ready

### Day 9: Product CRUD API
- Build endpoints: `GET /api/products`, `GET /api/products/:id`, `POST /api/products`, `PUT /api/products/:id`, `DELETE /api/products/:id`
- Add role guards: only Regulatory and Admin can create or edit
- **Deliverable:** Full CRUD works in Postman

### Day 10: Products List Page
- Build the Products list page in React, fetching from `/api/products`
- Display in a table: name, dosage form, strength, manufacturer, actions
- Add a loading state and empty state
- **Deliverable:** Products list renders real data

### Day 11: Product Create and Edit Form
- Build a reusable `ProductForm` component
- Wire up Create New Product modal or page
- Wire up Edit Product flow (pre-filled with existing data)
- Add success and error toast notifications (react-hot-toast)
- **Deliverable:** Users can add and edit products through the UI

### Day 12: Product Detail Page
- Build a Product detail page showing all fields
- Add a Delete button with confirmation modal
- Link from list page to detail page
- **Deliverable:** Click a row, see full product details

### Day 13: Search, Filter, and Pagination
- Add backend support for search by product name and filter by dosage form
- Add pagination: `?page=1&limit=20`
- Add a search bar and filter dropdown on the frontend
- **Deliverable:** You can find a product in under 5 seconds

### Day 14: Backend Tests for Products
- Install Jest and Supertest
- Write tests for product CRUD endpoints (happy path and auth failures)
- Set up a test database connection
- **End of Week 2 retro:** push tag `v0.2-products`

---

## Week 3: Submissions and Documents (Days 15 to 21)

### Day 15: Submission Model
- Create `Submission` model: linked productId, regulatoryAuthority (MHRA, EMA, FDA, other), submissionType (new, variation, renewal), targetDate, status (draft, in-review, submitted, approved, rejected), createdBy
- Create nested `Module` schema for CTD modules with their own status
- **Deliverable:** Submission schema ready

### Day 16: Submission CRUD API
- Build endpoints for submissions
- When a submission is created, auto-populate the CTD module list (3.2.P.1, P.2, P.3.1-P.3.5, P.4, P.5, P.7, P.8) each at status "not started"
- **Deliverable:** Creating a submission auto-creates the module checklist

### Day 17: Submissions List Page
- Build the Submissions list in React
- Show product name, authority, type, target date, overall progress percentage, status badge
- **Deliverable:** All submissions visible in one place

### Day 18: Submission Detail Page
- Build the Submission detail page with the CTD module checklist
- Each module shows status, owner, last updated
- Allow status changes inline (dropdown)
- **Deliverable:** Click a submission, see all its modules and their state

### Day 19: Document Uploads
- Install `multer` for file uploads (start with local disk, plan to move to S3 or Cloudinary later)
- Add document upload to each module
- Store filename, original name, size, uploadedBy, uploadedAt
- Build a download endpoint
- **Deliverable:** Upload a 3.2.P.1 docx to a module, download it back

### Day 20: Document Version History
- When a new document is uploaded to a module, keep the old one as version 1, new one as version 2
- Build a version history view per module
- Add ability to mark a version as "current"
- **Deliverable:** Version control works for module documents

### Day 21: Audit Trail
- Create an `AuditLog` model: entityType, entityId, action, userId, timestamp, changes (before/after)
- Add middleware that logs every create, update, delete
- Build an audit log viewer page (admin only)
- **End of Week 3 retro:** push tag `v0.3-submissions`

---

## Week 4: Dashboard, Notifications, Polish (Days 22 to 28)

### Day 22: Dashboard Page
- Install Recharts
- Build dashboard with: total products, active submissions, submissions by status (pie chart), submissions by month (bar chart), upcoming deadlines (list)
- **Deliverable:** Dashboard tells you the state of the world at a glance

### Day 23: Email Notifications Setup
- Install Nodemailer, sign up for a free SMTP provider (Mailtrap or Brevo free tier)
- Send a welcome email on user registration
- Send a notification when a user is assigned to a module
- **Deliverable:** Emails actually arrive

### Day 24: Deadline Reminders
- Build a daily cron job (node-cron) that runs at 8am
- For every submission with a target date within 7 days, email all team members assigned
- **Deliverable:** Reminders work without anyone triggering them

### Day 25: User Management (Admin)
- Build admin-only user management page
- List all users, create new user, change role, deactivate user
- **Deliverable:** Admins can manage their team

### Day 26: Activity Feed
- Build an activity feed component showing recent audit log entries
- Add it to the dashboard and to each product and submission page
- **Deliverable:** You can see what changed and when at a glance

### Day 27: PDF Export
- Install `pdfkit` or use a headless browser approach (Puppeteer)
- Build endpoint `GET /api/submissions/:id/export` that returns a PDF summary of a submission
- **Deliverable:** Download a submission report as PDF

### Day 28: Global Search
- Build a global search bar in the header
- Search across products, submissions, and document filenames
- Show results grouped by type
- **End of Week 4 retro:** push tag `v0.4-dashboard`

---

## Week 5: Ship It (Days 29 to 30)

### Day 29: UI Polish, Responsive Design, Error Handling
- Pass through every page on mobile and tablet sizes
- Add proper loading skeletons everywhere
- Add a global error boundary
- Improve empty states with helpful copy
- Final accessibility check (keyboard nav, alt text, contrast)

### Day 30: Deployment and Launch
- Deploy backend to Render or Railway (free tier)
- Deploy frontend to Vercel or Netlify
- Set environment variables on both
- Update README with: live demo link, screenshots, setup instructions, tech stack section, what you learned section
- Record a 90 second demo video, upload to YouTube unlisted, link from README
- Push final tag `v1.0`
- Share on LinkedIn with a post about what you built and why

---

## Optional Days 31 to 35: AI Module Extension

This is the strongest single addition you can make for the 2026 UK job market. AI is the current frontier in regulatory tech (Veeva launched AI Agents during 2025 to 2026), so shipping even a basic AI feature puts your portfolio on-trend.

**What you are building:** an AI-assisted module reviewer. A user uploads a draft CTD module document. The AI reads it, identifies which sections of the publicly-published ICH M4Q template are present and which are missing, summarises the document, and flags obvious gaps. All against the public ICH M4Q checklist, no employer-specific rules.

### Day 31: AI Backend Plumbing
- Pick an API: Anthropic Claude (recommended for long documents and structured output), OpenAI, or Google Gemini. Each has a free tier or low-cost developer plan.
- Add a new backend service `src/services/aiService.js` with a single function that takes text and a prompt, returns the model response.
- Add the API key to `.env`, never commit it.
- **Deliverable:** Test endpoint `POST /api/ai/ping` that returns a model-generated hello world.

### Day 32: Document Text Extraction
- Install `mammoth` for .docx text extraction and `pdf-parse` for PDFs.
- Build endpoint `POST /api/ai/extract-text` that takes an uploaded file and returns the cleaned plain text.
- Handle errors gracefully (corrupt file, unsupported format).
- **Deliverable:** Upload a docx, get plain text back.

### Day 33: ICH M4Q Section Detection
- Build a structured prompt that asks the model: given this module text, which sections of the public ICH M4Q outline (e.g. for P.1: Composition, Description, Pharmaceutical Development context) are present, and which are missing?
- Use structured output (JSON mode) so you get back a clean list of `{section, present, evidence_quote}` rather than free prose.
- Build endpoint `POST /api/ai/analyse-module`.
- **Deliverable:** Upload a draft module, get back a structured presence checklist.

### Day 34: AI Review UI
- On the Module detail page, add an "AI Review" button next to each uploaded document.
- On click, call the analyse endpoint, show a loading spinner, then render the checklist with green ticks and red crosses, and quoted evidence under each present section.
- Add a "Run Again" button so users can re-analyse after edits.
- **Deliverable:** End to end AI review works in the browser.

### Day 35: AI Summary and Gap Flags
- Add a second AI feature: a one-paragraph plain-English summary of the document, plus three to five "gap flags" (things that look weak or missing from the public ICH M4Q perspective).
- Store the analysis result in MongoDB so you do not re-run on every page load.
- Add a disclaimer to the UI: "AI assistance is for guidance only, not a substitute for human regulatory review."
- Push tag `v1.1-ai`.
- **Deliverable:** A feature that genuinely demonstrates LLM integration, structured output, file processing, and pharma context all in one click.

**Why this is worth doing:** the phrase "I shipped a working LLM-powered feature against ICH M4Q on a MERN stack" answers four interview questions at once (full-stack, AI integration, domain knowledge, judgment about disclaimers and limitations).

---

## After Day 35 (or 30): Further Streak Extensions

If you want to keep going, here are real next features any pharma client would actually want, framed as public-domain engineering work:
- Multi-tenancy so multiple organisations can use the same instance
- Migration to TypeScript end-to-end
- Move to React Query (or TanStack Query) for server state
- Add real-time updates with Socket.io (collaborative editing of module status)
- Move file storage to AWS S3
- Add SSO (Microsoft Entra) since regulated industries use M365 widely
- Build a Chrome extension that drops files into MedDossier from any web page
- Vector-embed uploaded documents and build a semantic search across an entire dossier
- Build a small RAG agent that answers questions like "where in this submission do we describe the manufacturing flow?" with citations

---

## What to Put on Your CV After This

> Built MedDossier, a full-stack MERN regulatory submission management platform for pharmaceutical companies, with JWT auth, role-based access, CTD module tracking, document versioning, audit logs, automated email reminders, and PDF export. Designed against the publicly published ICH CTD format. Deployed on Render and Vercel.

Describe the project on its own merits. Your employment history is a separate section on the CV and speaks for itself. Keep the personal project pitch standalone so there is never any question of mixing the two.

---

## Daily Habit Checklist

- [ ] Open the repo
- [ ] Pull latest
- [ ] Do today's task
- [ ] Commit with a meaningful message
- [ ] Push to GitHub
- [ ] Tick this checklist
- [ ] Tomorrow's task: read it now so your subconscious can work on it overnight

---

*This roadmap is a living document. If a day's task feels too small, push further. If it feels too big, break it into the next day. The streak matters more than perfection.*
