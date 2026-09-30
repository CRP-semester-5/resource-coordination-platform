-- 1. Add handover_pin to requests table
ALTER TABLE requests 
ADD COLUMN IF NOT EXISTS handover_pin VARCHAR(6) DEFAULT LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0');

-- 2. Add handover_pin to donations table
ALTER TABLE donations 
ADD COLUMN IF NOT EXISTS handover_pin VARCHAR(6) DEFAULT LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0');

-- 3. Populate existing rows with random 4-digit PINs if null
UPDATE requests 
SET handover_pin = LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0') 
WHERE handover_pin IS NULL;

UPDATE donations 
SET handover_pin = LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0') 
WHERE handover_pin IS NULL;
