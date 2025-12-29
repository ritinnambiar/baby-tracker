# Supabase Database Setup

This directory contains the database migrations for the Baby Tracker application.

## Prerequisites

- A Supabase account (sign up at https://supabase.com)
- Supabase project created

## Setup Steps

### 1. Create a Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `baby-tracker` (or your preferred name)
   - **Database Password**: (generate a strong password and save it)
   - **Region**: Choose closest to your users
5. Click "Create new project" and wait for setup to complete (~2 minutes)

### 2. Get Your Supabase Credentials

After project creation:

1. Go to **Project Settings** (gear icon in left sidebar)
2. Click **API** tab
3. Copy the following values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (the `anon` API key)

### 3. Configure Environment Variables

Create `.env.local` file in the root directory:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Apply Database Migrations

You have two options to apply migrations:

#### Option A: Using Supabase SQL Editor (Recommended for beginners)

1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the contents of each migration file **in order** and run them:
   - `001_initial_schema.sql` - Creates all tables
   - `002_rls_policies.sql` - Sets up Row Level Security
   - `003_functions.sql` - Creates functions and triggers
5. Click **Run** after pasting each file's contents

#### Option B: Using Supabase CLI (For advanced users)

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```
   (Find your project ref in Project Settings > General)

4. Push migrations:
   ```bash
   supabase db push
   ```

### 5. Enable Google OAuth (Optional but Recommended)

1. Go to **Authentication** > **Providers** in your Supabase dashboard
2. Find **Google** in the list
3. Toggle it **ON**
4. Configure Google OAuth:
   - Create a Google Cloud project at https://console.cloud.google.com
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs:
     - `https://your-project.supabase.co/auth/v1/callback`
   - Copy Client ID and Client Secret to Supabase
5. Click **Save**

### 6. Verify Setup

After applying migrations, verify everything is set up correctly:

1. Go to **Table Editor** in Supabase dashboard
2. You should see these tables:
   - `profiles`
   - `babies`
   - `feeding_logs`
   - `sleep_logs`
   - `diaper_changes`
   - `growth_measurements`

3. Go to **SQL Editor** and run:
   ```sql
   SELECT tablename FROM pg_tables WHERE schemaname = 'public';
   ```
   You should see all 6 tables listed.

## Database Schema Overview

### Tables

1. **profiles** - User profiles (extends auth.users)
2. **babies** - Baby profiles for tracking
3. **feeding_logs** - Feeding sessions (bottle and breast with timer support)
4. **sleep_logs** - Sleep sessions (naps and night sleep)
5. **diaper_changes** - Diaper change records
6. **growth_measurements** - Growth tracking (weight, height, head circumference)

### Key Features

- **Row Level Security (RLS)**: Users can only access their own data
- **Automatic timestamps**: All tables have `created_at` and `updated_at`
- **Auto-profile creation**: Profile is created automatically on user signup
- **Active timers**: Support for tracking ongoing feeding and sleep sessions
- **Daily summaries**: Helper function to get daily statistics

## Troubleshooting

### Migration Errors

If you encounter errors when applying migrations:

1. **Check table order**: Apply migrations in numerical order (001, 002, 003)
2. **Clear and retry**: If a migration fails partway:
   ```sql
   -- In SQL Editor, drop all tables and start over
   DROP TABLE IF EXISTS public.growth_measurements CASCADE;
   DROP TABLE IF EXISTS public.diaper_changes CASCADE;
   DROP TABLE IF EXISTS public.sleep_logs CASCADE;
   DROP TABLE IF EXISTS public.feeding_logs CASCADE;
   DROP TABLE IF EXISTS public.babies CASCADE;
   DROP TABLE IF EXISTS public.profiles CASCADE;
   ```
   Then reapply migrations from the beginning.

### RLS Issues

If you can't access data after signup:

1. Verify RLS policies are applied (check Table Editor > Policies tab)
2. Check auth.users table has your user record
3. Verify profile was created in profiles table

### Google OAuth Not Working

1. Verify redirect URI matches exactly (including https://)
2. Check Google Cloud Console credentials are correct
3. Ensure Google+ API is enabled in Google Cloud Console
4. Try re-saving the OAuth configuration in Supabase

## Next Steps

After successful database setup:

1. Test authentication by signing up a user
2. Verify profile is created automatically
3. Test creating a baby profile
4. Ready to move to Phase 3: Authentication Infrastructure

## Support

For Supabase-specific issues, check:
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
