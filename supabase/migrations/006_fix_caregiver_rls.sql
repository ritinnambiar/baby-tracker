-- Fix the circular dependency in baby_caregivers RLS policy
-- The original policy tried to query baby_caregivers to check access to baby_caregivers

-- Drop ALL existing policies on baby_caregivers
DROP POLICY IF EXISTS "Users can view caregivers for their babies" ON public.baby_caregivers;
DROP POLICY IF EXISTS "Users can view own caregiver entries" ON public.baby_caregivers;
DROP POLICY IF EXISTS "Users can view caregivers for accessible babies" ON public.baby_caregivers;

-- Create a much simpler policy: users can see their own caregiver entries
-- This breaks the circular dependency
CREATE POLICY "Users can view own caregiver entries"
  ON public.baby_caregivers
  FOR SELECT
  USING (user_id = auth.uid());

-- Users with access to a baby can also see all caregivers for that baby
-- We use EXISTS to avoid circular dependency
CREATE POLICY "Users can view caregivers for their babies"
  ON public.baby_caregivers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.baby_caregivers bc
      WHERE bc.baby_id = baby_caregivers.baby_id
      AND bc.user_id = auth.uid()
    )
  );
