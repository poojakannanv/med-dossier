# MedDossier Walkthrough (Interview Prep Notes)

Study notes for talking through this project in interviews: how it is built, why each decision was made, and where to point in the code.

---

## 1. Architecture overview

```
Browser (React SPA, Vercel)
   |  HTTPS + JSON, JWT in Authorization header
   v
Express API (Node, Render)
   |-- middleware: helmet, cors, morgan, express.json
   |-- routes -> validation chains -> role guards -> controllers
   |-- services: audit, email (nodemailer), cron (node-cron), pdf (pdfkit)
   |-- multer local disk for uploads
   v
MongoDB Atlas (Mongoose ODM)
   collections: users, products, submissions, auditlogs
```

Key files:

- API composition: `server/src/app.js` (middleware and route mounting), `server/src/server.js` (env, DB connect, cron start, listen)
- Frontend composition: `client/src/main.jsx` (providers), `client/src/App.jsx` (routes), `client/src/components/Layout.jsx`

The split between `app.js` and `server.js` matters: tests import `app.js` and run it against an in-memory database with Supertest, without opening a port or connecting to Atlas.

## 2. Key decisions and why

### JWT vs sessions

Decision: stateless JWT in the `Authorization: Bearer` header, stored in localStorage on the client.

- Why: the API and SPA are deployed on different origins (Render and Vercel). Cookie sessions across origins need SameSite and CSRF work, and a server-side session store adds state that free-tier hosting makes painful. JWT keeps the API stateless and horizontally scalable.
- Trade-offs I can discuss: localStorage is readable by JS, so XSS is the main threat (mitigated by React escaping and helmet). Tokens cannot be revoked before expiry; I partially mitigate by re-loading the user from the DB on every request in `verifyToken`, so a deactivated user is rejected immediately even with a valid token.
- Code: `server/src/middleware/auth.js`, `server/src/controllers/authController.js` (signToken), `client/src/api/axios.js` (interceptors), `client/src/context/AuthContext.jsx`.

### Embedded modules vs a separate collection

Decision: CTD modules are an embedded array of subdocuments inside `Submission`, and document versions are embedded inside each module.

- Why: modules are always read with their submission (the detail page needs everything), the count is small and bounded (11 modules), and embedding gives atomic single-document updates (change a status and the parent `updatedAt` in one save, no transactions needed). A separate collection would buy independent querying and unbounded growth, neither of which applies here.
- When I would split them: if documents grew unbounded (hundreds of versions), if modules needed cross-submission queries ("all modules owned by X" at scale), or if concurrent editing of different modules on one submission caused write contention.
- Code: `server/src/models/Submission.js` (moduleSchema, documentVersionSchema, `defaultModules()` static, `progress()` method).

### Auto-populating the CTD checklist

Decision: `Submission.defaultModules()` builds the 3.2.P.1 to 3.2.P.8 list from a constant at create time, rather than referencing a shared template collection.

- Why: the ICH M4Q outline is stable public knowledge; snapshotting it per submission means old submissions keep their checklist shape even if the constant changes later. This mirrors how regulatory dossiers are point-in-time artefacts.
- Code: `server/src/utils/ctdModules.js`, used in `server/src/controllers/submissionController.js` (createSubmission).

### Multer local disk vs S3

Decision: multer disk storage into `server/uploads`, with sanitised, timestamped filenames; the DB stores metadata only.

- Why: zero external dependencies for a portfolio project, and the storage concern is isolated behind one middleware (`server/src/middleware/upload.js`) plus one controller (`server/src/controllers/documentController.js`). Swapping to S3 later means changing the storage engine and the download endpoint only, not the data model.
- Trade-offs: local disk does not scale horizontally and is ephemeral on Render free tier. I gate types via an extension allow-list and cap size at 20 MB.
- Versioning design: uploads append to a `documents` array with an incrementing `version` and an `isCurrent` flag. History is immutable; "current" is just a pointer, so rollback is a flag flip, not a file operation.

