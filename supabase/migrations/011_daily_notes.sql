-- Create daily_notes table
CREATE TABLE IF NOT EXISTS public.daily_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  baby_id UUID NOT NULL REFERENCES public.babies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note_date DATE NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[], -- Array of tags like 'fussy', 'happy', 'milestone'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(baby_id, note_date) -- One note per baby per day
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_daily_notes_baby_id ON public.daily_notes(baby_id);
CREATE INDEX IF NOT EXISTS idx_daily_notes_date ON public.daily_notes(note_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_notes_tags ON public.daily_notes USING gin(tags);

-- Enable Row Level Security
ALTER TABLE public.daily_notes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view daily notes for their babies" ON public.daily_notes;
DROP POLICY IF EXISTS "Users can insert daily notes for their babies" ON public.daily_notes;
DROP POLICY IF EXISTS "Users can update their own daily notes" ON public.daily_notes;
DROP POLICY IF EXISTS "Users can delete their own daily notes" ON public.daily_notes;

-- RLS Policies
CREATE POLICY "Users can view daily notes for their babies"
  ON public.daily_notes
  FOR SELECT
  USING (
    baby_id IN (
      SELECT baby_id FROM public.baby_caregivers
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert daily notes for their babies"
  ON public.daily_notes
  FOR INSERT
  WITH CHECK (
    baby_id IN (
      SELECT baby_id FROM public.baby_caregivers
      WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can update their own daily notes"
  ON public.daily_notes
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own daily notes"
  ON public.daily_notes
  FOR DELETE
  USING (user_id = auth.uid());

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_daily_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_daily_notes_updated_at ON public.daily_notes;

CREATE TRIGGER update_daily_notes_updated_at
  BEFORE UPDATE ON public.daily_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_notes_updated_at();
