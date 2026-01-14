-- ============================================================================
-- COMPREHENSIVE DATABASE SCHEMA UPDATE (CORRECTED)
-- Date: 2025-01-21
-- Description: Complete analysis and update of database schema
-- ============================================================================

-- ============================================================================
-- PART 1: MISSING COLUMNS IN EXISTING TABLES
-- ============================================================================

-- 1.1 PROFILES TABLE - Add missing columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS store_banner TEXT;

-- ✅ COLUNA CRÍTICA PARA AI MODEL (ADICIONADA)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ai_model TEXT 
  DEFAULT 'gemini-2.5-flash-image-preview';

COMMENT ON COLUMN public.profiles.email IS 'User email address (replicated from auth.users for convenience)';
COMMENT ON COLUMN public.profiles.updated_at IS 'Last update timestamp';
COMMENT ON COLUMN public.profiles.whatsapp IS 'DEPRECATED: Now stored in preferences.whatsapp';
COMMENT ON COLUMN public.profiles.store_banner IS 'DEPRECATED: Now stored in preferences.store_banner';
COMMENT ON COLUMN public.profiles.ai_model IS 'Default AI model for VTO transformations';

-- 1.2 ASSETS TABLE - Add missing columns
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

COMMENT ON COLUMN public.assets.updated_at IS 'Last update timestamp for the asset';

-- 1.3 JOBS TABLE - Ensure all versioning columns exist (from previous migration)
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

COMMENT ON COLUMN public.jobs.updated_at IS 'Last update timestamp for the job';

-- ============================================================================
-- PART 2: FIX AI MODEL CONSTRAINT IN PROFILES
-- ============================================================================

-- Drop old constraint if exists
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_ai_model_check;

-- Recreate with all valid AI models from constants/ai-models.ts
ALTER TABLE public.profiles ADD CONSTRAINT profiles_ai_model_check 
CHECK (
  ai_model IS NULL OR 
  ai_model IN (
    'gemini-2.5-flash-image-preview',
    'gemini-2.0-flash-exp',
    'gemini-1.5-pro-vision',
    'gemini-1.5-flash-vision',
    'llama-3.2-90b-vision-preview',
    'gpt-4o-mini-vision',
    'qwen-vl-plus',
    'deepseek-vl',
    'moondream-2',
    'clip-interrogator'
  )
);

-- ============================================================================
-- PART 3: ADD MISSING INDEXES FOR PERFORMANCE
-- ============================================================================

-- 3.1 Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON public.profiles(plan);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_ai_model ON public.profiles(ai_model);

-- 3.2 Assets indexes (additional)
CREATE INDEX IF NOT EXISTS idx_assets_category ON public.assets(category);
CREATE INDEX IF NOT EXISTS idx_assets_created_at ON public.assets(created_at);
CREATE INDEX IF NOT EXISTS idx_assets_user_type ON public.assets(user_id, type);
CREATE INDEX IF NOT EXISTS idx_assets_is_favorite ON public.assets(is_favorite) WHERE is_favorite = true;
CREATE INDEX IF NOT EXISTS idx_assets_source ON public.assets(source);

