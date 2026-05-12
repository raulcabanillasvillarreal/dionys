-- Increment unread count for a conversation (used by webhook)
create or replace function increment_unread(conv_id uuid)
returns void language plpgsql as $$
begin
  update wa_conversations
  set unread_count = coalesce(unread_count, 0) + 1
  where id = conv_id;
end;
$$;

-- RLS policies for whatsapp tables (service role bypasses these, used for anon/realtime subscriptions)
create policy "service_role_all_wa_conversations" on wa_conversations
  for all using (true) with check (true);

create policy "service_role_all_wa_messages" on wa_messages
  for all using (true) with check (true);

create policy "service_role_all_message_templates" on message_templates
  for all using (true) with check (true);

create policy "service_role_all_automations" on automations
  for all using (true) with check (true);
