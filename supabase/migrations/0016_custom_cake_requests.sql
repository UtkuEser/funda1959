-- Funda 1959 — Özel pasta talepleri (ana sayfa "Kutlamanıza özel bir pasta" formu)
-- Apply with the Supabase CLI (`supabase db push`) or paste into the SQL editor.
-- Depends on 0012. Safe to re-run: add column if not exists / drop + add
-- constraint / create or replace function / bucket upsert.
--
-- The home page form is stored as an iletişim talebi, through the same
-- submit_contact_request (one row per client_request_id, per-sender and
-- overall rate limit, server only), with its own subject 'ozel-pasta' so
-- Merkez sees it as "Özel Pasta Talebi". The server writes every field of the
-- form (kutlama türü, kişi sayısı, etkinlik tarihi, not) into `message`. No
-- order, no payment. The five /iletisim subjects are unchanged and the app
-- still refuses 'ozel-pasta' from the /iletisim form.
--
-- Optional reference photo: stored by the server in the PRIVATE bucket
-- `contact-attachments` (no public URL, no policies -> only the service
-- role); the request keeps its object path in `attachment_path`. The path is
-- tied to the request (requests/<client_request_id>/<sha256>.<ext>), only an
-- 'ozel-pasta' request may carry one. Merkez sees it through a short-lived
-- signed URL made by the server. Retention / deletion: not decided (A19).
--
-- Until this is applied the database refuses the subject ('invalid_subject')
-- / the bucket is missing, and the form says the setup is missing — nothing
-- is stored, no false success.

alter table public.contact_requests drop constraint if exists contact_requests_subject_check;
alter table public.contact_requests add constraint contact_requests_subject_check
  check (subject in ('ozel-gun', 'kurumsal', 'genel', 'sikayet', 'diger', 'ozel-pasta'));

alter table public.contact_requests add column if not exists attachment_path text;
alter table public.contact_requests drop constraint if exists contact_requests_attachment_check;
alter table public.contact_requests add constraint contact_requests_attachment_check
  check (attachment_path is null or (
    subject = 'ozel-pasta'
    and attachment_path ~ '^requests/[A-Za-z0-9_-]{8,80}/[0-9a-f]{64}\.(jpg|png|webp)$'));

-- ---------------------------------------------------------------------------
-- Storage: private bucket for the request photos (written by the server only)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('contact-attachments', 'contact-attachments', false, 4194304, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- submit_contact_request — 0012's function plus 'ozel-pasta' and the photo path
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
  v_attach  text := nullif(btrim(coalesce(p_payload->>'attachment_path', '')), '');
  v_row     contact_requests%rowtype;
begin
  if length(v_req) not between 8 and 80 then raise exception 'invalid_request_id'; end if;
  if v_key !~ '^[0-9a-f]{32,128}$' then raise exception 'invalid_client_key'; end if;

  -- the same request twice (retry, double click, two at once): one row
  perform pg_advisory_xact_lock(hashtextextended('contact_request:' || v_req, 0));
  select * into v_row from contact_requests where client_request_id = v_req;
  if found then
    return jsonb_build_object('id', v_row.id, 'created_at', v_row.created_at, 'duplicate', true,
                              'attachment_path', v_row.attachment_path);
  end if;

  if length(v_name) not between 2 and 120 then raise exception 'invalid_name'; end if;
  if v_phone is null and v_email is null then raise exception 'contact_required'; end if;
  if v_phone is not null and (length(v_phone) not between 10 and 20 or v_phone !~ '^\+?[0-9 ()-]+$') then
    raise exception 'invalid_phone';
  end if;
  if v_email is not null and (length(v_email) not between 6 and 254 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') then
    raise exception 'invalid_email';
  end if;
  if v_subject not in ('ozel-gun', 'kurumsal', 'genel', 'sikayet', 'diger', 'ozel-pasta') then raise exception 'invalid_subject'; end if;
  if length(v_message) not between 10 and 3000 then raise exception 'invalid_message'; end if;
  if v_attach is not null and (
       v_subject <> 'ozel-pasta'
       or left(v_attach, length('requests/' || v_req || '/')) <> 'requests/' || v_req || '/'
       or v_attach !~ '^requests/[A-Za-z0-9_-]{8,80}/[0-9a-f]{64}\.(jpg|png|webp)$') then
    raise exception 'invalid_attachment';
  end if;

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

  insert into contact_requests (full_name, phone, email, subject, message, attachment_path, client_request_id, client_key)
  values (v_name, v_phone, v_email, v_subject, v_message, v_attach, v_req, v_key)
  returning * into v_row;
  return jsonb_build_object('id', v_row.id, 'created_at', v_row.created_at, 'duplicate', false,
                            'attachment_path', v_row.attachment_path);
end;
$$;

-- ---------------------------------------------------------------------------
-- update_contact_request — 0012's function, the answer also carries the photo path
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
    'note_updated_by', v_row.note_updated_by, 'note_updated_at', v_row.note_updated_at,
    'attachment_path', v_row.attachment_path);
end;
$$;

-- ---------------------------------------------------------------------------
-- list_contact_requests — 0012's function, each row also carries the photo path
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
        'note_updated_by', r.note_updated_by, 'note_updated_at', r.note_updated_at,
        'attachment_path', r.attachment_path)
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

-- the API sees the change right away
notify pgrst, 'reload schema';
