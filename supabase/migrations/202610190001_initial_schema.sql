-- Meridian Malaysia public-facing schema. Run in the Supabase SQL editor.

create table if not exists public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null check (char_length(email) <= 320),
  role text not null default 'admin' check (role in ('admin')),
  created_at timestamptz not null default now()
);

-- SECURITY DEFINER avoids recursive RLS when policies check administrator access.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users au
    where au.id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_admin() to anon;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  full_name text not null check (char_length(btrim(full_name)) between 2 and 160),
  email text not null check (char_length(email) <= 320),
  country text not null check (char_length(country) between 2 and 100),
  nationality text not null check (char_length(nationality) between 2 and 100),
  phone_country_code text not null check (phone_country_code ~ '^\+[1-9][0-9]{0,3}$'),
  phone_number text not null check (phone_number ~ '^[0-9 ()-]{5,24}$'),
  service_interest text not null check (service_interest in (
    'company-setup', 'pvip', 'mm2h', 'banking', 'market-entry', 'corporate-structuring', 'other'
  )),
  business_stage text not null default 'exploring' check (business_stage in (
    'exploring', 'planning', 'operating', 'expanding', 'other'
  )),
  business_type text not null default 'not-specified' check (char_length(business_type) <= 160),
  has_existing_company boolean not null default false,
  company_country text check (company_country is null or char_length(company_country) <= 100),
  estimated_budget text not null default 'not-specified' check (estimated_budget in (
    'under-10k', '10k-50k', '50k-100k', '100k-250k', '250k-plus', 'not-specified'
  )),
  timeline text not null default 'not-specified' check (timeline in (
    'immediately', '1-3-months', '3-6-months', '6-12-months', 'exploring', 'not-specified'
  )),
  visa_interest text not null default 'not-specified' check (visa_interest in (
    'pvip', 'mm2h', 'other', 'no', 'not-specified'
  )),
  banking_interest text not null default 'not-specified' check (banking_interest in (
    'yes', 'no', 'not-specified'
  )),
  contact_preference text not null default 'email' check (contact_preference in (
    'email', 'phone', 'whatsapp', 'video'
  )),
  message text not null default '' check (char_length(message) <= 5000),
  priority text not null default 'standard' check (priority in ('high', 'standard', 'completed')),
  status text not null default 'new' check (status in (
    'new', 'contacted', 'qualified', 'processing', 'completed', 'closed'
  )),
  source text not null default 'website' check (char_length(source) <= 200),
  language text not null default 'ar' check (language in ('en', 'ar', 'ms', 'zh')),
  timezone text check (timezone is null or char_length(timezone) <= 100),
  utm_source text check (utm_source is null or char_length(utm_source) <= 200),
  utm_medium text check (utm_medium is null or char_length(utm_medium) <= 200),
  utm_campaign text check (utm_campaign is null or char_length(utm_campaign) <= 200),
  constraint leads_email_format check (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$')
);

create table if not exists public.site_content (
  id uuid primary key default gen_random_uuid(),
  content_key text not null check (content_key ~ '^[a-z0-9._-]{1,120}$'),
  language text not null check (language in ('en', 'ar', 'ms', 'zh')),
  content_value text not null check (char_length(content_value) <= 30000),
  is_public boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (content_key, language)
);

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text not null unique check (setting_key ~ '^[a-z0-9._-]{1,120}$'),
  setting_value jsonb not null default '{}'::jsonb check (pg_column_size(setting_value) <= 10000),
  is_public boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into public.site_content (content_key, language, content_value, is_public)
values
  ('home.hero.title', 'en', 'Build your next chapter in Malaysia.', true),
  ('home.hero.description', 'en', 'Discreet guidance for the decisions behind a Malaysian presence — from company formation and structuring to relocation and market entry.', true),
  ('home.hero.title', 'ar', 'ابدأ فصلك القادم في ماليزيا.', true),
  ('home.hero.description', 'ar', 'إرشاد متأنٍ للقرارات المرتبطة بالحضور في ماليزيا، من تأسيس الشركات وهيكلتها إلى الانتقال ودخول السوق.', true),
  ('home.hero.title', 'ms', 'Bina bab seterusnya anda di Malaysia.', true),
  ('home.hero.description', 'ms', 'Panduan teliti untuk keputusan berkaitan kehadiran di Malaysia — daripada penubuhan dan struktur syarikat kepada perpindahan dan kemasukan pasaran.', true),
  ('home.hero.title', 'zh', '在马来西亚开启您的新篇章。', true),
  ('home.hero.description', 'zh', '为您在马来西亚发展的关键决策提供审慎指引，涵盖公司设立与架构、迁居及市场进入。', true)
