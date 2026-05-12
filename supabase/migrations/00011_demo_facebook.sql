-- Expand channel constraint to include facebook
ALTER TABLE wa_conversations
  DROP CONSTRAINT IF EXISTS wa_conversations_channel_check;

ALTER TABLE wa_conversations
  ADD CONSTRAINT wa_conversations_channel_check
  CHECK (channel IN ('whatsapp', 'instagram', 'email', 'facebook'));

-- Demo Facebook conversation from "Raul Cabanillas"
DO $$
DECLARE
  v_business_id uuid;
  v_conv_id uuid;
BEGIN
  SELECT id INTO v_business_id FROM businesses WHERE slug = 'hotel' LIMIT 1;
  IF v_business_id IS NULL THEN RETURN; END IF;

  -- Create or get the demo conversation
  INSERT INTO wa_conversations (
    business_id, phone, contact_name, channel, status,
    last_message, last_message_at, unread_count, tags
  ) VALUES (
    v_business_id,
    'fb_raul_cabanillas',
    'Raul Cabanillas',
    'facebook',
    'open',
    'Perfecto, muchas gracias!',
    NOW() - INTERVAL '5 minutes',
    3,
    ARRAY['VIP']
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_conv_id;

  -- If conversation already exists, get its id
  IF v_conv_id IS NULL THEN
    SELECT id INTO v_conv_id
    FROM wa_conversations
    WHERE business_id = v_business_id AND phone = 'fb_raul_cabanillas'
    LIMIT 1;
  END IF;

  IF v_conv_id IS NULL THEN RETURN; END IF;

  -- Delete existing messages to avoid duplicates on re-run
  DELETE FROM wa_messages WHERE conversation_id = v_conv_id;

  -- Seed demo messages
  INSERT INTO wa_messages (conversation_id, direction, type, content, status, sent_at) VALUES
    (v_conv_id, 'inbound',  'text', 'Hola! Buenos días, quería consultar sobre disponibilidad de habitaciones para este fin de semana.', 'delivered', NOW() - INTERVAL '2 hours'),
    (v_conv_id, 'outbound', 'text', 'Buenos días Raul! Con gusto le ayudo. ¿Para cuántas personas y qué fechas exactamente?', 'read', NOW() - INTERVAL '1 hour 55 minutes'),
    (v_conv_id, 'inbound',  'text', 'Somos 2 personas, del viernes 15 al domingo 17. Preferiblemente una habitación con vista.', 'delivered', NOW() - INTERVAL '1 hour 50 minutes'),
    (v_conv_id, 'outbound', 'text', 'Perfecto! Tenemos disponible la Suite Romántica con vista al jardín por S/280/noche. ¿Le interesa?', 'read', NOW() - INTERVAL '1 hour 45 minutes'),
    (v_conv_id, 'inbound',  'text', 'Suena muy bien! ¿Incluye desayuno?', 'delivered', NOW() - INTERVAL '30 minutes'),
    (v_conv_id, 'inbound',  'text', '¿Y tienen estacionamiento disponible?', 'delivered', NOW() - INTERVAL '20 minutes'),
    (v_conv_id, 'inbound',  'text', 'Perfecto, muchas gracias!', 'delivered', NOW() - INTERVAL '5 minutes');
END $$;
