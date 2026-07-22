# MedDossier

MERN app for managing personal medical records: uploads, structured dossiers, sharing via email. Flagship full-stack portfolio project. Built entirely from public industry knowledge; contains no employer data.

## Structure

Monorepo with two packages, no root package.json:

- `client/` - React + Vite SPA (`npm run dev` = vite)
- `server/` - Node/Express + MongoDB (`npm run dev` = nodemon, `npm test` = jest)

Run both in separate terminals. See `SETUP.md` for full setup (MongoDB connection etc.) and `ROADMAP.md` / `WALKTHROUGH.md` for feature plan and tour.

## Environment (gitignored, copied between machines manually)

Server: `MONGO_URI`, `PORT`, `NODE_ENV`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_URL`, `UPLOAD_DIR`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`.
Client: `VITE_API_URL`.
Never commit values.

## Conventions

- Conventional commit messages (`feat:`, `fix:`, `docs:`).
- Git author: Pooja Kannan <poojakannanv98@gmail.com>.

## Two-laptop workflow

Repo lives on a work laptop (feature work and commits) and a personal laptop (running and testing). GitHub is the sync point. Always `git pull` before editing and `git push` at the end of every session, even WIP. After pulling a commit that touched either package.json, run `npm install` in that package.