on conflict (content_key, language) do nothing;

insert into public.site_settings (setting_key, setting_value, is_public)
values
  ('seo.home.title', '"Meridian Malaysia — Your Gateway to Business in Malaysia"'::jsonb, true),
  ('seo.home.description', '"Your gateway to business in Malaysia. Explore company setup, market entry, relocation and independent coordination."'::jsonb, true),
  ('seo.home.og_title', '"Meridian Malaysia — Your Gateway to Business in Malaysia"'::jsonb, true),
  ('seo.home.og_description', '"Thoughtful guidance for company setup, market entry and business facilitation in Malaysia."'::jsonb, true),
  ('seo.canonical_url', '""'::jsonb, true),
  ('seo.robots', '"index,follow"'::jsonb, true),
  ('contact.whatsapp_number', '""'::jsonb, true)
on conflict (setting_key) do nothing;

create or replace function public.is_safe_analytics_metadata(value jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case
    when pg_catalog.jsonb_typeof(value) <> 'object' then false
    else pg_catalog.pg_column_size(value) <= 2048
      and (value - array['section', 'action', 'source', 'service', 'label']::text[]) = '{}'::jsonb
      and not exists (
        select 1
        from pg_catalog.jsonb_each(value) as item(key, item_value)
        where pg_catalog.jsonb_typeof(item_value) not in ('string', 'number', 'boolean')
          or pg_catalog.length(item_value::text) > 120
      )
  end;
$$;

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_type text not null check (event_type in (
    'page_view', 'language_change', 'theme_change', 'lead_started',
    'lead_completed', 'cta_clicked', 'ad_loaded', 'ad_failed'
  )),
  page text not null check (char_length(page) between 1 and 300 and page ~ '^/[A-Za-z0-9/_-]*$'),
  language text not null check (language in ('en', 'ar', 'ms', 'zh')),
  timezone text check (timezone is null or char_length(timezone) <= 100),
  metadata jsonb not null default '{}'::jsonb check (public.is_safe_analytics_metadata(metadata))
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_status_idx on public.leads (status);
create index if not exists leads_priority_idx on public.leads (priority);
create index if not exists leads_service_interest_idx on public.leads (service_interest);
create index if not exists analytics_events_created_at_idx on public.analytics_events (created_at desc);
create index if not exists analytics_events_type_created_idx on public.analytics_events (event_type, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Pause Meridian writes at 400 MiB of total database usage, leaving a 100 MiB
-- buffer below Supabase Free's 500 MB database limit. No files or buckets are used.
create or replace function public.enforce_storage_budget()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_database_bytes bigint;
begin
  perform pg_catalog.pg_advisory_xact_lock(1928374, 915);
  if tg_table_name = 'analytics_events' then
    delete from public.analytics_events
    where created_at < pg_catalog.now() - interval '90 days';
  end if;
  current_database_bytes := pg_catalog.pg_database_size(pg_catalog.current_database());
  if current_database_bytes >= 400 * 1024 * 1024 then
    raise exception 'Storage safety limit reached. New writes are paused until storage is reviewed.';
  end if;
  return new;
end;
$$;

drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at before update on public.leads
for each row execute function public.set_updated_at();
create or replace function public.normalize_public_lead()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not public.is_admin() then
    new.id = pg_catalog.gen_random_uuid();
    new.created_at = now();
    new.updated_at = now();
    new.priority = 'standard';
    new.status = 'new';
    new.source = 'website';
  end if;
  return new;
end;
$$;
drop trigger if exists leads_normalize_public_submission on public.leads;
create trigger leads_normalize_public_submission before insert on public.leads
for each row execute function public.normalize_public_lead();
drop trigger if exists site_content_set_updated_at on public.site_content;
create trigger site_content_set_updated_at before update on public.site_content
for each row execute function public.set_updated_at();
drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at before update on public.site_settings
for each row execute function public.set_updated_at();
drop trigger if exists leads_storage_budget on public.leads;
create trigger leads_storage_budget before insert or update on public.leads
for each row execute function public.enforce_storage_budget();
drop trigger if exists site_content_storage_budget on public.site_content;
create trigger site_content_storage_budget before insert or update on public.site_content
for each row execute function public.enforce_storage_budget();
drop trigger if exists site_settings_storage_budget on public.site_settings;
create trigger site_settings_storage_budget before insert or update on public.site_settings
for each row execute function public.enforce_storage_budget();
drop trigger if exists analytics_events_storage_budget on public.analytics_events;
create trigger analytics_events_storage_budget before insert or update on public.analytics_events
for each row execute function public.enforce_storage_budget();
drop trigger if exists admin_users_storage_budget on public.admin_users;
create trigger admin_users_storage_budget before insert or update on public.admin_users
for each row execute function public.enforce_storage_budget();

alter table public.admin_users enable row level security;
alter table public.leads enable row level security;
alter table public.site_content enable row level security;
alter table public.site_settings enable row level security;
alter table public.analytics_events enable row level security;

drop policy if exists "Admins can read administrator list" on public.admin_users;
create policy "Admins can read administrator list" on public.admin_users
for select to authenticated using (public.is_admin());
-- No client INSERT/UPDATE/DELETE policies: provision admin rows through the SQL editor.

drop policy if exists "Public can submit valid leads" on public.leads;
create policy "Public can submit valid leads" on public.leads
for insert to anon, authenticated with check (true);
drop policy if exists "Admins can read leads" on public.leads;
create policy "Admins can read leads" on public.leads
for select to authenticated using (public.is_admin());
drop policy if exists "Admins can update leads" on public.leads;
create policy "Admins can update leads" on public.leads
for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public can read published site content" on public.site_content;
create policy "Public can read published site content" on public.site_content
for select to anon, authenticated using (is_public or public.is_admin());
drop policy if exists "Admins can insert site content" on public.site_content;
create policy "Admins can insert site content" on public.site_content
for insert to authenticated with check (public.is_admin());
drop policy if exists "Admins can update site content" on public.site_content;
create policy "Admins can update site content" on public.site_content
for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins can delete site content" on public.site_content;
create policy "Admins can delete site content" on public.site_content
for delete to authenticated using (public.is_admin());

drop policy if exists "Public can read public settings" on public.site_settings;
create policy "Public can read public settings" on public.site_settings
for select to anon, authenticated using (is_public or public.is_admin());
drop policy if exists "Admins can insert settings" on public.site_settings;
create policy "Admins can insert settings" on public.site_settings
for insert to authenticated with check (public.is_admin());
drop policy if exists "Admins can update settings" on public.site_settings;
create policy "Admins can update settings" on public.site_settings
for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins can delete settings" on public.site_settings;
create policy "Admins can delete settings" on public.site_settings
for delete to authenticated using (public.is_admin());

drop policy if exists "Public can record validated analytics" on public.analytics_events;
create policy "Public can record validated analytics" on public.analytics_events
for insert to anon, authenticated with check (true);
drop policy if exists "Admins can read analytics" on public.analytics_events;
create policy "Admins can read analytics" on public.analytics_events
for select to authenticated using (public.is_admin());

grant insert on public.leads to anon, authenticated;
grant select, update on public.leads to authenticated;
grant select on public.site_content to anon, authenticated;
grant insert, update, delete on public.site_content to authenticated;
grant select on public.site_settings to anon, authenticated;
grant insert, update, delete on public.site_settings to authenticated;
grant select, insert on public.analytics_events to anon, authenticated;
grant select on public.admin_users to authenticated;
grant usage on schema public to anon, authenticated;

revoke all on public.admin_users, public.leads, public.site_content, public.site_settings, public.analytics_events
from public, anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select on public.admin_users to authenticated;
grant insert on public.leads to anon, authenticated;
grant select, update on public.leads to authenticated;
grant select on public.site_content to anon, authenticated;
grant insert, update, delete on public.site_content to authenticated;
grant select on public.site_settings to anon, authenticated;
grant insert, update, delete on public.site_settings to authenticated;
grant insert on public.analytics_events to anon, authenticated;
grant select on public.analytics_events to authenticated;

-- First admin: create the Auth user first, then run:
-- insert into public.admin_users (id, email, role)
-- values ('<AUTH_USER_UUID>', '<ADMIN_EMAIL>', 'admin');
