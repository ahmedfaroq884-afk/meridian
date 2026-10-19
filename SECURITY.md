# Security notes

- The frontend uses only Supabase's publishable key. Never add a service-role key or private credential to Vite variables, source control, or the browser bundle.
- Apply `supabase/migrations/202610190001_initial_schema.sql` to the intended Supabase project. RLS is enabled on all tables. Anonymous visitors can insert constrained leads and narrow analytics events; they cannot read leads or analytics. Admin data access is limited by `public.is_admin()` and the `admin_users` table.
- Create the first administrator through Supabase Auth, then add that Auth user's UUID and email to `public.admin_users` in the Supabase SQL editor. Do not add a public admin-registration flow. Later admin provisioning uses the same trusted SQL-editor process.
- Enable email confirmation or another appropriate Supabase Auth provider, configure allowed redirect URLs, and set reasonable provider-side rate limits before launch.
- Public lead submission is anonymous and has no server-side challenge or per-IP rate limit in the static site. The form's honeypot is only a lightweight deterrent. Add a server-verified challenge or a rate-limited server-side submission path before relying on it for high-volume traffic; never treat browser-side checks as security controls.
- Content is rendered as plain text; do not enable unsanitized HTML.
- Analytics must not include lead details or raw IP addresses. Consent requirements vary by jurisdiction; obtain suitable legal advice before enabling persistent analytics in markets that require consent.
- `_headers` includes a restrictive baseline Content Security Policy. The optional advertising provider is not active. Review and narrowly extend CSP only after receiving the official publisher tag; never enable `unsafe-eval` without a verified technical requirement.
- Validate the migration's policies in the Supabase SQL editor using anon, ordinary authenticated, and administrator test accounts before launch. The app cannot verify remote RLS without project credentials.

## Database write-pause monitoring and recovery

The migration pauses application writes at 400 MiB of total database usage. This is a safety stop, not a storage alert; a lead submission will fail rather than appear successful when the limit is reached. Check the database at least weekly, and daily once it passes 350 MiB. Treat 380 MiB as an escalation point and resolve the cause before it reaches 400 MiB.

Run these read-only queries in the Supabase SQL editor:

```sql
select pg_database_size(current_database()) as database_bytes,
       pg_size_pretty(pg_database_size(current_database())) as database_size,
       400 * 1024 * 1024 as application_write_pause_bytes;

select schemaname, relname,
       pg_total_relation_size(format('%I.%I', schemaname, relname)::regclass) as total_bytes,
       pg_size_pretty(pg_total_relation_size(format('%I.%I', schemaname, relname)::regclass)) as total_size
from pg_stat_user_tables
order by pg_total_relation_size(format('%I.%I', schemaname, relname)::regclass) desc;
```

If writes are paused:

1. Confirm the exact database size and identify which tables or indexes account for the growth.
2. Export a protected backup before removing any records. Keep it outside public or shared storage.
3. Review and, where appropriate, remove old analytics events first. The migration automatically prunes analytics older than 90 days when a new analytics event is inserted, but that cleanup cannot be relied on after all inserts have already stopped.
4. Do not delete student or customer enquiries just to restore writes. Apply the organisation's retention policy, preserve any required records, and consider upgrading the database plan if the records must be retained.
5. Recheck the database size after cleanup or an upgrade, then verify a test enquiry and the expected RLS restrictions before reopening public submissions.

The Supabase project owner must run any cleanup and verify recovery. Meridian Malaysia's static website cannot monitor database size or restore database writes by itself.
