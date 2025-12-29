-- Create baby_invitations table for inviting caregivers who don't have accounts yet

-- =====================================================
-- BABY INVITATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.baby_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  baby_id UUID NOT NULL REFERENCES public.babies(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'expired')) DEFAULT 'pending',
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate pending invitations
  UNIQUE(baby_id, invited_email)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_baby_invitations_baby ON public.baby_invitations(baby_id);
CREATE INDEX IF NOT EXISTS idx_baby_invitations_email ON public.baby_invitations(invited_email);
CREATE INDEX IF NOT EXISTS idx_baby_invitations_token ON public.baby_invitations(token);
CREATE INDEX IF NOT EXISTS idx_baby_invitations_status ON public.baby_invitations(status);

-- Trigger for updated_at
CREATE TRIGGER update_baby_invitations_updated_at
  BEFORE UPDATE ON public.baby_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE public.baby_invitations ENABLE ROW LEVEL SECURITY;

-- Users can view invitations for babies they own
CREATE POLICY "Owners can view invitations for their babies"
  ON public.baby_invitations
  FOR SELECT
  USING (
    baby_id IN (
      SELECT baby_id FROM public.baby_caregivers
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Users can view their own pending invitations
CREATE POLICY "Users can view their own invitations"
  ON public.baby_invitations
  FOR SELECT
  USING (invited_email = (SELECT email FROM public.profiles WHERE id = auth.uid()));

-- Owners can create invitations
CREATE POLICY "Owners can create invitations"
  ON public.baby_invitations
  FOR INSERT
  WITH CHECK (
    baby_id IN (
      SELECT baby_id FROM public.baby_caregivers
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Owners can delete invitations
CREATE POLICY "Owners can delete invitations"
  ON public.baby_invitations
  FOR DELETE
  USING (
    baby_id IN (
      SELECT baby_id FROM public.baby_caregivers
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Users can update their own invitations (to accept them)
CREATE POLICY "Users can accept their own invitations"
  ON public.baby_invitations
  FOR UPDATE
  USING (invited_email = (SELECT email FROM public.profiles WHERE id = auth.uid()));

-- Comment
COMMENT ON TABLE public.baby_invitations IS 'Pending invitations for caregivers who do not have accounts yet';
