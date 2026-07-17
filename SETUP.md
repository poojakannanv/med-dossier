# MedDossier Setup Guide

Exact steps to run MedDossier locally, run the tests, and deploy to free hosting.

## Prerequisites

- Node.js 18 or later (`node -v`)
- npm 9 or later
- A free MongoDB Atlas account
- Optionally, a free Mailtrap or Brevo account for email

---

## 1. MongoDB Atlas (free tier)

1. Go to https://www.mongodb.com/cloud/atlas and create a free account.
2. Create a new project (e.g. `meddossier`) and click **Build a Database**.
3. Choose the **M0 Free** tier, pick a region close to you (e.g. `eu-west-2` London), and create the cluster.
4. Under **Database Access**, create a database user with a username and a strong password. Give it the **Read and write to any database** role.
5. Under **Network Access**, click **Add IP Address**. For local development you can use **Allow access from anywhere** (`0.0.0.0/0`). Tighten this later for production.
6. Click **Connect** on the cluster, choose **Drivers**, and copy the connection string. It looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
7. Insert your username and password, and add a database name (`meddossier`) before the query string:
   ```
   mongodb+srv://myuser:mypass@cluster0.xxxxx.mongodb.net/meddossier?retryWrites=true&w=majority
   ```

## 2. Backend environment

```bash
cd server
npm install
```

Create your `.env` from the template:

```bash
cp .env.example .env    # on Windows: copy .env.example .env
```

Fill in the values:

| Variable | Value |
|---|---|
| `PORT` | `5000` |
| `NODE_ENV` | `development` |
| `MONGO_URI` | your Atlas connection string from step 1 |
| `JWT_SECRET` | any long random string (e.g. run `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`) |
| `JWT_EXPIRES_IN` | `7d` |
| `CLIENT_URL` | `http://localhost:5173` |
| `UPLOAD_DIR` | `uploads` |
| `SMTP_*` and `EMAIL_FROM` | see step 3, or leave blank to disable email |

## 3. SMTP for emails (optional)

Email is optional. If `SMTP_HOST` is blank, the app runs normally and simply logs skipped emails.

### Option A: Mailtrap (test inbox, nothing is really delivered)

1. Sign up at https://mailtrap.io (free plan).
2. Open **Email Testing**, then your inbox, then **SMTP Settings** and select **Node.js / Nodemailer**.
3. Copy the values into `.env`:
   ```
   SMTP_HOST=sandbox.smtp.mailtrap.io
   SMTP_PORT=587
   SMTP_USER=<your mailtrap user>
   SMTP_PASS=<your mailtrap pass>
   EMAIL_FROM="MedDossier <no-reply@meddossier.local>"
   ```

### Option B: Brevo (real delivery, free tier)

1. Sign up at https://www.brevo.com (free plan includes daily email allowance).
2. Go to **SMTP and API**, then **SMTP**, and generate an SMTP key.
3. Copy the values into `.env`:
   ```
   SMTP_HOST=smtp-relay.brevo.com
   SMTP_PORT=587
   SMTP_USER=<your brevo login email>
   SMTP_PASS=<your smtp key>
   EMAIL_FROM="MedDossier <a-verified-sender@yourdomain.com>"
   ```

## 4. Run the backend

```bash
cd server
npm run dev
```

You should see `MongoDB connected` and `MedDossier API listening on port 5000`. Verify with:

```bash
curl http://localhost:5000/api/health
```

## 5. Run the frontend

```bash
cd client
npm install
npm run dev
```

Open http://localhost:5173. The client reads `VITE_API_URL` from `client/.env` (copy `client/.env.example` if you need to point at a different API URL; the default `http://localhost:5000/api` works out of the box).

## 6. First user

1. Open http://localhost:5173/register.
2. Create an account and choose the **Administrator** role so you can see the audit log and user management pages.
3. Add a product, then create a submission for it. The CTD module checklist is created automatically.

## 7. Run the tests

Backend tests use an in-memory MongoDB (mongodb-memory-server), so no database or `.env` is needed:

```bash
cd server
npm test
```

The first run downloads a MongoDB binary, which can take a minute.

---

## 8. Deploying

### Backend on Render (free tier)

1. Push the repo to GitHub.
2. On https://render.com create a **New Web Service** and connect the repo.
3. Settings:
   - Root directory: `server`
   - Build command: `npm install`
   - Start command: `npm start`
4. Add environment variables (same names as `.env`): `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_URL` (your Vercel URL once you have it), `UPLOAD_DIR`, and the SMTP values if you use email.
5. Note two free-tier limitations:
   - The instance sleeps after inactivity, so the first request after a while is slow and the 8am cron may not fire while asleep.
   - The local disk is ephemeral, so uploaded files do not survive restarts. For a permanent demo, move storage to S3 or Cloudinary (listed as a future extension).

### Frontend on Vercel

1. On https://vercel.com import the same GitHub repo.
2. Settings:
   - Root directory: `client`
   - Framework preset: Vite
   - Build command: `npm run build`
   - Output directory: `dist`
3. Add environment variable `VITE_API_URL` set to your Render URL plus `/api`, e.g. `https://meddossier-api.onrender.com/api`.
4. Because this is a single page app, add a rewrite so deep links work. Create `client/vercel.json`:
   ```json
   { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
   ```
5. Finally, set `CLIENT_URL` on Render to your Vercel URL so CORS allows the deployed frontend.

### Post-deploy checklist

- [ ] `GET https://<render-url>/api/health` returns `{"status":"ok"}`
- [ ] Register and log in from the deployed frontend
- [ ] Create a product and a submission
- [ ] Export a submission PDF
- [ ] Check the audit log as an admin
