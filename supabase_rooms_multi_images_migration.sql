-- Migration: Enable multi-picture support for rooms
-- Run this in the Supabase SQL Editor

-- 1. Add images array column to public.rooms if it doesn't already exist
ALTER TABLE public.rooms 
  ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}';

-- 2. Backfill existing rooms that have image_url so they populate images[0]
UPDATE public.rooms
SET images = ARRAY[image_url]
WHERE (images IS NULL OR cardinality(images) = 0)
  AND image_url IS NOT NULL
  AND image_url <> '';

-- 3. Reload PostgREST schema cache
NOTIFY pgrst, reload_schema;

