-- Fix baby_caregivers SELECT policy properly to avoid circular dependencies
-- Migration 016 caused circular dependencies by querying baby_caregivers within the policy
-- This uses the has_baby_access function with SECURITY DEFINER to bypass RLS safely

-- Drop the broken policy
DROP POLICY IF EXISTS "Users can view caregivers for their babies" ON public.baby_caregivers;

-- Use the has_baby_access function which has SECURITY DEFINER to bypass RLS
-- This avoids circular dependencies while still allowing users to see all caregivers
CREATE POLICY "Users can view caregivers for accessible babies"
  ON public.baby_caregivers
  FOR SELECT
  USING (has_baby_access(baby_id));
