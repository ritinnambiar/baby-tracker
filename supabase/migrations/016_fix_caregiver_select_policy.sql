-- Fix baby_caregivers SELECT policy to allow users to see all caregivers for their babies
-- The current policy (from migration 007) only allows users to see their own records
-- This prevents users from seeing other caregivers in the CaregiverManager component

-- Drop the overly restrictive policy
DROP POLICY IF EXISTS "Users can view own caregiver records" ON public.baby_caregivers;

-- Restore the original policy that allows users to see all caregivers for babies they have access to
-- This uses a subquery to find all baby_ids the user has access to
CREATE POLICY "Users can view caregivers for their babies"
  ON public.baby_caregivers
  FOR SELECT
  USING (
    baby_id IN (
      SELECT baby_id FROM public.baby_caregivers WHERE user_id = auth.uid()
    )
  );
