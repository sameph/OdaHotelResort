-- Migration: Add room inventory quantities and support for 5 categories:
-- Standard, Twin, Suite, Family, and King rooms.
--
-- Run this in the Supabase SQL Editor.

-- 1. Add quantity (total rooms in this category) and available_quantity (available for booking)
ALTER TABLE public.rooms 
  ADD COLUMN IF NOT EXISTS quantity integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS available_quantity integer NOT NULL DEFAULT 1;

-- 2. Add constraints ensuring quantities cannot be negative
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'rooms_quantity_check'
  ) THEN
    ALTER TABLE public.rooms ADD CONSTRAINT rooms_quantity_check CHECK (quantity >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'rooms_available_quantity_check'
  ) THEN
    ALTER TABLE public.rooms ADD CONSTRAINT rooms_available_quantity_check CHECK (available_quantity >= 0);
  END IF;
END $$;

-- 3. Synchronize existing records: if marked 'occupied', available_quantity is 0; otherwise available = quantity
UPDATE public.rooms
SET available_quantity = CASE 
  WHEN status = 'occupied' THEN 0 
  ELSE COALESCE(available_quantity, quantity, 1) 
END;

-- 4. Automatically keep status in sync: if available_quantity = 0, status is 'occupied'
UPDATE public.rooms
SET status = 'occupied'
WHERE available_quantity <= 0 AND status = 'available';

-- 5. Reload PostgREST schema cache immediately
NOTIFY pgrst, reload_schema;

