-- Baby Tracker Database Schema
-- This migration creates all the core tables for the baby tracking application

-- =====================================================
-- 1. PROFILES TABLE
-- Stores user profile information (extends auth.users)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 2. BABIES TABLE
-- Stores information about babies being tracked
-- =====================================================
CREATE TABLE IF NOT EXISTS public.babies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  photo_url TEXT,
  birth_weight DECIMAL(5,2), -- in kg
  birth_height DECIMAL(5,2), -- in cm
  birth_head_circumference DECIMAL(5,2), -- in cm
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_dob CHECK (date_of_birth <= CURRENT_DATE)
);

-- Indexes for babies table
CREATE INDEX IF NOT EXISTS idx_babies_user_id ON public.babies(user_id);
CREATE INDEX IF NOT EXISTS idx_babies_active ON public.babies(user_id, is_active);

-- =====================================================
-- 3. FEEDING LOGS TABLE
-- Tracks both bottle and breast feeding sessions
-- =====================================================
CREATE TABLE IF NOT EXISTS public.feeding_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  baby_id UUID NOT NULL REFERENCES public.babies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Type: 'bottle' or 'breast'
  feeding_type TEXT NOT NULL CHECK (feeding_type IN ('bottle', 'breast')),

  -- Bottle feeding fields
  amount_ml DECIMAL(6,2), -- amount in ml

  -- Breast feeding fields
  breast_side TEXT CHECK (breast_side IN ('left', 'right', 'both')),
  left_duration_minutes INTEGER, -- duration on left breast
  right_duration_minutes INTEGER, -- duration on right breast

  -- Common fields
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Validation constraints
  CONSTRAINT bottle_has_amount CHECK (
    feeding_type != 'bottle' OR amount_ml IS NOT NULL
  ),
  CONSTRAINT breast_has_side CHECK (
    feeding_type != 'breast' OR breast_side IS NOT NULL
  )
);

-- Indexes for feeding_logs table
CREATE INDEX IF NOT EXISTS idx_feeding_logs_baby ON public.feeding_logs(baby_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_feeding_logs_user ON public.feeding_logs(user_id);

-- =====================================================
-- 4. SLEEP LOGS TABLE
-- Tracks sleep sessions (naps and night sleep)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.sleep_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  baby_id UUID NOT NULL REFERENCES public.babies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  sleep_type TEXT NOT NULL CHECK (sleep_type IN ('nap', 'night')),
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER GENERATED ALWAYS AS (
    CASE
      WHEN ended_at IS NOT NULL THEN
        EXTRACT(EPOCH FROM (ended_at - started_at))::INTEGER / 60
      ELSE NULL
    END
  ) STORED,
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_sleep_duration CHECK (
    ended_at IS NULL OR ended_at > started_at
  )
);

-- Indexes for sleep_logs table
CREATE INDEX IF NOT EXISTS idx_sleep_logs_baby ON public.sleep_logs(baby_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sleep_logs_user ON public.sleep_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sleep_logs_active ON public.sleep_logs(baby_id) WHERE ended_at IS NULL;

-- =====================================================
-- 5. DIAPER CHANGES TABLE
-- Tracks diaper changes (wet/dirty)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.diaper_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  baby_id UUID NOT NULL REFERENCES public.babies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_wet BOOLEAN NOT NULL DEFAULT false,
  is_dirty BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT at_least_one_type CHECK (is_wet OR is_dirty)
);

-- Indexes for diaper_changes table
CREATE INDEX IF NOT EXISTS idx_diaper_changes_baby ON public.diaper_changes(baby_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_diaper_changes_user ON public.diaper_changes(user_id);

-- =====================================================
-- 6. GROWTH MEASUREMENTS TABLE
-- Tracks weight, height, and head circumference
-- =====================================================
CREATE TABLE IF NOT EXISTS public.growth_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  baby_id UUID NOT NULL REFERENCES public.babies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  weight_kg DECIMAL(5,2),
  height_cm DECIMAL(5,2),
  head_circumference_cm DECIMAL(5,2),
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT at_least_one_measurement CHECK (
    weight_kg IS NOT NULL OR
    height_cm IS NOT NULL OR
    head_circumference_cm IS NOT NULL
  )
);

-- Indexes for growth_measurements table
CREATE INDEX IF NOT EXISTS idx_growth_measurements_baby ON public.growth_measurements(baby_id, measured_at DESC);
CREATE INDEX IF NOT EXISTS idx_growth_measurements_user ON public.growth_measurements(user_id);

-- =====================================================
-- Comments for documentation
-- =====================================================
COMMENT ON TABLE public.profiles IS 'User profiles extending auth.users';
COMMENT ON TABLE public.babies IS 'Baby profiles for tracking';
COMMENT ON TABLE public.feeding_logs IS 'Feeding sessions (bottle and breast)';
COMMENT ON TABLE public.sleep_logs IS 'Sleep sessions (naps and night sleep)';
COMMENT ON TABLE public.diaper_changes IS 'Diaper change records';
COMMENT ON TABLE public.growth_measurements IS 'Growth tracking (weight, height, head circumference)';