### Audit logging: explicit service call vs Mongoose middleware

Decision: an explicit `logAudit()` service function called from controllers, not Mongoose `pre`/`post` hooks.

- Why: hooks do not know *who* made the change (no request context) and struggle with before and after snapshots on updates. In the controller I already have `req.user`, the pre-change document, and the post-change document, so the audit entry is accurate and readable. The cost is a little repetition per controller.
- Fail-soft: `logAudit` catches and logs its own errors so an audit write failure never breaks the user operation. In a real GxP system you might invert this (fail the operation if the audit fails); I can discuss that trade-off.
- Code: `server/src/services/auditService.js`, `server/src/models/AuditLog.js`, called throughout the controllers. Admin viewer: `server/src/controllers/auditController.js` and `client/src/pages/AuditLogPage.jsx`. The same data powers the activity feeds (`client/src/components/ActivityFeed.jsx`).

### Pagination approach

Decision: classic offset pagination with `?page=&limit=`, `countDocuments` for totals, and `skip`/`limit` on the query, capped at 100 per page.

- Why: users need "page 3 of 7" style navigation and totals; offsets are simple and correct at this data scale. Cursor (keyset) pagination is faster for deep pages and stable under inserts, but you lose random page access; I would switch if collections grew to hundreds of thousands of rows.
- Code: `server/src/controllers/productController.js` (listProducts), same pattern in submissions and audit. Client side: `client/src/components/Pagination.jsx`.

### Role-based access control

Decision: a `requireRole(...roles)` middleware factory after `verifyToken`, plus role-aware UI on the client (`canEdit`, `isAdmin` from AuthContext).

- Important point to make in interviews: the client-side checks are UX only; the server enforces every rule again. Hiding a button is not security.
- Code: `server/src/middleware/auth.js`, route wiring in `server/src/routes/*.js`, client flags in `client/src/context/AuthContext.jsx`.

### Email and cron as fail-soft services

Decision: nodemailer wrapped so that missing SMTP config logs and returns instead of throwing; all email sends from controllers are fire-and-forget. The daily 8am node-cron job (`server/src/services/cronService.js`) finds submissions due within 7 days and emails distinct module owners.

- Why: a tracker must never fail a registration because a mail server is down. The reminder logic is exported as `runDeadlineReminders()` separately from the schedule so it is testable and manually triggerable.
- Known limitation: node-cron runs in-process, so on sleeping free-tier hosting the 8am tick may be missed; a hosted scheduler (Render cron job hitting an endpoint) fixes that in production.

### PDF generation with pdfkit vs Puppeteer

Decision: pdfkit streaming directly into the HTTP response.

- Why: pdfkit is a pure JS library with no headless browser, tiny memory footprint, and streaming means no temp files. Puppeteer would give HTML fidelity but is heavy for a tabular summary.
- Code: `server/src/services/pdfService.js`, endpoint in `submissionController.exportSubmissionPdf`, client download via an axios blob in `client/src/pages/SubmissionDetail.jsx`.

## 3. Request lifecycle walkthrough

Worked example: a regulatory user changes module 3.2.P.3.3 to "in-review" on the submission detail page.

1. **Client**: the status `<select>` in `ModuleCard` (`client/src/pages/SubmissionDetail.jsx`) fires `handleStatusChange`, calling `api.patch('/submissions/:id/modules/:moduleId/status', { status })`.
2. **Axios request interceptor** (`client/src/api/axios.js`) attaches `Authorization: Bearer <token>` from localStorage.
3. **Express** (`server/src/app.js`): helmet sets security headers, cors validates the origin against `CLIENT_URL`, `express.json` parses the body, morgan logs the request.
4. **Router** (`server/src/routes/submissionRoutes.js`): `verifyToken` decodes the JWT, loads the user from MongoDB, rejects if missing or deactivated. The express-validator chain checks `status` is one of the allowed enum values; `validate` middleware returns 422 with field errors if not.
5. **Controller** (`submissionController.updateModuleStatus`): loads the submission, finds the embedded module by `_id`, snapshots the before state, mutates status and `updatedAt`, saves the parent document (one atomic write).
6. **Audit**: `logAudit()` writes an entry with before and after and a human-readable summary.
7. **Response**: the controller re-populates the submission and returns it with a computed `progress` percentage.
8. **Client**: `onUpdated` replaces the submission in state, the progress bar re-renders, a toast confirms, and the scoped ActivityFeed refreshes via its `refreshKey` prop.
9. **Errors** at any stage flow to the central handler (`server/src/middleware/errorHandler.js`), which maps Mongoose validation, cast, duplicate-key and multer errors onto sensible status codes; the axios response interceptor logs the user out on 401.

