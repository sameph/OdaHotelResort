  -- Migration: Add receipt_url to bookings table
  ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS receipt_url text;

  -- Create index for faster status and payment method querying
  CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
  CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON public.bookings(created_at DESC);

