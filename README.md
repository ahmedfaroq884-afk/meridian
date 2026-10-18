# Meridian Malaysia

A static React, Vite, TypeScript and Tailwind website for business facilitation in Malaysia. Supabase is optional for the public site; lead submission and the protected admin console need a configured Supabase project and the included migration.

## Local development

1. Copy `.env.example` to `.env.local` and fill in the Supabase project URL and publishable key when available.
2. Install packages with `npm install`.
3. Run `npm run dev`.
4. Build with `npm run build`; Vite writes the static site to `dist/`.

See `SETUP_CHECKLIST.md`, `DEPLOYMENT.md`, and `SECURITY.md` before launch.