## 4. Testing strategy

- `server/tests/setup.js` boots mongodb-memory-server and offers `registerUser()` to mint real JWTs through the API rather than forging tokens.
- `auth.test.js` covers registration (including hash verification and duplicate email), login (wrong password, unknown email, deactivated user) and `/auth/me` token handling.
- `products.test.js` covers CRUD happy paths, role guards (qa blocked from create, manufacturing blocked from update), validation failures, pagination, search, filter, and the referential-integrity rule that a product with submissions cannot be deleted.
- Why in-memory Mongo instead of mocks: the tests exercise real Mongoose validation, indexes and middleware, so schema bugs surface in tests instead of production.

## 5. Likely interview questions and where to point

| Question | Answer sketch | Code |
|---|---|---|
| Why MongoDB for this domain? | Dossier = naturally hierarchical document; embedded modules match the read pattern; flexible schema for evolving regulatory metadata. Relational would also work; I can sketch the table design. | `server/src/models/Submission.js` |
| How do you stop a QA user creating products? | Server-side `requireRole('regulatory', 'admin')` on the route; UI hides the button too, but that is UX not security. | `server/src/routes/productRoutes.js` |
| What happens if two people edit the same submission? | Last write wins at document level today. Mitigations to discuss: optimistic concurrency with a version key (Mongoose `versionKey` and `save()` conflicts), or field-level `findOneAndUpdate` with `$set`. | `submissionController.js` |
| How does document versioning work? | Append-only versions array, incrementing version number, `isCurrent` flag as a movable pointer, files kept on disk with sanitised unique names. | `documentController.js` |
| How would you scale file storage? | Swap multer disk engine for S3 (multer-s3), store the object key instead of filename, presigned URLs for download; the data model is already storage-agnostic. | `middleware/upload.js` |
| Why is the audit log write fire-and-forget? | User operations must not fail because logging failed; discuss the GxP-flavoured alternative where audit is mandatory and transactional. | `services/auditService.js` |
| How do the charts get their data? | One `/api/dashboard` endpoint runs parallel aggregations (`$group` by status, by year and month) plus an upcoming-deadlines query, so the page is a single round trip. | `dashboardController.js` |
| How does global search work across types? | Case-insensitive escaped regex per type; documents are found by unwinding embedded arrays in an aggregation with a `$lookup` to attach the product name. Would move to Atlas Search or text indexes at scale. | `searchController.js` |
| What is in the JWT and why? | Only `id` and `role` plus expiry; the user is re-fetched on each request so role changes and deactivation take effect immediately. | `middleware/auth.js` |
| How would you add the AI review feature? | Roadmap Days 31 to 35: extract text (mammoth or pdf-parse), structured-output prompt against the public ICH M4Q outline, store results, render a presence checklist. | `ROADMAP.md` |

## 6. Honest limitations (good to volunteer)

- No refresh tokens; a stolen JWT is valid until expiry.
- Offset pagination degrades on very large collections.
- Local disk uploads are ephemeral on free hosting.
- node-cron depends on the dyno being awake.
- No optimistic locking on concurrent submission edits.
- Search is regex-based, not indexed full-text.

Each limitation has a known fix, and being able to name them is more valuable in an interview than pretending they do not exist.
