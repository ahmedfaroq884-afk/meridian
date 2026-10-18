# Deployment

## Cloudflare Pages

- Build command: `npm run build`
- Build output directory: `dist`
- Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in the Pages project settings if using Supabase.
- Add `VITE_SITE_URL` with the public origin. The client uses the active origin when this value is absent.
- The root `_redirects` and `_headers` files are published from `public/`.
- Replace `YOUR-DOMAIN.example` in `public/sitemap.xml` and `public/robots.txt` with the verified domain before launch.
- Review security headers after adding any third-party service. Ads are disabled by default; add only the script, image, and frame origins required by the exact approved ad tag.

`wrangler.toml` points Pages to `dist`. Connect the repository in Cloudflare Pages or use Wrangler after authenticating through Cloudflare.

## GitHub Pages

GitHub Pages does not apply the Cloudflare `_redirects` file. Clean SPA routes will return a platform 404 there unless a project-specific `404.html` restores the requested path. Use Cloudflare Pages or add that GitHub-specific redirect; for a repository subpath, also set Vite's `base` and update canonical/sitemap URLs. Supabase redirect URLs must match the final origin.

The public pages update titles, descriptions, canonical URLs and Open Graph tags after the client app loads. Social crawlers that do not execute JavaScript may only see the generic tags in `index.html`; set the production title/description there as well if static crawler metadata is required.
