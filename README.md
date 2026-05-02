# UcheldreRepLinks

A link management and redirect service for Ucheldrerep — **link.ucheldrerep.co.uk**

## Features

- **Redirect** — immediately forwards visitors to a destination URL (302 or 301)
- **Embed** — shows the destination inside a full-page iframe (great for Google Forms)
- **Info Page** — branded landing page with title, description, and a "Go" button
- **Admin Dashboard** — simple, non-technical UI for managing all links
- **Click tracking** — counts how many times each link is used
- **Homepage** — public grid of all enabled links

## Quick Start

```bash
npm install
cp .env.example .env   # then edit .env with your password/secret
npm start               # runs on http://localhost:40001
```

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server port | `40001` |
| `SESSION_SECRET` | Express session secret | (required) |
| `ADMIN_PASSWORD` | Single password for admin access | (required) |

## Admin Access

Go to `/admin` and enter the password set in `ADMIN_PASSWORD`.

## Link Types

| Type | Behaviour |
|---|---|
| Redirect | 302 redirect — visitor is sent straight to the URL |
| Permanent Redirect | 301 redirect — same but cached by browsers |
| Embed | Full-page iframe showing the destination |
| Info Page | Branded page with description and "Go to Link" button |

## Data Storage

All data is stored in JSON files under `data/` — no database required. Files are watched and auto-reloaded on change.