-- 3.3 Jobs indexes (additional)
CREATE INDEX IF NOT EXISTS idx_jobs_product_id ON public.jobs(product_id);
CREATE INDEX IF NOT EXISTS idx_jobs_model_id ON public.jobs(model_id);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON public.jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_user_status ON public.jobs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_jobs_is_public ON public.jobs(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_jobs_style ON public.jobs(style);

-- 3.4 Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- 3.5 Products indexes
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON public.products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(active) WHERE active = true;

-- 3.6 Public looks indexes
CREATE INDEX IF NOT EXISTS idx_public_looks_store_id ON public.public_looks(store_id);
CREATE INDEX IF NOT EXISTS idx_public_looks_is_active ON public.public_looks(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_public_looks_created_at ON public.public_looks(created_at DESC);

-- ============================================================================
-- PART 4: ADD TRIGGERS FOR updated_at COLUMNS
-- ============================================================================

-- Function already exists from previous schema, but let's ensure it's there
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for tables that were missing them
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_assets_updated_at ON public.assets;
CREATE TRIGGER update_assets_updated_at
  BEFORE UPDATE ON public.assets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_jobs_updated_at ON public.jobs;
CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_sellers_updated_at ON public.sellers;
CREATE TRIGGER update_sellers_updated_at
  BEFORE UPDATE ON public.sellers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- PART 5: ADD MISSING CONSTRAINTS (CORRIGIDO)
-- ============================================================================

-- 5.1 Add NOT NULL constraints where appropriate
ALTER TABLE public.profiles ALTER COLUMN name SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN plan SET NOT NULL;

ALTER TABLE public.assets ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.assets ALTER COLUMN type SET NOT NULL;

ALTER TABLE public.jobs ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.jobs ALTER COLUMN status SET NOT NULL;

-- 5.2 Add CHECK constraints (PADRÃO CORRETO: DROP PRIMEIRO, DEPOIS ADD)
ALTER TABLE public.assets DROP CONSTRAINT IF EXISTS assets_type_check;
ALTER TABLE public.assets ADD CONSTRAINT assets_type_check 
CHECK (type IN ('product', 'model', 'result'));

ALTER TABLE public.assets DROP CONSTRAINT IF EXISTS assets_source_check;
ALTER TABLE public.assets ADD CONSTRAINT assets_source_check 
CHECK (source IN ('file', 'url', ''));

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_plan_check 
CHECK (plan IN ('free', 'pro', 'enterprise'));

-- ============================================================================
-- PART 6: FIX FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Ensure all foreign keys are properly named and indexed
-- (Most foreign keys already exist from the schema, but let's verify)

-- Add missing foreign key for stores table if not exists
ALTER TABLE public.stores DROP CONSTRAINT IF EXISTS stores_owner_user_id_fkey;
ALTER TABLE public.stores ADD CONSTRAINT stores_owner_user_id_fkey 
  FOREIGN KEY (owner_user_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

-- Add missing foreign key for public_looks
ALTER TABLE public.public_looks DROP CONSTRAINT IF EXISTS public_looks_owner_user_id_fkey;
ALTER TABLE public.public_looks ADD CONSTRAINT public_looks_owner_user_id_fkey 
  FOREIGN KEY (owner_user_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

ALTER TABLE public.public_looks DROP CONSTRAINT IF EXISTS public_looks_store_id_fkey;
ALTER TABLE public.public_looks ADD CONSTRAINT public_looks_store_id_fkey 
  FOREIGN KEY (store_id) 
  REFERENCES public.stores(id) 
  ON DELETE CASCADE;

ALTER TABLE public.public_looks DROP CONSTRAINT IF EXISTS public_looks_product_asset_id_fkey;
ALTER TABLE public.public_looks ADD CONSTRAINT public_looks_product_asset_id_fkey 
  FOREIGN KEY (product_asset_id) 
  REFERENCES public.assets(id) 
  ON DELETE SET NULL;

-- Add CASCADE delete for jobs when assets are deleted
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_product_id_fkey;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_product_id_fkey 
  FOREIGN KEY (product_id) 
  REFERENCES public.assets(id) 
  ON DELETE CASCADE;

ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_model_id_fkey;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_model_id_fkey 
  FOREIGN KEY (model_id) 
  REFERENCES public.assets(id) 
  ON DELETE CASCADE;

-- ============================================================================
-- PART 7: CREATE MISSING TABLES
-- ============================================================================

-- 7.1 Create notifications table (referenced in code but doesn't exist in schema)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('success', 'error', 'info', 'warning')),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

DROP TRIGGER IF EXISTS update_notifications_updated_at ON public.notifications;
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.notifications IS 'User notifications for app events and updates';

-- 7.2 Create user_sessions table for tracking active sessions
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL,
  device_info JSONB,
  ip_address INET,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON public.user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON public.user_sessions(last_activity);

COMMENT ON TABLE public.user_sessions IS 'Track user sessions and activity for analytics';

-- ============================================================================
-- PART 8: CREATE ANALYTICS VIEWS
-- ============================================================================

-- 8.1 User analytics view
CREATE OR REPLACE VIEW public.user_analytics AS
SELECT 
  p.id,
  p.name,
  p.email,
  p.plan,
  p.created_at,
  COUNT(DISTINCT a.id) FILTER (WHERE a.type = 'product') as total_products,
  COUNT(DISTINCT a.id) FILTER (WHERE a.type = 'model') as total_models,
  COUNT(DISTINCT j.id) as total_jobs,
  COUNT(DISTINCT j.id) FILTER (WHERE j.status = 'completed') as completed_jobs,
  COUNT(DISTINCT j.id) FILTER (WHERE j.status = 'failed') as failed_jobs,
  COUNT(DISTINCT j.id) FILTER (WHERE j.status = 'processing') as processing_jobs,
  MAX(j.created_at) as last_job_date,
  (p.preferences->>'is_sales_enabled')::boolean as has_store,
  p.preferences->>'store_name' as store_name
FROM public.profiles p
LEFT JOIN public.assets a ON a.user_id = p.id
LEFT JOIN public.jobs j ON j.user_id = p.id
GROUP BY p.id, p.name, p.email, p.plan, p.created_at, p.preferences;

COMMENT ON VIEW public.user_analytics IS 'Aggregated analytics for user activity and usage';

-- 8.2 Job performance view
CREATE OR REPLACE VIEW public.job_performance AS
SELECT 
  ai_model_used,
  prompt_version,
  pipeline_version,
  status,
  style,
  COUNT(*) as total_jobs,
  COUNT(*) FILTER (WHERE status = 'completed') as successful_jobs,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_jobs,
  AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_processing_time_seconds,
  MIN(EXTRACT(EPOCH FROM (completed_at - started_at))) as min_processing_time_seconds,
  MAX(EXTRACT(EPOCH FROM (completed_at - started_at))) as max_processing_time_seconds,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (completed_at - started_at))) as median_processing_time_seconds
FROM public.jobs
WHERE started_at IS NOT NULL AND completed_at IS NOT NULL
GROUP BY ai_model_used, prompt_version, pipeline_version, status, style;

COMMENT ON VIEW public.job_performance IS 'Performance metrics for AI job processing';

-- ============================================================================
-- PART 9: CREATE HELPER FUNCTIONS
-- ============================================================================

-- 9.1 Function to get user stats
CREATE OR REPLACE FUNCTION public.get_user_stats(target_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'products', (SELECT COUNT(*) FROM public.assets WHERE user_id = target_user_id AND type = 'product'),
    'models', (SELECT COUNT(*) FROM public.assets WHERE user_id = target_user_id AND type = 'model'),
    'jobs', (SELECT COUNT(*) FROM public.jobs WHERE user_id = target_user_id),
    'processing', (SELECT COUNT(*) FROM public.jobs WHERE user_id = target_user_id AND status IN ('queued', 'processing')),
    'completed', (SELECT COUNT(*) FROM public.jobs WHERE user_id = target_user_id AND status = 'completed'),
    'failed', (SELECT COUNT(*) FROM public.jobs WHERE user_id = target_user_id AND status = 'failed')
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_user_stats IS 'Get aggregated statistics for a user';

-- 9.2 Function to cleanup old jobs
CREATE OR REPLACE FUNCTION public.cleanup_old_jobs(days_old INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM public.jobs
    WHERE 
      status IN ('completed', 'failed')
      AND created_at < NOW() - (days_old || ' days')::INTERVAL
      AND is_favorite = FALSE
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.cleanup_old_jobs IS 'Delete old completed/failed jobs that are not favorited';

-- ============================================================================
-- PART 10: ADD ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only read/update their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Assets: Users can CRUD their own assets, read public assets
DROP POLICY IF EXISTS "Users can view own assets" ON public.assets;
CREATE POLICY "Users can view own assets" ON public.assets
  FOR SELECT USING (auth.uid() = user_id OR published = true);

DROP POLICY IF EXISTS "Users can insert own assets" ON public.assets;
CREATE POLICY "Users can insert own assets" ON public.assets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own assets" ON public.assets;
CREATE POLICY "Users can update own assets" ON public.assets
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own assets" ON public.assets;
CREATE POLICY "Users can delete own assets" ON public.assets
  FOR DELETE USING (auth.uid() = user_id);

-- Jobs: Users can CRUD their own jobs, read public jobs
DROP POLICY IF EXISTS "Users can view own jobs" ON public.jobs;
CREATE POLICY "Users can view own jobs" ON public.jobs
  FOR SELECT USING (auth.uid() = user_id OR is_public = true);

DROP POLICY IF EXISTS "Users can insert own jobs" ON public.jobs;
CREATE POLICY "Users can insert own jobs" ON public.jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own jobs" ON public.jobs;
CREATE POLICY "Users can update own jobs" ON public.jobs
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own jobs" ON public.jobs;
CREATE POLICY "Users can delete own jobs" ON public.jobs
  FOR DELETE USING (auth.uid() = user_id);

-- Notifications: Users can only see their own notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- PART 11: DATA MIGRATION AND CLEANUP
-- ============================================================================

-- 11.1 Sync email from auth.users to profiles if missing
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- 11.2 Ensure all jobs have default versions
UPDATE public.jobs
SET 
  prompt_version = COALESCE(prompt_version, 'v1.0'),
  pipeline_version = COALESCE(pipeline_version, 'v1.0'),
  ai_model_used = COALESCE(ai_model_used, 'gemini-2.5-flash-image-preview')
WHERE prompt_version IS NULL OR pipeline_version IS NULL OR ai_model_used IS NULL;

-- 11.3 Set default preferences for users without them
UPDATE public.profiles
SET preferences = COALESCE(preferences, '{}'::jsonb) || '{"emailNotifications": true}'::jsonb
WHERE preferences IS NULL OR NOT (preferences ? 'emailNotifications');

-- 11.4 Ensure all profiles have default ai_model
UPDATE public.profiles
SET ai_model = 'gemini-2.5-flash-image-preview'
WHERE ai_model IS NULL;

-- ============================================================================
-- PART 12: GRANT PERMISSIONS
-- ============================================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT SELECT ON public.user_analytics TO authenticated;
GRANT SELECT ON public.job_performance TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_stats TO authenticated;

-- ============================================================================
-- PART 13: VERIFICATION QUERIES
-- ============================================================================

-- Verify all tables exist
SELECT schemaname, tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Verify all indexes
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;

-- Verify all foreign keys
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- Verify profiles table has ai_model column
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'ai_model';

-- ============================================================================
-- END OF MIGRATION SCRIPT
-- ============================================================================
