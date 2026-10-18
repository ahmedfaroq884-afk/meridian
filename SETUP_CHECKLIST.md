# Owner setup checklist

## Supabase
1. Create a Supabase project and run `supabase/migrations/202610190001_initial_schema.sql`.
2. Enable the chosen Auth provider, email confirmation, and appropriate provider-side rate limits. Set the final site URL and redirect URLs.
3. Create the first admin account through Supabase Auth.
4. In the SQL editor, insert that user's Auth UUID and email into `public.admin_users` using the provisioning example at the end of the migration.
5. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in local/Cloudflare environment settings. Use only the publishable key.
6. Test lead insert, denied anonymous lead reads, denied ordinary-user admin access, and permitted administrator access against RLS.

## Cloudflare Pages
1. Connect the repository.
2. Set build command to `npm run build` and output directory to `dist`.
3. Configure the two Supabase frontend variables and `VITE_SITE_URL` if Supabase is enabled.
4. Replace the sitemap and robots domain placeholders with the verified production domain.
5. Deploy; connect the domain and verify HTTPS, redirects, headers, and all public routes.

## Optional Adsterra
1. Register as a publisher and complete any verification/payment setup.
2. Add the website, request an appropriate banner format, and wait for approval.
3. Copy the generated publisher tag and provide only that tag for integration.
4. Never share account credentials, payment credentials, or private tokens.
