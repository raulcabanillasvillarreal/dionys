-- Add channel support to conversations
alter table wa_conversations
  add column if not exists channel text default 'whatsapp'
    check (channel in ('whatsapp', 'instagram', 'email')),
  add column if not exists reservation_id uuid references reservations(id),
  add column if not exists email_subject text,
  add column if not exists email_from text,
  add column if not exists instagram_user_id text;

-- Index for channel filtering
create index if not exists idx_wa_conversations_channel on wa_conversations(business_id, channel);
create index if not exists idx_wa_conversations_reservation on wa_conversations(reservation_id);

-- Unique constraint only on whatsapp/instagram (email conversations can have duplicates)
-- The existing unique(business_id, phone) handles whatsapp; instagram uses instagram_user_id

-- Add email unread to existing view
-- (no view change needed, just using the same table)
