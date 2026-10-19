-- Student enquiries and agent referrals. Apply after 202610190001_initial_schema.sql.
-- Student forms collect no passport or identity-document uploads.

create table if not exists public.education_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null check (char_length(btrim(full_name)) between 2 and 160),
  email text not null check (char_length(email) <= 320 and email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'),
  phone_number text check (phone_number is null or char_length(phone_number) <= 40),
  current_country text not null check (char_length(current_country) between 2 and 100),
  university_preference text check (university_preference is null or char_length(university_preference) <= 500),
  study_level text not null check (study_level in ('foundation', 'diploma', 'bachelors', 'masters', 'doctoral')),
  intended_subject text not null check (char_length(btrim(intended_subject)) between 2 and 180),
  intake text check (intake is null or char_length(intake) <= 80),
  highest_qualification text not null check (char_length(btrim(highest_qualification)) between 2 and 500),
  tuition_budget text not null check (tuition_budget in ('under-20k', '20k-50k', '50k-100k', '100k-plus', 'not-specified')),
  additional_message text not null default '' check (char_length(additional_message) <= 2000),
  agent_intro_requested boolean not null default false,
  privacy_contact_consent boolean not null default false check (privacy_contact_consent),
  language text not null check (language in ('en', 'ar', 'ms', 'zh')),
  timezone text check (timezone is null or char_length(timezone) <= 100)
);

