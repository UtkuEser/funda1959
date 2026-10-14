-- Funda 1959 — Aşama 8: contact requests (iletişim talepleri)
-- Apply with the Supabase CLI (`supabase db push`) or paste into the SQL editor.
-- Depends on 0001 (set_updated_at). Safe to re-run: create ... if not exists /
-- drop + add constraint / drop + create trigger / create or replace function.
--
-- SUPABASE_PLAN.md D43, §8.5:
--   * the /iletisim form writes one row per request, from the server only
--     (submit_contact_request, service role). The same client_request_id
--     twice — retried or sent twice at once — gives one row;
--   * name, subject, message and at least one way back (phone or e-mail)
--     are required; the five subjects of the form are the only subjects;
--   * submission rate limit lives here, not in a server's memory, so it holds
--     across Vercel instances: per sender (an HMAC of the IP computed by the
--     app — never the IP itself) 3 per 10 minutes and 10 per day, plus 200
--     per hour overall. Checked under a per-sender lock;
--   * only Merkez reads and manages requests (status new / in_progress /
--     closed, internal note). Branch accounts have no access (app + here);
--   * nothing here is readable or writable through the public API (RLS on,
--     no policies, no grants to anon / authenticated).
-- Retention and deletion policy are NOT decided yet (A19): no automatic
-- deletion, no delete function.

create table if not exists public.contact_requests (
  id                uuid        primary key default gen_random_uuid(),
  full_name         text        not null,
  phone             text,
  email             text,
  subject           text        not null,
  message           text        not null,
  status            text        not null default 'new',
  internal_note     text,
  client_request_id text        not null,
  client_key        text        not null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  handled_by        text,
  handled_at        timestamptz,
  note_updated_by   text,
  note_updated_at   timestamptz
);

alter table public.contact_requests drop constraint if exists contact_requests_client_request_id_key;
alter table public.contact_requests add constraint contact_requests_client_request_id_key unique (client_request_id);
alter table public.contact_requests drop constraint if exists contact_requests_full_name_check;
alter table public.contact_requests add constraint contact_requests_full_name_check
  check (length(btrim(full_name)) between 2 and 120);
alter table public.contact_requests drop constraint if exists contact_requests_phone_check;
alter table public.contact_requests add constraint contact_requests_phone_check
  check (phone is null or (length(phone) between 10 and 20 and phone ~ '^\+?[0-9 ()-]+$'));
