-- Add baby_caregivers table to enable shared access between multiple users
-- This allows spouses/caregivers to access the same baby's data

-- =====================================================
-- BABY CAREGIVERS TABLE
-- Junction table for many-to-many relationship between users and babies
-- =====================================================
CREATE TABLE IF NOT EXISTS public.baby_caregivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  baby_id UUID NOT NULL REFERENCES public.babies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'caregiver')),
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  added_by UUID REFERENCES public.profiles(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate caregiver entries
  UNIQUE(baby_id, user_id)
);

-- Indexes for baby_caregivers table
CREATE INDEX IF NOT EXISTS idx_baby_caregivers_baby ON public.baby_caregivers(baby_id);
CREATE INDEX IF NOT EXISTS idx_baby_caregivers_user ON public.baby_caregivers(user_id);

-- Add updated_at trigger
CREATE TRIGGER update_baby_caregivers_updated_at
  BEFORE UPDATE ON public.baby_caregivers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE public.baby_caregivers ENABLE ROW LEVEL SECURITY;

-- Users can view caregivers for babies they have access to
CREATE POLICY "Users can view caregivers for their babies"
  ON public.baby_caregivers
  FOR SELECT
  USING (
    baby_id IN (
      SELECT baby_id FROM public.baby_caregivers WHERE user_id = auth.uid()
    )
  );