create table if not exists public.education_agents (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (char_length(email) between 5 and 320),
  display_name text not null check (char_length(btrim(display_name)) between 2 and 160),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.education_commission_agreements (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.education_agents(id) on delete restrict,
  agreement_reference text not null check (char_length(btrim(agreement_reference)) between 2 and 200),
  written_agreement_date date not null,
  valid_from date not null,
  valid_until date,
  commission_rate numeric(5,2) not null check (commission_rate between 0 and 100),
  commission_basis text not null check (char_length(btrim(commission_basis)) between 2 and 500),
  currency_code text not null default 'MYR' check (currency_code ~ '^[A-Z]{3}$'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  check (valid_until is null or valid_until >= valid_from)
);

create table if not exists public.education_agent_consents (
  student_lead_id uuid not null references public.education_leads(id) on delete cascade,
  agent_id uuid not null references public.education_agents(id) on delete restrict,
  consented_at timestamptz not null,
  consent_method text not null check (consent_method in ('email', 'written', 'phone', 'video', 'other')),
  evidence_reference text not null check (char_length(btrim(evidence_reference)) between 2 and 500),
  recorded_by uuid not null default auth.uid() references auth.users(id),
  revoked_at timestamptz,
  primary key (student_lead_id, agent_id)
);

create table if not exists public.education_referrals (
  id uuid primary key default gen_random_uuid(),
  student_lead_id uuid not null unique references public.education_leads(id) on delete restrict,
  agent_id uuid not null references public.education_agents(id) on delete restrict,
  agreement_id uuid not null references public.education_commission_agreements(id) on delete restrict,
  assigned_at timestamptz not null default now(),
  application_status text not null default 'assigned' check (application_status in (
    'assigned', 'application-in-progress', 'offer-received', 'enrolled', 'declined', 'withdrawn', 'completed'
  )),
  commission_base_amount numeric(12,2) not null default 0 check (commission_base_amount >= 0),
  commission_rate_snapshot numeric(5,2) not null check (commission_rate_snapshot between 0 and 100),
  expected_commission_amount numeric(12,2) generated always as
    (round(commission_base_amount * commission_rate_snapshot / 100, 2)) stored,
  actual_received_amount numeric(12,2) not null default 0 check (actual_received_amount >= 0),
  currency_code text not null check (currency_code ~ '^[A-Z]{3}$'),
  payment_status text not null default 'not-due' check (payment_status in (
    'not-due', 'pending', 'partially-received', 'received', 'disputed', 'not-payable'
  )),
  payment_note text not null default '' check (char_length(payment_note) <= 1000),
  updated_at timestamptz not null default now()
);

create index if not exists education_leads_created_at_idx on public.education_leads (created_at desc);
create index if not exists education_referrals_agent_idx on public.education_referrals (agent_id, assigned_at desc);
create index if not exists education_agreements_agent_active_idx on public.education_commission_agreements (agent_id, is_active);

create or replace function public.is_education_agent()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.education_agents ea
    join auth.users au on lower(au.email) = lower(ea.email)
    where au.id = auth.uid()
      and au.email_confirmed_at is not null
      and ea.is_active
  );
$$;
revoke all on function public.is_education_agent() from public, anon;
grant execute on function public.is_education_agent() to authenticated;

create or replace function public.has_education_agent_consent(student_id uuid, agent_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.education_agent_consents c
    where c.student_lead_id = $1
      and c.agent_id = $2
      and c.revoked_at is null
      and (
        public.is_admin()
        or exists (
          select 1 from public.education_agents ea
          where ea.id = $2
            and ea.is_active
            and lower(ea.email) = lower((select auth.jwt() ->> 'email'))
        )
      )
  );
$$;
revoke all on function public.has_education_agent_consent(uuid, uuid) from public, anon;
grant execute on function public.has_education_agent_consent(uuid, uuid) to authenticated;

create or replace function public.assign_education_lead(
  p_student_lead_id uuid,
  p_agent_id uuid,
  p_agreement_id uuid,
  p_consent_at timestamptz,
  p_consent_method text,
  p_evidence_reference text,
  p_commission_base_amount numeric default 0
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  selected_lead public.education_leads%rowtype;
  selected_agreement public.education_commission_agreements%rowtype;
  referral_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Administrator access required.' using errcode = '42501';
  end if;

  select * into selected_lead
  from public.education_leads
  where id = p_student_lead_id;
  if not found then
    raise exception 'Education enquiry not found.';
  end if;
  if not selected_lead.agent_intro_requested then
    raise exception 'The student did not request an introduction to an education agent.';
  end if;
  if exists (
    select 1 from public.education_referrals
    where student_lead_id = p_student_lead_id
  ) then
    raise exception 'This enquiry already has a referral. Existing assignment and payment records were left unchanged.';
  end if;
  if p_consent_at is null or p_consent_at > pg_catalog.now()
     or p_evidence_reference is null or char_length(btrim(p_evidence_reference)) < 2 then
    raise exception 'Record the student's consent date and evidence reference before assigning an agent.';
  end if;
  if p_consent_method is null or p_consent_method not in ('email', 'written', 'phone', 'video', 'other') then
    raise exception 'Choose a valid consent method.';
  end if;
  if p_commission_base_amount is null or p_commission_base_amount < 0 then
    raise exception 'Commission base amount must be zero or greater.';
  end if;

  select * into selected_agreement
  from public.education_commission_agreements
  where id = p_agreement_id
    and agent_id = p_agent_id
    and is_active
    and valid_from <= current_date
    and (valid_until is null or valid_until >= current_date);
  if not found then
    raise exception 'Select a current written agreement for this agent.';
  end if;

  insert into public.education_agent_consents (
    student_lead_id, agent_id, consented_at, consent_method, evidence_reference, recorded_by, revoked_at
  ) values (
    p_student_lead_id, p_agent_id, p_consent_at, p_consent_method, btrim(p_evidence_reference), auth.uid(), null
  )
  on conflict (student_lead_id, agent_id) do update set
    consented_at = excluded.consented_at,
    consent_method = excluded.consent_method,
    evidence_reference = excluded.evidence_reference,
    recorded_by = excluded.recorded_by,
    revoked_at = null;

  insert into public.education_referrals (
    student_lead_id, agent_id, agreement_id, commission_base_amount,
    commission_rate_snapshot, currency_code
  ) values (
    p_student_lead_id, p_agent_id, p_agreement_id, p_commission_base_amount,
    selected_agreement.commission_rate, selected_agreement.currency_code
  )
  returning id into referral_id;

  return referral_id;
end;
$$;
revoke all on function public.assign_education_lead(uuid, uuid, uuid, timestamptz, text, text, numeric) from public, anon;
grant execute on function public.assign_education_lead(uuid, uuid, uuid, timestamptz, text, text, numeric) to authenticated;

create or replace function public.normalize_education_lead()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    new.id = gen_random_uuid();
    new.created_at = pg_catalog.now();
  end if;
  new.full_name = btrim(new.full_name);
  new.email = btrim(new.email);
  new.current_country = btrim(new.current_country);
  new.intended_subject = btrim(new.intended_subject);
  new.highest_qualification = btrim(new.highest_qualification);
  return new;
end;
$$;
revoke all on function public.normalize_education_lead() from public, anon, authenticated;
drop trigger if exists education_leads_normalize on public.education_leads;
create trigger education_leads_normalize before insert on public.education_leads
for each row execute function public.normalize_education_lead();

create or replace function public.set_education_referral_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;
revoke all on function public.set_education_referral_updated_at() from public, anon, authenticated;

drop trigger if exists education_referrals_set_updated_at on public.education_referrals;
create trigger education_referrals_set_updated_at before update on public.education_referrals
for each row execute function public.set_education_referral_updated_at();
drop trigger if exists education_leads_storage_budget on public.education_leads;
create trigger education_leads_storage_budget before insert or update on public.education_leads
for each row execute function public.enforce_storage_budget();
drop trigger if exists education_agents_storage_budget on public.education_agents;
create trigger education_agents_storage_budget before insert or update on public.education_agents
for each row execute function public.enforce_storage_budget();
drop trigger if exists education_agreements_storage_budget on public.education_commission_agreements;
create trigger education_agreements_storage_budget before insert or update on public.education_commission_agreements
for each row execute function public.enforce_storage_budget();
drop trigger if exists education_consents_storage_budget on public.education_agent_consents;
create trigger education_consents_storage_budget before insert or update on public.education_agent_consents
for each row execute function public.enforce_storage_budget();
drop trigger if exists education_referrals_storage_budget on public.education_referrals;
create trigger education_referrals_storage_budget before insert or update on public.education_referrals
for each row execute function public.enforce_storage_budget();

alter table public.education_leads enable row level security;
alter table public.education_agents enable row level security;
alter table public.education_commission_agreements enable row level security;
alter table public.education_agent_consents enable row level security;
alter table public.education_referrals enable row level security;

drop policy if exists "Students can submit education enquiries" on public.education_leads;
create policy "Students can submit education enquiries" on public.education_leads
for insert to anon, authenticated with check (privacy_contact_consent = true);
drop policy if exists "Admins can read education enquiries" on public.education_leads;
create policy "Admins can read education enquiries" on public.education_leads
for select to authenticated using (public.is_admin());
drop policy if exists "Admins can update education enquiries" on public.education_leads;
create policy "Admins can update education enquiries" on public.education_leads
for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Consented education agents can read assigned enquiries" on public.education_leads;
create policy "Consented education agents can read assigned enquiries" on public.education_leads
for select to authenticated using (
  public.is_education_agent()
  and exists (
    select 1 from public.education_referrals r
    join public.education_agents ea on ea.id = r.agent_id
    where r.student_lead_id = education_leads.id
      and lower(ea.email) = lower((select auth.jwt() ->> 'email'))
      and public.has_education_agent_consent(education_leads.id, ea.id)
  )
);

drop policy if exists "Admins can manage education agents" on public.education_agents;
create policy "Admins can manage education agents" on public.education_agents
for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Agents can read their own profile" on public.education_agents;
create policy "Agents can read their own profile" on public.education_agents
for select to authenticated using (
  public.is_education_agent()
  and lower(email) = lower((select auth.jwt() ->> 'email'))
);

drop policy if exists "Admins can manage commission agreements" on public.education_commission_agreements;
create policy "Admins can manage commission agreements" on public.education_commission_agreements
for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Agents can read their own commission agreement" on public.education_commission_agreements;
create policy "Agents can read their own commission agreement" on public.education_commission_agreements
for select to authenticated using (
  public.is_education_agent()
  and exists (
    select 1 from public.education_agents ea
    where ea.id = education_commission_agreements.agent_id
      and lower(ea.email) = lower((select auth.jwt() ->> 'email'))
  )
);

drop policy if exists "Admins can review agent consent records" on public.education_agent_consents;
create policy "Admins can review agent consent records" on public.education_agent_consents
for select to authenticated using (public.is_admin());
drop policy if exists "Admins can record agent consent" on public.education_agent_consents;
create policy "Admins can record agent consent" on public.education_agent_consents
for insert to authenticated with check (public.is_admin() and recorded_by = auth.uid());
drop policy if exists "Admins can update agent consent" on public.education_agent_consents;
create policy "Admins can update agent consent" on public.education_agent_consents
for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins can manage education referrals" on public.education_referrals;
create policy "Admins can manage education referrals" on public.education_referrals
for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Agents can read consented referrals" on public.education_referrals;
create policy "Agents can read consented referrals" on public.education_referrals
for select to authenticated using (
  public.is_education_agent()
  and exists (
    select 1 from public.education_agents ea
    where ea.id = education_referrals.agent_id
      and ea.is_active
      and lower(ea.email) = lower((select auth.jwt() ->> 'email'))
      and public.has_education_agent_consent(education_referrals.student_lead_id, ea.id)
  )
);

revoke all on public.education_leads, public.education_agents, public.education_commission_agreements,
  public.education_agent_consents, public.education_referrals from public, anon, authenticated;

grant usage on schema public to anon, authenticated;
grant insert on public.education_leads to anon, authenticated;
grant select, update on public.education_leads to authenticated;
grant select, insert, update, delete on public.education_agents to authenticated;
grant select, insert, update, delete on public.education_commission_agreements to authenticated;
grant select, insert, update on public.education_agent_consents to authenticated;
grant select, insert, update, delete on public.education_referrals to authenticated;

comment on table public.education_leads is
  'Student enquiries; public users may insert with contact consent but cannot read or change submissions.';
comment on table public.education_agent_consents is
  'Admin-recorded evidence that a student agreed to share their details with a specifically named agent.';
comment on table public.education_commission_agreements is
  'Configurable commission terms transcribed from a written agreement; no default split is assumed.';
comment on table public.education_referrals is
  'Referral assignment and commission tracking; agents can read only their own consented assignments.';
