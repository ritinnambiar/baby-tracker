-- Create milestones table for tracking baby developmental milestones
CREATE TABLE IF NOT EXISTS public.milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  baby_id UUID NOT NULL REFERENCES public.babies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  milestone_title TEXT NOT NULL,
  milestone_category TEXT NOT NULL, -- physical, cognitive, social, language
  achieved_date DATE, -- Nullable - null means not yet achieved
  age_months INTEGER, -- Age when milestone achieved
  description TEXT,
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_milestones_baby_id ON public.milestones(baby_id);
CREATE INDEX IF NOT EXISTS idx_milestones_category ON public.milestones(milestone_category);
CREATE INDEX IF NOT EXISTS idx_milestones_achieved_date ON public.milestones(achieved_date);

-- Enable Row Level Security
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view milestones for their babies" ON public.milestones;
DROP POLICY IF EXISTS "Users can insert milestones for their babies" ON public.milestones;
DROP POLICY IF EXISTS "Users can update milestones for their babies" ON public.milestones;
DROP POLICY IF EXISTS "Users can delete milestones for their babies" ON public.milestones;

-- RLS Policies
CREATE POLICY "Users can view milestones for their babies"
  ON public.milestones
  FOR SELECT
  USING (
    baby_id IN (
      SELECT baby_id FROM public.baby_caregivers
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert milestones for their babies"
  ON public.milestones
  FOR INSERT
  WITH CHECK (
    baby_id IN (
      SELECT baby_id FROM public.baby_caregivers
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update milestones for their babies"
  ON public.milestones
  FOR UPDATE
  USING (
    baby_id IN (
      SELECT baby_id FROM public.baby_caregivers
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete milestones for their babies"
  ON public.milestones
  FOR DELETE
  USING (
    baby_id IN (
      SELECT baby_id FROM public.baby_caregivers
      WHERE user_id = auth.uid()
    )
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_milestones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_milestones_updated_at ON public.milestones;

CREATE TRIGGER update_milestones_updated_at
  BEFORE UPDATE ON public.milestones
  FOR EACH ROW
  EXECUTE FUNCTION update_milestones_updated_at();
