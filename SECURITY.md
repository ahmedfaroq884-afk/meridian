# Security notes

- The frontend uses only Supabase's publishable key. Never add a service-role key or private credential to Vite variables, source control, or the browser bundle.
- Apply `supabase/migrations/202610190001_initial_schema.sql` to the intended Supabase project. RLS is enabled on all tables. Anonymous visitors can insert constrained leads and narrow analytics events; they cannot read leads or analytics. Admin data access is limited by `public.is_admin()` and the `admin_users` table.
- Create the first administrator through Supabase Auth, then add that Auth user's UUID and email to `public.admin_users` in the Supabase SQL editor. Do not add a public admin-registration flow. Later admin provisioning uses the same trusted SQL-editor process.
- Enable email confirmation or another appropriate Supabase Auth provider, configure allowed redirect URLs, and set reasonable provider-side rate limits before launch.
- Public lead submission is exposed to abuse/spam because it is intentionally anonymous. Review Supabase rate limits and add a server-side challenge/rate-limit service if traffic requires it.
- Content is rendered as plain text; do not enable unsanitized HTML.
- Analytics must not include lead details or raw IP addresses. Consent requirements vary by jurisdiction; obtain suitable legal advice before enabling persistent analytics in markets that require consent.
- `_headers` includes a restrictive baseline Content Security Policy. The optional advertising provider is not active. Review and narrowly extend CSP only after receiving the official publisher tag; never enable `unsafe-eval` without a verified technical requirement.
- Validate the migration's policies in the Supabase SQL editor using anon, ordinary authenticated, and administrator test accounts before launch. The app cannot verify remote RLS without project credentials.
