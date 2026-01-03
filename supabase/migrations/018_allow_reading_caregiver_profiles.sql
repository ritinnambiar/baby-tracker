-- Allow users to read profiles of other caregivers for babies they have access to
-- This fixes the "Unknown" name issue in the CaregiverManager component

-- Helper function to check if a user can see a profile (SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION can_view_profile(profile_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    -- User can see their own profile
    profile_id = auth.uid()
    OR
    -- User can see profiles of caregivers for babies they have access to
    EXISTS (
      SELECT 1
      FROM public.baby_caregivers bc1
      INNER JOIN public.baby_caregivers bc2 ON bc1.baby_id = bc2.baby_id
      WHERE bc1.user_id = auth.uid()
        AND bc2.user_id = profile_id
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Add new policy using the SECURITY DEFINER function
CREATE POLICY "Users can view profiles of caregivers for their babies"
  ON public.profiles
  FOR SELECT
  USING (can_view_profile(id));
