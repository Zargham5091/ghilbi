# Ghibli Anniversary Journey

Next.js 14 (App Router) · Tailwind · Framer Motion · Lucide · MongoDB

A 7-chapter, Ghibli/lofi styled work-anniversary story: Hello World, tutorial hell,
first commit, tiny wins, the 2 AM incident, enterprise scale, and aging like fine wine.
Visitors can swipe/click through chapters, flip Struggle / Goal / Lesson cards, press
"Run" on code snippets, drag a Then-vs-Now slider, and leave a cheer. You (the admin)
edit everything live and save it to MongoDB.

## Run locally
```bash
npm install
npm run dev          # http://localhost:3000
```
Without `MONGODB_URI` the site still works with built-in content; saving is disabled.
Copy `.env.local.example` to `.env.local` and fill it in to enable saving.

## Where is everything stored? (important for Netlify)
Netlify has no permanent disk, so **nothing is written to files**. Everything lives in MongoDB:

| Collection | What |
|---|---|
| `site`   | all text, themes, chapters (one document) |
| `images` | uploaded photos (compressed in the browser to <= 1600px JPEG, stored as binary) |
| `users`  | your admin account (password hashed with scrypt) |
| `stats`  | the cheers counter |

Images are served from `/api/images/<id>` with a 1-year cache header.

## Deploy to Netlify
1. Create a free MongoDB Atlas cluster. Under **Network Access** allow `0.0.0.0/0`
   (Netlify's IPs change). Create a database user and copy the connection string.
2. Push this folder to GitHub, then "Add new site > Import from Git" in Netlify.
   Netlify detects Next.js automatically (`netlify.toml` only sets Node 20).
3. Site settings > Environment variables, add:
   - `MONGODB_URI`  (your Atlas string)
   - `MONGODB_DB`   (optional, default `ghibli_anniversary`)
   - `SESSION_SECRET` (long random string)
   - `ADMIN_USERNAME` and `ADMIN_PASSWORD` (required in production; no defaults)
4. Deploy, open `/anniversary`, click **Admin**, sign in.

## Admin login
The first successful login creates the admin user in MongoDB from `ADMIN_USERNAME` /
`ADMIN_PASSWORD`. After that the database is the source of truth. Change the password
under Edit > Account. (Locally the dev defaults are `admin` / `ghibli2026`.)

## Editing
Click **Edit** (bottom right). The editor works on the chapter currently on screen:
text, struggle/goal/lesson, code snippet and output, theme, image upload or URL,
add / delete / reorder chapters. Press **Save to database** to publish.

## Real music
Drop an mp3 in `public/audio/` and use `<AudioPill accent={accent} src="/audio/lofi.mp3" />`
in `components/GhibliAnniversary.tsx`. Otherwise a small generated lofi pad plays.

## Notes
- Default chapter text is placeholder story; rewrite it with your real experience.
- Auto-Play advances every 6 s (`AUTOPLAY_MS` in `GhibliAnniversary.tsx`).
