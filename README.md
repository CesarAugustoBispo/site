# Academic Personal Site

Personal academic website with admin panel for managing content, publications, and sections.

## Stack

- **Backend:** Node.js + Express + EJS (server-side rendering)
- **Admin Panel:** Vanilla HTML/CSS/JS (SPA)
- **Database:** SQLite (via better-sqlite3)
- **Auth:** JWT + bcrypt

## Installation

```bash
npm install
```

## Setup database and seed

```bash
npm run seed
```

## Run in development

```bash
npm run dev
```

## Access

| URL | Description |
|-----|-------------|
| http://localhost:3000 | Public site |
| http://localhost:3000/admin | Admin panel |

**Default login:** `admin@admin.com` / `admin123`

## Project Structure

```
├── server/
│   ├── index.js            # Express entry point
│   ├── config/database.js  # SQLite setup
│   ├── middleware/          # Auth, error handler
│   ├── routes/              # Public & admin routes
│   ├── models/              # Data access layer
│   └── seed.js             # DB seed script
├── public/                  # Static assets (CSS, JS)
├── views/                   # EJS templates (SSR)
├── admin/                   # Admin SPA
├── uploads/                 # Uploaded photos
├── .env                     # Environment config
└── package.json
```
