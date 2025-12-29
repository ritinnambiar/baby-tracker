-- Fix babies table RLS to allow caregivers to view shared babies
-- This allows caregivers to see babies they have access to via baby_caregivers table

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view own babies" ON public.babies;

-- Create new policy that allows viewing babies where user is owner OR caregiver
CREATE POLICY "Users can view accessible babies"
  ON public.babies
  FOR SELECT
  USING (
    auth.uid() = user_id  -- User is the owner
    OR
    EXISTS (  -- OR user is a caregiver
      SELECT 1 FROM public.baby_caregivers
      WHERE baby_caregivers.baby_id = babies.id
      AND baby_caregivers.user_id = auth.uid()
    )
  );

-- Similarly update policies for feeding_logs, sleep_logs, diaper_changes, growth_measurements, and pumping_logs
-- to allow caregivers to access data for shared babies

-- FEEDING LOGS
DROP POLICY IF EXISTS "Users can view own feeding logs" ON public.feeding_logs;
CREATE POLICY "Users can view accessible feeding logs"
  ON public.feeding_logs
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM public.baby_caregivers
      WHERE baby_caregivers.baby_id = feeding_logs.baby_id
      AND baby_caregivers.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own feeding logs" ON public.feeding_logs;
CREATE POLICY "Caregivers can insert feeding logs"
  ON public.feeding_logs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.baby_caregivers
      WHERE baby_caregivers.baby_id = feeding_logs.baby_id
      AND baby_caregivers.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own feeding logs" ON public.feeding_logs;
CREATE POLICY "Caregivers can update feeding logs"
  ON public.feeding_logs
  FOR UPDATE
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM public.baby_caregivers
      WHERE baby_caregivers.baby_id = feeding_logs.baby_id
      AND baby_caregivers.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own feeding logs" ON public.feeding_logs;
CREATE POLICY "Caregivers can delete feeding logs"
  ON public.feeding_logs
  FOR DELETE
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM public.baby_caregivers
      WHERE baby_caregivers.baby_id = feeding_logs.baby_id
      AND baby_caregivers.user_id = auth.uid()
    )
  );

-- SLEEP LOGS
DROP POLICY IF EXISTS "Users can view own sleep logs" ON public.sleep_logs;
CREATE POLICY "Users can view accessible sleep logs"
  ON public.sleep_logs
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM public.baby_caregivers
      WHERE baby_caregivers.baby_id = sleep_logs.baby_id
      AND baby_caregivers.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own sleep logs" ON public.sleep_logs;
CREATE POLICY "Caregivers can insert sleep logs"
  ON public.sleep_logs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.baby_caregivers
      WHERE baby_caregivers.baby_id = sleep_logs.baby_id
      AND baby_caregivers.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own sleep logs" ON public.sleep_logs;
CREATE POLICY "Caregivers can update sleep logs"
  ON public.sleep_logs
  FOR UPDATE
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM public.baby_caregivers
      WHERE baby_caregivers.baby_id = sleep_logs.baby_id
      AND baby_caregivers.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own sleep logs" ON public.sleep_logs;
CREATE POLICY "Caregivers can delete sleep logs"
  ON public.sleep_logs
  FOR DELETE
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM public.baby_caregivers
      WHERE baby_caregivers.baby_id = sleep_logs.baby_id
      AND baby_caregivers.user_id = auth.uid()
    )
  );

-- DIAPER CHANGES
DROP POLICY IF EXISTS "Users can view own diaper changes" ON public.diaper_changes;
CREATE POLICY "Users can view accessible diaper changes"
  ON public.diaper_changes
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM public.baby_caregivers
      WHERE baby_caregivers.baby_id = diaper_changes.baby_id
      AND baby_caregivers.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own diaper changes" ON public.diaper_changes;
CREATE POLICY "Caregivers can insert diaper changes"
  ON public.diaper_changes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.baby_caregivers
      WHERE baby_caregivers.baby_id = diaper_changes.baby_id
      AND baby_caregivers.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own diaper changes" ON public.diaper_changes;
CREATE POLICY "Caregivers can update diaper changes"
  ON public.diaper_changes
  FOR UPDATE
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM public.baby_caregivers
      WHERE baby_caregivers.baby_id = diaper_changes.baby_id
      AND baby_caregivers.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own diaper changes" ON public.diaper_changes;
CREATE POLICY "Caregivers can delete diaper changes"
  ON public.diaper_changes
  FOR DELETE
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM public.baby_caregivers
      WHERE baby_caregivers.baby_id = diaper_changes.baby_id
      AND baby_caregivers.user_id = auth.uid()
    )
  );

-- GROWTH MEASUREMENTS
DROP POLICY IF EXISTS "Users can view own growth measurements" ON public.growth_measurements;
CREATE POLICY "Users can view accessible growth measurements"
  ON public.growth_measurements
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM public.baby_caregivers
      WHERE baby_caregivers.baby_id = growth_measurements.baby_id
      AND baby_caregivers.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own growth measurements" ON public.growth_measurements;
CREATE POLICY "Caregivers can insert growth measurements"
  ON public.growth_measurements
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.baby_caregivers
      WHERE baby_caregivers.baby_id = growth_measurements.baby_id
      AND baby_caregivers.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own growth measurements" ON public.growth_measurements;
CREATE POLICY "Caregivers can update growth measurements"
  ON public.growth_measurements
  FOR UPDATE
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM public.baby_caregivers
      WHERE baby_caregivers.baby_id = growth_measurements.baby_id
      AND baby_caregivers.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own growth measurements" ON public.growth_measurements;
CREATE POLICY "Caregivers can delete growth measurements"
  ON public.growth_measurements
  FOR DELETE
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM public.baby_caregivers
      WHERE baby_caregivers.baby_id = growth_measurements.baby_id
      AND baby_caregivers.user_id = auth.uid()
    )
  );

-- PUMPING LOGS (if table exists)
DROP POLICY IF EXISTS "Users can view own pumping logs" ON public.pumping_logs;
CREATE POLICY "Users can view accessible pumping logs"
  ON public.pumping_logs
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM public.baby_caregivers
      WHERE baby_caregivers.baby_id = pumping_logs.baby_id
      AND baby_caregivers.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own pumping logs" ON public.pumping_logs;
CREATE POLICY "Caregivers can insert pumping logs"
  ON public.pumping_logs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.baby_caregivers
      WHERE baby_caregivers.baby_id = pumping_logs.baby_id
      AND baby_caregivers.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own pumping logs" ON public.pumping_logs;
CREATE POLICY "Caregivers can update pumping logs"
  ON public.pumping_logs
  FOR UPDATE
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM public.baby_caregivers
      WHERE baby_caregivers.baby_id = pumping_logs.baby_id
      AND baby_caregivers.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own pumping logs" ON public.pumping_logs;
CREATE POLICY "Caregivers can delete pumping logs"
  ON public.pumping_logs
  FOR DELETE
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM public.baby_caregivers
      WHERE baby_caregivers.baby_id = pumping_logs.baby_id
      AND baby_caregivers.user_id = auth.uid()
    )
  );
