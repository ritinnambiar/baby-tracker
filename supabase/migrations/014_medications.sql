-- Create medications table for tracking baby medications and health records
CREATE TABLE IF NOT EXISTS public.medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  baby_id UUID NOT NULL REFERENCES public.babies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  dosage TEXT,
  unit TEXT, -- e.g., ml, mg, drops
  frequency TEXT, -- e.g., "twice daily", "every 6 hours"
  start_date DATE NOT NULL,
  end_date DATE,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create medication_logs table for tracking when medications are given
CREATE TABLE IF NOT EXISTS public.medication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  baby_id UUID NOT NULL REFERENCES public.babies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  administered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dosage_given TEXT NOT NULL,
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_medications_baby_id ON public.medications(baby_id);
CREATE INDEX IF NOT EXISTS idx_medications_active ON public.medications(is_active);
CREATE INDEX IF NOT EXISTS idx_medication_logs_medication_id ON public.medication_logs(medication_id);
CREATE INDEX IF NOT EXISTS idx_medication_logs_baby_id ON public.medication_logs(baby_id);
CREATE INDEX IF NOT EXISTS idx_medication_logs_administered_at ON public.medication_logs(administered_at);

-- Enable Row Level Security
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for medications
CREATE POLICY "Users can view medications for their babies"
  ON public.medications
  FOR SELECT
  USING (
    baby_id IN (
      SELECT baby_id FROM public.baby_caregivers
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert medications for their babies"
  ON public.medications
  FOR INSERT
  WITH CHECK (
    baby_id IN (
      SELECT baby_id FROM public.baby_caregivers
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update medications for their babies"
  ON public.medications
  FOR UPDATE
  USING (
    baby_id IN (
      SELECT baby_id FROM public.baby_caregivers
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete medications for their babies"
  ON public.medications
  FOR DELETE
  USING (
    baby_id IN (
      SELECT baby_id FROM public.baby_caregivers
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for medication_logs
CREATE POLICY "Users can view medication logs for their babies"
  ON public.medication_logs
  FOR SELECT
  USING (
    baby_id IN (
      SELECT baby_id FROM public.baby_caregivers
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert medication logs for their babies"
  ON public.medication_logs
  FOR INSERT
  WITH CHECK (
    baby_id IN (
      SELECT baby_id FROM public.baby_caregivers
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update medication logs for their babies"
  ON public.medication_logs
  FOR UPDATE
  USING (
    baby_id IN (
      SELECT baby_id FROM public.baby_caregivers
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete medication logs for their babies"
  ON public.medication_logs
  FOR DELETE
  USING (
    baby_id IN (
      SELECT baby_id FROM public.baby_caregivers
      WHERE user_id = auth.uid()
    )
  );

-- Triggers to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_medications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_medication_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_medications_updated_at ON public.medications;
DROP TRIGGER IF EXISTS update_medication_logs_updated_at ON public.medication_logs;

CREATE TRIGGER update_medications_updated_at
  BEFORE UPDATE ON public.medications
  FOR EACH ROW
  EXECUTE FUNCTION update_medications_updated_at();

CREATE TRIGGER update_medication_logs_updated_at
  BEFORE UPDATE ON public.medication_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_medication_logs_updated_at();