alter table public.contact_requests drop constraint if exists contact_requests_email_check;
alter table public.contact_requests add constraint contact_requests_email_check
  check (email is null or (length(email) between 6 and 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'));
alter table public.contact_requests drop constraint if exists contact_requests_contact_present;
alter table public.contact_requests add constraint contact_requests_contact_present
  check (phone is not null or email is not null);
alter table public.contact_requests drop constraint if exists contact_requests_subject_check;
alter table public.contact_requests add constraint contact_requests_subject_check
  check (subject in ('ozel-gun', 'kurumsal', 'genel', 'sikayet', 'diger'));
alter table public.contact_requests drop constraint if exists contact_requests_message_check;
alter table public.contact_requests add constraint contact_requests_message_check
  check (length(btrim(message)) between 10 and 3000);
alter table public.contact_requests drop constraint if exists contact_requests_status_check;
alter table public.contact_requests add constraint contact_requests_status_check
  check (status in ('new', 'in_progress', 'closed'));
alter table public.contact_requests drop constraint if exists contact_requests_note_check;
alter table public.contact_requests add constraint contact_requests_note_check
  check (internal_note is null or length(internal_note) <= 2000);
alter table public.contact_requests drop constraint if exists contact_requests_request_id_check;
alter table public.contact_requests add constraint contact_requests_request_id_check
  check (length(client_request_id) between 8 and 80);
alter table public.contact_requests drop constraint if exists contact_requests_client_key_check;
alter table public.contact_requests add constraint contact_requests_client_key_check
  check (client_key ~ '^[0-9a-f]{32,128}$');

create index if not exists contact_requests_created_idx on public.contact_requests (created_at desc);
create index if not exists contact_requests_status_created_idx on public.contact_requests (status, created_at desc);
create index if not exists contact_requests_client_key_idx on public.contact_requests (client_key, created_at desc);

drop trigger if exists contact_requests_set_updated_at on public.contact_requests;
create trigger contact_requests_set_updated_at
  before update on public.contact_requests
  for each row execute function public.set_updated_at();

alter table public.contact_requests enable row level security;
revoke all on table public.contact_requests from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- submit_contact_request — the form's only way in (service role)
-- ---------------------------------------------------------------------------
create or replace function public.submit_contact_request(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_req     text := btrim(coalesce(p_payload->>'client_request_id', ''));
  v_key     text := btrim(coalesce(p_payload->>'client_key', ''));
  v_name    text := btrim(coalesce(p_payload->>'full_name', ''));
  v_phone   text := nullif(btrim(coalesce(p_payload->>'phone', '')), '');
  v_email   text := lower(nullif(btrim(coalesce(p_payload->>'email', '')), ''));
  v_subject text := btrim(coalesce(p_payload->>'subject', ''));
  v_message text := btrim(coalesce(p_payload->>'message', ''));
  v_row     contact_requests%rowtype;
begin
  if length(v_req) not between 8 and 80 then raise exception 'invalid_request_id'; end if;
  if v_key !~ '^[0-9a-f]{32,128}$' then raise exception 'invalid_client_key'; end if;

  -- the same request twice (retry, double click, two at once): one row
  perform pg_advisory_xact_lock(hashtextextended('contact_request:' || v_req, 0));
  select * into v_row from contact_requests where client_request_id = v_req;
  if found then
    return jsonb_build_object('id', v_row.id, 'created_at', v_row.created_at, 'duplicate', true);
  end if;

  if length(v_name) not between 2 and 120 then raise exception 'invalid_name'; end if;
  if v_phone is null and v_email is null then raise exception 'contact_required'; end if;
  if v_phone is not null and (length(v_phone) not between 10 and 20 or v_phone !~ '^\+?[0-9 ()-]+$') then
    raise exception 'invalid_phone';
  end if;
  if v_email is not null and (length(v_email) not between 6 and 254 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') then
    raise exception 'invalid_email';
  end if;
  if v_subject not in ('ozel-gun', 'kurumsal', 'genel', 'sikayet', 'diger') then raise exception 'invalid_subject'; end if;
  if length(v_message) not between 10 and 3000 then raise exception 'invalid_message'; end if;

  -- rate limit: one sender at a time, counted from stored rows (all instances)
  perform pg_advisory_xact_lock(hashtextextended('contact_sender:' || v_key, 0));
  if (select count(*) from contact_requests
       where client_key = v_key and created_at > now() - interval '10 minutes') >= 3
     or (select count(*) from contact_requests
          where client_key = v_key and created_at > now() - interval '1 day') >= 10
     or (select count(*) from contact_requests
          where created_at > now() - interval '1 hour') >= 200 then
    raise exception 'rate_limited';
  end if;

  insert into contact_requests (full_name, phone, email, subject, message, client_request_id, client_key)
  values (v_name, v_phone, v_email, v_subject, v_message, v_req, v_key)
  returning * into v_row;
  return jsonb_build_object('id', v_row.id, 'created_at', v_row.created_at, 'duplicate', false);
end;
$$;

-- ---------------------------------------------------------------------------
-- update_contact_request — Merkez only: status and / or internal note
-- ---------------------------------------------------------------------------
create or replace function public.update_contact_request(
  p_id            uuid,
  p_status        text,
  p_set_note      boolean,
  p_note          text,
  p_actor_account text,
  p_actor_name    text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row  contact_requests%rowtype;
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
begin
  if p_actor_account is distinct from 'merkez' or nullif(btrim(coalesce(p_actor_name, '')), '') is null then
    raise exception 'forbidden';
  end if;
  if p_status is not null and p_status not in ('new', 'in_progress', 'closed') then
    raise exception 'invalid_status';
  end if;
  if coalesce(p_set_note, false) and v_note is not null and length(v_note) > 2000 then
    raise exception 'note_too_long';
  end if;

  select * into v_row from contact_requests where id = p_id for update;
  if not found then raise exception 'not_found'; end if;

  if p_status is not null and p_status <> v_row.status then
    update contact_requests
       set status = p_status, handled_by = btrim(p_actor_name), handled_at = now()
     where id = p_id;
  end if;
  if coalesce(p_set_note, false) and v_note is distinct from v_row.internal_note then
    update contact_requests
       set internal_note = v_note, note_updated_by = btrim(p_actor_name), note_updated_at = now()
     where id = p_id;
  end if;

  select * into v_row from contact_requests where id = p_id;
  return jsonb_build_object(
    'id', v_row.id, 'full_name', v_row.full_name, 'phone', v_row.phone, 'email', v_row.email,
    'subject', v_row.subject, 'message', v_row.message, 'status', v_row.status,
    'internal_note', v_row.internal_note, 'created_at', v_row.created_at,
    'handled_by', v_row.handled_by, 'handled_at', v_row.handled_at,
    'note_updated_by', v_row.note_updated_by, 'note_updated_at', v_row.note_updated_at);
end;
$$;

-- ---------------------------------------------------------------------------
-- list_contact_requests — Merkez list (read only): newest first, optional
-- status filter, counts per status. Never returns client_key.
-- ---------------------------------------------------------------------------
create or replace function public.list_contact_requests(
  p_status text default null,
  p_limit  int  default 50,
  p_offset int  default 0
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'counts', jsonb_build_object(
      'new', (select count(*) from contact_requests where status = 'new'),
      'in_progress', (select count(*) from contact_requests where status = 'in_progress'),
      'closed', (select count(*) from contact_requests where status = 'closed')),
    'total', (select count(*) from contact_requests where p_status is null or status = p_status),
    'rows', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', r.id, 'full_name', r.full_name, 'phone', r.phone, 'email', r.email,
        'subject', r.subject, 'message', r.message, 'status', r.status,
        'internal_note', r.internal_note, 'created_at', r.created_at,
        'handled_by', r.handled_by, 'handled_at', r.handled_at,
        'note_updated_by', r.note_updated_by, 'note_updated_at', r.note_updated_at)
        order by r.created_at desc, r.id)
      from (select * from contact_requests
             where p_status is null or status = p_status
             order by created_at desc, id
             limit least(greatest(coalesce(p_limit, 50), 1), 200)
             offset greatest(coalesce(p_offset, 0), 0)) r), '[]'::jsonb)
  );
$$;

revoke all on function public.submit_contact_request(jsonb) from public, anon, authenticated;
grant execute on function public.submit_contact_request(jsonb) to service_role;
revoke all on function public.update_contact_request(uuid, text, boolean, text, text, text) from public, anon, authenticated;
grant execute on function public.update_contact_request(uuid, text, boolean, text, text, text) to service_role;
revoke all on function public.list_contact_requests(text, int, int) from public, anon, authenticated;
grant execute on function public.list_contact_requests(text, int, int) to service_role;
