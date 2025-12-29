-- Database Functions and Triggers
-- Automated behaviors for the baby tracking application

-- =====================================================
-- FUNCTION: Update updated_at timestamp
-- Automatically updates the updated_at column on row updates
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS: Apply update_updated_at to all tables
-- =====================================================

-- Profiles table trigger
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Babies table trigger
CREATE TRIGGER update_babies_updated_at
  BEFORE UPDATE ON public.babies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Feeding logs table trigger
CREATE TRIGGER update_feeding_logs_updated_at
  BEFORE UPDATE ON public.feeding_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Sleep logs table trigger
CREATE TRIGGER update_sleep_logs_updated_at
  BEFORE UPDATE ON public.sleep_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Diaper changes table trigger
CREATE TRIGGER update_diaper_changes_updated_at
  BEFORE UPDATE ON public.diaper_changes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Growth measurements table trigger
CREATE TRIGGER update_growth_measurements_updated_at
  BEFORE UPDATE ON public.growth_measurements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- FUNCTION: Handle new user registration
-- Automatically creates a profile when a new user signs up
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGER: Create profile on user signup
-- =====================================================
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- FUNCTION: Get active timers for a baby
-- Returns any active (not ended) feeding or sleep sessions
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_active_timers(p_baby_id UUID)
RETURNS TABLE (
  timer_type TEXT,
  timer_id UUID,
  started_at TIMESTAMPTZ,
  feeding_type TEXT,
  breast_side TEXT
) AS $$
BEGIN
  -- Return active feeding sessions
  RETURN QUERY
  SELECT
    'feeding'::TEXT as timer_type,
    f.id as timer_id,
    f.started_at,
    f.feeding_type,
    f.breast_side
  FROM public.feeding_logs f
  WHERE f.baby_id = p_baby_id
    AND f.ended_at IS NULL
    AND f.feeding_type = 'breast'
  ORDER BY f.started_at DESC
  LIMIT 1;

  -- Return active sleep sessions
  RETURN QUERY
  SELECT
    'sleep'::TEXT as timer_type,
    s.id as timer_id,
    s.started_at,
    NULL::TEXT as feeding_type,
    NULL::TEXT as breast_side
  FROM public.sleep_logs s
  WHERE s.baby_id = p_baby_id
    AND s.ended_at IS NULL
  ORDER BY s.started_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Get daily summary for a baby
-- Returns summary statistics for today
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_daily_summary(
  p_baby_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  total_feedings BIGINT,
  total_sleep_minutes INTEGER,
  total_diapers BIGINT,
  wet_diapers BIGINT,
  dirty_diapers BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*)
     FROM public.feeding_logs
     WHERE baby_id = p_baby_id
       AND DATE(started_at) = p_date) as total_feedings,

    (SELECT COALESCE(SUM(duration_minutes), 0)::INTEGER
     FROM public.sleep_logs
     WHERE baby_id = p_baby_id
       AND DATE(started_at) = p_date
       AND ended_at IS NOT NULL) as total_sleep_minutes,

    (SELECT COUNT(*)
     FROM public.diaper_changes
     WHERE baby_id = p_baby_id
       AND DATE(changed_at) = p_date) as total_diapers,

    (SELECT COUNT(*)
     FROM public.diaper_changes
     WHERE baby_id = p_baby_id
       AND DATE(changed_at) = p_date
       AND is_wet = true) as wet_diapers,

    (SELECT COUNT(*)
     FROM public.diaper_changes
     WHERE baby_id = p_baby_id
       AND DATE(changed_at) = p_date
       AND is_dirty = true) as dirty_diapers;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Comments for documentation
-- =====================================================
COMMENT ON FUNCTION public.update_updated_at_column() IS 'Automatically updates updated_at timestamp on row updates';
COMMENT ON FUNCTION public.handle_new_user() IS 'Creates profile entry when new user signs up';
COMMENT ON FUNCTION public.get_active_timers(UUID) IS 'Returns active feeding or sleep timers for a baby';
COMMENT ON FUNCTION public.get_daily_summary(UUID, DATE) IS 'Returns daily activity summary for a baby';