-- Users can add caregivers to babies they own
CREATE POLICY "Owners can add caregivers"
  ON public.baby_caregivers
  FOR INSERT
  WITH CHECK (
    baby_id IN (
      SELECT baby_id FROM public.baby_caregivers
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Users can remove caregivers from babies they own
CREATE POLICY "Owners can remove caregivers"
  ON public.baby_caregivers
  FOR DELETE
  USING (
    baby_id IN (
      SELECT baby_id FROM public.baby_caregivers
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- =====================================================
-- UPDATE EXISTING RLS POLICIES TO SUPPORT SHARED ACCESS
-- Drop old policies and create new ones that check baby_caregivers
-- =====================================================

-- Helper function to check if user has access to a baby
CREATE OR REPLACE FUNCTION has_baby_access(check_baby_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.baby_caregivers
    WHERE baby_id = check_baby_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- BABIES TABLE - Update RLS
-- =====================================================

DROP POLICY IF EXISTS "Users can view own babies" ON public.babies;
DROP POLICY IF EXISTS "Users can insert own babies" ON public.babies;
DROP POLICY IF EXISTS "Users can update own babies" ON public.babies;
DROP POLICY IF EXISTS "Users can delete own babies" ON public.babies;

CREATE POLICY "Users can view babies they have access to"
  ON public.babies
  FOR SELECT
  USING (has_baby_access(id));

CREATE POLICY "Users can insert own babies"
  ON public.babies
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owners can update their babies"
  ON public.babies
  FOR UPDATE
  USING (
    id IN (
      SELECT baby_id FROM public.baby_caregivers
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Owners can delete their babies"
  ON public.babies
  FOR DELETE
  USING (
    id IN (
      SELECT baby_id FROM public.baby_caregivers
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- =====================================================
-- FEEDING LOGS - Update RLS
-- =====================================================

DROP POLICY IF EXISTS "Users can view own feeding logs" ON public.feeding_logs;
DROP POLICY IF EXISTS "Users can insert own feeding logs" ON public.feeding_logs;
DROP POLICY IF EXISTS "Users can update own feeding logs" ON public.feeding_logs;
DROP POLICY IF EXISTS "Users can delete own feeding logs" ON public.feeding_logs;

CREATE POLICY "Users can view feeding logs for their babies"
  ON public.feeding_logs
  FOR SELECT
  USING (has_baby_access(baby_id));

CREATE POLICY "Users can insert feeding logs for their babies"
  ON public.feeding_logs
  FOR INSERT
  WITH CHECK (has_baby_access(baby_id));

CREATE POLICY "Users can update feeding logs for their babies"
  ON public.feeding_logs
  FOR UPDATE
  USING (has_baby_access(baby_id));

CREATE POLICY "Users can delete feeding logs for their babies"
  ON public.feeding_logs
  FOR DELETE
  USING (has_baby_access(baby_id));

-- =====================================================
-- PUMPING LOGS - Update RLS
-- =====================================================

DROP POLICY IF EXISTS "Users can view own pumping logs" ON public.pumping_logs;
DROP POLICY IF EXISTS "Users can insert own pumping logs" ON public.pumping_logs;
DROP POLICY IF EXISTS "Users can update own pumping logs" ON public.pumping_logs;
DROP POLICY IF EXISTS "Users can delete own pumping logs" ON public.pumping_logs;

CREATE POLICY "Users can view pumping logs for their babies"
  ON public.pumping_logs
  FOR SELECT
  USING (has_baby_access(baby_id));

CREATE POLICY "Users can insert pumping logs for their babies"
  ON public.pumping_logs
  FOR INSERT
  WITH CHECK (has_baby_access(baby_id));

CREATE POLICY "Users can update pumping logs for their babies"
  ON public.pumping_logs
  FOR UPDATE
  USING (has_baby_access(baby_id));

CREATE POLICY "Users can delete pumping logs for their babies"
  ON public.pumping_logs
  FOR DELETE
  USING (has_baby_access(baby_id));

-- =====================================================
-- SLEEP LOGS - Update RLS
-- =====================================================

DROP POLICY IF EXISTS "Users can view own sleep logs" ON public.sleep_logs;
DROP POLICY IF EXISTS "Users can insert own sleep logs" ON public.sleep_logs;
DROP POLICY IF EXISTS "Users can update own sleep logs" ON public.sleep_logs;
DROP POLICY IF EXISTS "Users can delete own sleep logs" ON public.sleep_logs;

CREATE POLICY "Users can view sleep logs for their babies"
  ON public.sleep_logs
  FOR SELECT
  USING (has_baby_access(baby_id));

CREATE POLICY "Users can insert sleep logs for their babies"
  ON public.sleep_logs
  FOR INSERT
  WITH CHECK (has_baby_access(baby_id));

CREATE POLICY "Users can update sleep logs for their babies"
  ON public.sleep_logs
  FOR UPDATE
  USING (has_baby_access(baby_id));

CREATE POLICY "Users can delete sleep logs for their babies"
  ON public.sleep_logs
  FOR DELETE
  USING (has_baby_access(baby_id));

-- =====================================================
-- DIAPER CHANGES - Update RLS
-- =====================================================

DROP POLICY IF EXISTS "Users can view own diaper changes" ON public.diaper_changes;
DROP POLICY IF EXISTS "Users can insert own diaper changes" ON public.diaper_changes;
DROP POLICY IF EXISTS "Users can update own diaper changes" ON public.diaper_changes;
DROP POLICY IF EXISTS "Users can delete own diaper changes" ON public.diaper_changes;

CREATE POLICY "Users can view diaper changes for their babies"
  ON public.diaper_changes
  FOR SELECT
  USING (has_baby_access(baby_id));

CREATE POLICY "Users can insert diaper changes for their babies"
  ON public.diaper_changes
  FOR INSERT
  WITH CHECK (has_baby_access(baby_id));

CREATE POLICY "Users can update diaper changes for their babies"
  ON public.diaper_changes
  FOR UPDATE
  USING (has_baby_access(baby_id));

CREATE POLICY "Users can delete diaper changes for their babies"
  ON public.diaper_changes
  FOR DELETE
  USING (has_baby_access(baby_id));

-- =====================================================
-- GROWTH MEASUREMENTS - Update RLS
-- =====================================================

DROP POLICY IF EXISTS "Users can view own growth measurements" ON public.growth_measurements;
DROP POLICY IF EXISTS "Users can insert own growth measurements" ON public.growth_measurements;
DROP POLICY IF EXISTS "Users can update own growth measurements" ON public.growth_measurements;
DROP POLICY IF EXISTS "Users can delete own growth measurements" ON public.growth_measurements;

CREATE POLICY "Users can view growth measurements for their babies"
  ON public.growth_measurements
  FOR SELECT
  USING (has_baby_access(baby_id));

CREATE POLICY "Users can insert growth measurements for their babies"
  ON public.growth_measurements
  FOR INSERT
  WITH CHECK (has_baby_access(baby_id));

CREATE POLICY "Users can update growth measurements for their babies"
  ON public.growth_measurements
  FOR UPDATE
  USING (has_baby_access(baby_id));

CREATE POLICY "Users can delete growth measurements for their babies"
  ON public.growth_measurements
  FOR DELETE
  USING (has_baby_access(baby_id));

-- =====================================================
-- TRIGGER: Auto-add owner as caregiver when baby is created
-- =====================================================

CREATE OR REPLACE FUNCTION add_owner_as_caregiver()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.baby_caregivers (baby_id, user_id, role, added_by)
  VALUES (NEW.id, NEW.user_id, 'owner', NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER auto_add_owner_as_caregiver
  AFTER INSERT ON public.babies
  FOR EACH ROW
  EXECUTE FUNCTION add_owner_as_caregiver();

-- =====================================================
-- BACKFILL: Add existing baby owners to baby_caregivers
-- This ensures all existing babies have their owners in the caregivers table
-- =====================================================

INSERT INTO public.baby_caregivers (baby_id, user_id, role, added_by)
SELECT id, user_id, 'owner', user_id
FROM public.babies
WHERE id NOT IN (SELECT baby_id FROM public.baby_caregivers)
ON CONFLICT (baby_id, user_id) DO NOTHING;

-- Comment
COMMENT ON TABLE public.baby_caregivers IS 'Junction table for shared baby access between multiple users (caregivers)';
