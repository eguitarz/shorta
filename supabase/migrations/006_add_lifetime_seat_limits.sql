-- Migration: 006_add_lifetime_seat_limits.sql
-- Purpose: Track available lifetime seats (limited to 20)
-- Date: 2026-01-09

-- Create lifetime_seats table to enforce seat limits
CREATE TABLE IF NOT EXISTS public.lifetime_seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_seats INTEGER NOT NULL DEFAULT 20,
  seats_used INTEGER NOT NULL DEFAULT 0,
  last_purchase_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT valid_seat_count CHECK (seats_used >= 0 AND seats_used <= total_seats)
);

-- Initialize with 20 seats available
INSERT INTO public.lifetime_seats (total_seats, seats_used)
VALUES (20, 0)
ON CONFLICT DO NOTHING;

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_lifetime_seats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lifetime_seats_updated_at
  BEFORE UPDATE ON public.lifetime_seats
  FOR EACH ROW
  EXECUTE FUNCTION update_lifetime_seats_updated_at();

-- Function to check if lifetime seats are available
CREATE OR REPLACE FUNCTION lifetime_seats_available()
RETURNS BOOLEAN AS $$
DECLARE
  v_total INTEGER;
  v_used INTEGER;
BEGIN
  SELECT total_seats, seats_used
  INTO v_total, v_used
  FROM public.lifetime_seats
  LIMIT 1;

  RETURN v_used < v_total;
END;
$$ LANGUAGE plpgsql;

-- Function to claim a lifetime seat (atomic operation)
CREATE OR REPLACE FUNCTION claim_lifetime_seat()
RETURNS BOOLEAN AS $$
DECLARE
  v_updated BOOLEAN;
BEGIN
  UPDATE public.lifetime_seats
  SET
    seats_used = seats_used + 1,
    last_purchase_at = NOW()
  WHERE seats_used < total_seats
  RETURNING true INTO v_updated;

  RETURN COALESCE(v_updated, false);
END;
$$ LANGUAGE plpgsql;

-- Function to get remaining lifetime seats count
CREATE OR REPLACE FUNCTION get_remaining_lifetime_seats()
RETURNS INTEGER AS $$
DECLARE
  v_total INTEGER;
  v_used INTEGER;
BEGIN
  SELECT total_seats, seats_used
  INTO v_total, v_used
  FROM public.lifetime_seats
  LIMIT 1;

  RETURN COALESCE(v_total - v_used, 0);
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE public.lifetime_seats IS 'Tracks available lifetime tier seats (limited to 20 total)';
COMMENT ON FUNCTION lifetime_seats_available IS 'Check if lifetime seats are still available for purchase';
COMMENT ON FUNCTION claim_lifetime_seat IS 'Atomically claim a lifetime seat (prevents overselling with row-level locking)';
COMMENT ON FUNCTION get_remaining_lifetime_seats IS 'Get count of remaining lifetime seats';
