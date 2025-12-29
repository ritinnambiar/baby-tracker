-- Add pumping_logs table for tracking breast milk pumping sessions
-- This migration adds support for tracking pumping sessions

-- =====================================================
-- PUMPING LOGS TABLE
-- Tracks breast milk pumping sessions
-- =====================================================
CREATE TABLE IF NOT EXISTS public.pumping_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  baby_id UUID NOT NULL REFERENCES public.babies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,

  -- Amounts from each breast
  left_amount_ml DECIMAL(6,2),
  right_amount_ml DECIMAL(6,2),

  -- Total amount (generated column)
  total_amount_ml DECIMAL(6,2) GENERATED ALWAYS AS (
    COALESCE(left_amount_ml, 0) + COALESCE(right_amount_ml, 0)
  ) STORED,

  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- At least one amount must be specified
  CONSTRAINT at_least_one_amount CHECK (
    left_amount_ml IS NOT NULL OR right_amount_ml IS NOT NULL
  ),

  -- Valid session duration
  CONSTRAINT valid_pumping_duration CHECK (
    ended_at IS NULL OR ended_at > started_at
  )
);

-- Indexes for pumping_logs table
CREATE INDEX IF NOT EXISTS idx_pumping_logs_baby ON public.pumping_logs(baby_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_pumping_logs_user ON public.pumping_logs(user_id);

-- Add updated_at trigger
CREATE TRIGGER update_pumping_logs_updated_at
  BEFORE UPDATE ON public.pumping_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE public.pumping_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own pumping logs
CREATE POLICY "Users can view own pumping logs"
  ON public.pumping_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own pumping logs
CREATE POLICY "Users can insert own pumping logs"
  ON public.pumping_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own pumping logs
CREATE POLICY "Users can update own pumping logs"
  ON public.pumping_logs
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own pumping logs
CREATE POLICY "Users can delete own pumping logs"
  ON public.pumping_logs
  FOR DELETE
  USING (auth.uid() = user_id);

-- Comment
COMMENT ON TABLE public.pumping_logs IS 'Breast milk pumping sessions';
