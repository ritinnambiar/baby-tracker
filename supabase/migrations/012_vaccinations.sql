-- Create vaccinations table
CREATE TABLE IF NOT EXISTS public.vaccinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  baby_id UUID NOT NULL REFERENCES public.babies(id) ON DELETE CASCADE,
  vaccine_name TEXT NOT NULL,
  age_months INTEGER NOT NULL, -- Recommended age in months
  administered_date DATE,
  notes TEXT,
  batch_number TEXT,
  administered_by TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_vaccinations_baby_id ON public.vaccinations(baby_id);
CREATE INDEX IF NOT EXISTS idx_vaccinations_age ON public.vaccinations(age_months);
CREATE INDEX IF NOT EXISTS idx_vaccinations_completed ON public.vaccinations(is_completed);

-- Enable Row Level Security
ALTER TABLE public.vaccinations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view vaccinations for their babies" ON public.vaccinations;
DROP POLICY IF EXISTS "Users can insert vaccinations for their babies" ON public.vaccinations;
DROP POLICY IF EXISTS "Users can update vaccinations for their babies" ON public.vaccinations;
DROP POLICY IF EXISTS "Users can delete vaccinations for their babies" ON public.vaccinations;

-- RLS Policies
CREATE POLICY "Users can view vaccinations for their babies"
  ON public.vaccinations
  FOR SELECT
  USING (
    baby_id IN (
      SELECT baby_id FROM public.baby_caregivers
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert vaccinations for their babies"
  ON public.vaccinations
  FOR INSERT
  WITH CHECK (
    baby_id IN (
      SELECT baby_id FROM public.baby_caregivers
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update vaccinations for their babies"
  ON public.vaccinations
  FOR UPDATE
  USING (
    baby_id IN (
      SELECT baby_id FROM public.baby_caregivers
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete vaccinations for their babies"
  ON public.vaccinations
  FOR DELETE
  USING (
    baby_id IN (
      SELECT baby_id FROM public.baby_caregivers
      WHERE user_id = auth.uid()
    )
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_vaccinations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_vaccinations_updated_at ON public.vaccinations;

CREATE TRIGGER update_vaccinations_updated_at
  BEFORE UPDATE ON public.vaccinations
  FOR EACH ROW
  EXECUTE FUNCTION update_vaccinations_updated_at();
