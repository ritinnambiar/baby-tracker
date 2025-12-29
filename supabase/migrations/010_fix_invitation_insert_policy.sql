-- Fix baby_caregivers INSERT policy to allow invited users to add themselves
-- The current policy only allows owners to add caregivers, but invited users need to add themselves

-- Drop the restrictive INSERT policy
DROP POLICY IF EXISTS "Owners can add caregivers" ON public.baby_caregivers;

-- Create new policy that allows:
-- 1. Owners to add caregivers to their babies
-- 2. Invited users to add themselves when they have a valid pending invitation
CREATE POLICY "Owners and invited users can add caregivers"
  ON public.baby_caregivers
  FOR INSERT
  WITH CHECK (
    -- User is owner adding a caregiver
    baby_id IN (
      SELECT baby_id FROM public.baby_caregivers
      WHERE user_id = auth.uid() AND role = 'owner'
    )
    OR
    -- User is adding themselves as caregiver with a valid invitation
    (
      user_id = auth.uid()
      AND role = 'caregiver'
      AND EXISTS (
        SELECT 1 FROM public.baby_invitations
        WHERE baby_invitations.baby_id = baby_caregivers.baby_id
        AND baby_invitations.invited_email = (
          SELECT email FROM public.profiles WHERE id = auth.uid()
        )
        AND baby_invitations.status = 'pending'
        AND baby_invitations.expires_at > NOW()
      )
    )
  );
