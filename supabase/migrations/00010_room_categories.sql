-- Add category and checklist to rooms
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS category text DEFAULT 'estandar';
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS checklist jsonb DEFAULT '{}';

-- Add preferences and notes to guests
ALTER TABLE guests ADD COLUMN IF NOT EXISTS preferences text;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS internal_notes text;

-- Seed Hotel Dionys rooms 101-515 with categories
DO $$
DECLARE
  b_id uuid;
BEGIN
  SELECT id INTO b_id FROM businesses WHERE slug = 'hotel' LIMIT 1;
  IF b_id IS NULL THEN RETURN; END IF;

  -- Floor 1: 101-109 (Suites)
  INSERT INTO rooms (business_id, number, type, category, capacity, price_per_night) VALUES
    (b_id,'101','suite','suite_queen',2,180.00),
    (b_id,'102','suite','suite_queen',2,180.00),
    (b_id,'103','suite','suite_queen',2,180.00),
    (b_id,'104','suite','suite_doble',3,220.00),
    (b_id,'105','suite','suite_romantica',2,200.00),
    (b_id,'106','suite','suite_queen',2,180.00),
    (b_id,'107','suite','suite_queen',2,180.00),
    (b_id,'108','suite','suite_doble',3,220.00),
    (b_id,'109','suite','suite_romantica',2,200.00)
  ON CONFLICT (business_id, number) DO UPDATE
    SET category = EXCLUDED.category, type = EXCLUDED.type, capacity = EXCLUDED.capacity;

  -- Floor 2: 201-215
  INSERT INTO rooms (business_id, number, type, category, capacity, price_per_night) VALUES
    (b_id,'201','estandar','ejecutiva',2,120.00),
    (b_id,'202','doble','familiar_doble',3,150.00),
    (b_id,'203','estandar','ejecutiva',2,120.00),
    (b_id,'204','estandar','ejecutiva',2,120.00),
    (b_id,'205','estandar','estandar',2,100.00),
    (b_id,'206','estandar','estandar',2,100.00),
    (b_id,'207','estandar','estandar',2,100.00),
    (b_id,'208','estandar','estandar',2,100.00),
    (b_id,'209','estandar','estandar',2,100.00),
    (b_id,'210','estandar','estandar',2,100.00),
    (b_id,'211','estandar','ejecutiva',2,120.00),
    (b_id,'212','estandar','ejecutiva',2,120.00),
    (b_id,'213','estandar','estandar',2,100.00),
    (b_id,'214','estandar','estandar',2,100.00),
    (b_id,'215','doble','familiar_doble',3,150.00)
  ON CONFLICT (business_id, number) DO UPDATE
    SET category = EXCLUDED.category, type = EXCLUDED.type, capacity = EXCLUDED.capacity;

  -- Floor 3: 301-315
  INSERT INTO rooms (business_id, number, type, category, capacity, price_per_night) VALUES
    (b_id,'301','estandar','ejecutiva',2,120.00),
    (b_id,'302','doble','familiar_doble',3,150.00),
    (b_id,'303','estandar','estandar',2,100.00),
    (b_id,'304','estandar','estandar',2,100.00),
    (b_id,'305','estandar','estandar',2,100.00),
    (b_id,'306','doble','familiar_doble',3,150.00),
    (b_id,'307','estandar','estandar',2,100.00),
    (b_id,'308','estandar','estandar',2,100.00),
    (b_id,'309','estandar','estandar',2,100.00),
    (b_id,'310','estandar','estandar',2,100.00),
    (b_id,'311','estandar','ejecutiva',2,120.00),
    (b_id,'312','estandar','ejecutiva',2,120.00),
    (b_id,'313','estandar','estandar',2,100.00),
    (b_id,'314','estandar','estandar',2,100.00),
    (b_id,'315','triple','familiar_triple',4,180.00)
  ON CONFLICT (business_id, number) DO UPDATE
    SET category = EXCLUDED.category, type = EXCLUDED.type, capacity = EXCLUDED.capacity;

  -- Floor 4: 401-415
  INSERT INTO rooms (business_id, number, type, category, capacity, price_per_night) VALUES
    (b_id,'401','estandar','ejecutiva',2,120.00),
    (b_id,'402','doble','familiar_doble',3,150.00),
    (b_id,'403','estandar','estandar',2,100.00),
    (b_id,'404','estandar','estandar',2,100.00),
    (b_id,'405','estandar','estandar',2,100.00),
    (b_id,'406','doble','familiar_doble',3,150.00),
    (b_id,'407','estandar','estandar',2,100.00),
    (b_id,'408','estandar','estandar',2,100.00),
    (b_id,'409','estandar','estandar',2,100.00),
    (b_id,'410','estandar','estandar',2,100.00),
    (b_id,'411','estandar','ejecutiva',2,120.00),
    (b_id,'412','estandar','ejecutiva',2,120.00),
    (b_id,'413','estandar','estandar',2,100.00),
    (b_id,'414','estandar','estandar',2,100.00),
    (b_id,'415','doble','familiar_doble',3,150.00)
  ON CONFLICT (business_id, number) DO UPDATE
    SET category = EXCLUDED.category, type = EXCLUDED.type, capacity = EXCLUDED.capacity;

  -- Floor 5: 501-515
  INSERT INTO rooms (business_id, number, type, category, capacity, price_per_night) VALUES
    (b_id,'501','estandar','ejecutiva',2,120.00),
    (b_id,'502','doble','familiar_doble',3,150.00),
    (b_id,'503','estandar','estandar',2,100.00),
    (b_id,'504','estandar','estandar',2,100.00),
    (b_id,'505','estandar','estandar',2,100.00),
    (b_id,'506','estandar','estandar',2,100.00),
    (b_id,'507','estandar','estandar',2,100.00),
    (b_id,'508','estandar','estandar',2,100.00),
    (b_id,'509','estandar','estandar',2,100.00),
    (b_id,'510','estandar','estandar',2,100.00),
    (b_id,'511','estandar','ejecutiva',2,120.00),
    (b_id,'512','estandar','ejecutiva',2,120.00),
    (b_id,'513','estandar','estandar',2,100.00),
    (b_id,'514','estandar','estandar',2,100.00),
    (b_id,'515','doble','familiar_doble',3,150.00)
  ON CONFLICT (business_id, number) DO UPDATE
    SET category = EXCLUDED.category, type = EXCLUDED.type, capacity = EXCLUDED.capacity;

END $$;
