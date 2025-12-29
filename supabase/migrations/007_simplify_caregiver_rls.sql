-- Simplify baby_caregivers RLS to avoid all circular dependencies
-- For now, just allow users to see their own caregiver entries

-- Drop ALL existing SELECT policies on baby_caregivers
DROP POLICY IF EXISTS "Users can view caregivers for their babies" ON public.baby_caregivers;
DROP POLICY IF EXISTS "Users can view own caregiver entries" ON public.baby_caregivers;
DROP POLICY IF EXISTS "Users can view caregivers for accessible babies" ON public.baby_caregivers;

-- Simple policy: users can only see records where they are the user_id
-- This is enough for the app to work (fetching babies you have access to)
CREATE POLICY "Users can view own caregiver records"
  ON public.baby_caregivers
  FOR SELECT
  USING (user_id = auth.uid());
