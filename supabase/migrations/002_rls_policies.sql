-- Row Level Security (RLS) Policies
-- Ensures users can only access their own data

-- =====================================================
-- Enable RLS on all tables
-- =====================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.babies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feeding_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sleep_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diaper_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_measurements ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILES TABLE POLICIES
-- =====================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- BABIES TABLE POLICIES
-- =====================================================

-- Users can view their own babies
CREATE POLICY "Users can view own babies"
  ON public.babies
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own babies
CREATE POLICY "Users can insert own babies"
  ON public.babies
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own babies
CREATE POLICY "Users can update own babies"
  ON public.babies
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own babies
CREATE POLICY "Users can delete own babies"
  ON public.babies
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- FEEDING LOGS TABLE POLICIES
-- =====================================================

-- Users can view their own feeding logs
CREATE POLICY "Users can view own feeding logs"
  ON public.feeding_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own feeding logs
CREATE POLICY "Users can insert own feeding logs"
  ON public.feeding_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own feeding logs
CREATE POLICY "Users can update own feeding logs"
  ON public.feeding_logs
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own feeding logs
CREATE POLICY "Users can delete own feeding logs"
  ON public.feeding_logs
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- SLEEP LOGS TABLE POLICIES
-- =====================================================

-- Users can view their own sleep logs
CREATE POLICY "Users can view own sleep logs"
  ON public.sleep_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own sleep logs
CREATE POLICY "Users can insert own sleep logs"
  ON public.sleep_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own sleep logs
CREATE POLICY "Users can update own sleep logs"
  ON public.sleep_logs
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own sleep logs
CREATE POLICY "Users can delete own sleep logs"
  ON public.sleep_logs
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- DIAPER CHANGES TABLE POLICIES
-- =====================================================

-- Users can view their own diaper changes
CREATE POLICY "Users can view own diaper changes"
  ON public.diaper_changes
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own diaper changes
CREATE POLICY "Users can insert own diaper changes"
  ON public.diaper_changes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own diaper changes
CREATE POLICY "Users can update own diaper changes"
  ON public.diaper_changes
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own diaper changes
CREATE POLICY "Users can delete own diaper changes"
  ON public.diaper_changes
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- GROWTH MEASUREMENTS TABLE POLICIES
-- =====================================================

-- Users can view their own growth measurements
CREATE POLICY "Users can view own growth measurements"
  ON public.growth_measurements
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own growth measurements
CREATE POLICY "Users can insert own growth measurements"
  ON public.growth_measurements
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own growth measurements
CREATE POLICY "Users can update own growth measurements"
  ON public.growth_measurements
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own growth measurements
CREATE POLICY "Users can delete own growth measurements"
  ON public.growth_measurements
  FOR DELETE
  USING (auth.uid() = user_id);
