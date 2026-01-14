-- Migration: Add support for async jobs, AI model selection, and pipeline versioning
-- Date: 2025-01-15
-- Description: Extends profiles and jobs tables for production-grade async processing

-- ============================================================================
-- 1. UPDATE PROFILES TABLE - Add AI model preference
-- ============================================================================

-- Add ai_model column to profiles (stores user's preferred AI model)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS ai_model TEXT DEFAULT 'gemini-2.5-flash-image-preview'
CHECK (ai_model IN (
  'gemini-2.5-flash-image-preview',
  'gemini-2.0-flash-exp',
  'llama-3.2-90b-vision-preview'
));

-- Add comment for documentation
COMMENT ON COLUMN profiles.ai_model IS 'User preferred AI model for Virtual Try-On transformations';

-- ============================================================================
-- 2. UPDATE JOBS TABLE - Add versioning and async support
-- ============================================================================

-- Add 'queued' status to existing status check constraint
-- First, drop the old constraint
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_status_check;

-- Add new constraint with 'queued' status
ALTER TABLE jobs ADD CONSTRAINT jobs_status_check 
CHECK (status IN ('queued', 'pending', 'processing', 'completed', 'failed'));

-- Add ai_model_used column (tracks which model was actually used)
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS ai_model_used TEXT;

COMMENT ON COLUMN jobs.ai_model_used IS 'AI model that was used for this job (for auditing and analytics)';

-- Add prompt_version column (tracks prompt template version)
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS prompt_version TEXT DEFAULT 'v1.0';

COMMENT ON COLUMN jobs.prompt_version IS 'Version of the prompt template used (e.g., v1.0, v1.1, v2.0)';

-- Add pipeline_version column (tracks processing pipeline version)
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS pipeline_version TEXT DEFAULT 'v1.0';

COMMENT ON COLUMN jobs.pipeline_version IS 'Version of the processing pipeline (for A/B testing and rollbacks)';

-- Add error_message column (stores detailed error information)
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS error_message TEXT;

COMMENT ON COLUMN jobs.error_message IS 'Detailed error message if job failed (helps with debugging)';

-- Add started_at column (when processing actually started)
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;

COMMENT ON COLUMN jobs.started_at IS 'Timestamp when job processing started (for performance metrics)';

-- Add completed_at column (when processing finished)
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

COMMENT ON COLUMN jobs.completed_at IS 'Timestamp when job completed or failed (for SLA monitoring)';

-- ============================================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for querying queued jobs (for worker polling)
CREATE INDEX IF NOT EXISTS idx_jobs_queued 
ON jobs(status, created_at) 
WHERE status = 'queued';

-- Index for querying user's AI model preference
CREATE INDEX IF NOT EXISTS idx_profiles_ai_model 
ON profiles(ai_model);

-- Index for analytics queries by AI model
CREATE INDEX IF NOT EXISTS idx_jobs_ai_model_used 
ON jobs(ai_model_used);

-- Index for version-based queries
CREATE INDEX IF NOT EXISTS idx_jobs_versions 
ON jobs(prompt_version, pipeline_version);

-- ============================================================================
-- 4. BACKFILL EXISTING DATA (ensures backward compatibility)
-- ============================================================================

-- Update existing jobs to have default versions
UPDATE jobs 
SET 
  prompt_version = 'v1.0',
  pipeline_version = 'v1.0',
  ai_model_used = 'gemini-2.5-flash-image-preview'
WHERE prompt_version IS NULL OR pipeline_version IS NULL OR ai_model_used IS NULL;

-- Update completed jobs to set completed_at from updated_at
UPDATE jobs 
SET completed_at = updated_at
WHERE status IN ('completed', 'failed') AND completed_at IS NULL;

-- ============================================================================
-- 5. CREATE FUNCTION FOR AUTO-SETTING TIMESTAMPS
-- ============================================================================

-- Function to auto-set started_at when status changes to 'processing'
CREATE OR REPLACE FUNCTION set_job_started_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'processing' AND OLD.status != 'processing' THEN
    NEW.started_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-set completed_at when status changes to 'completed' or 'failed'
CREATE OR REPLACE FUNCTION set_job_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('completed', 'failed') AND OLD.status NOT IN ('completed', 'failed') THEN
    NEW.completed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. CREATE TRIGGERS
-- ============================================================================

-- Trigger to auto-set started_at
DROP TRIGGER IF EXISTS trg_job_started_at ON jobs;
CREATE TRIGGER trg_job_started_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION set_job_started_at();

-- Trigger to auto-set completed_at
DROP TRIGGER IF EXISTS trg_job_completed_at ON jobs;
CREATE TRIGGER trg_job_completed_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION set_job_completed_at();

-- ============================================================================
-- 7. CREATE VIEW FOR JOB ANALYTICS (optional, useful for monitoring)
-- ============================================================================

CREATE OR REPLACE VIEW job_analytics AS
SELECT 
  ai_model_used,
  prompt_version,
  pipeline_version,
  status,
  COUNT(*) as total_jobs,
  AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_processing_time_seconds,
  MIN(EXTRACT(EPOCH FROM (completed_at - started_at))) as min_processing_time_seconds,
  MAX(EXTRACT(EPOCH FROM (completed_at - started_at))) as max_processing_time_seconds
FROM jobs
WHERE started_at IS NOT NULL AND completed_at IS NOT NULL
GROUP BY ai_model_used, prompt_version, pipeline_version, status;

COMMENT ON VIEW job_analytics IS 'Analytics view for monitoring job performance by model, version, and status';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary:
-- ✅ Added ai_model to profiles (user preference)
-- ✅ Added 'queued' status to jobs (async processing)
-- ✅ Added ai_model_used, prompt_version, pipeline_version to jobs (versioning)
-- ✅ Added error_message to jobs (better error tracking)
-- ✅ Added started_at, completed_at to jobs (performance monitoring)
-- ✅ Created indexes for performance
-- ✅ Backfilled existing data for compatibility
-- ✅ Created triggers for auto-timestamping
-- ✅ Created analytics view for monitoring
-- ============================================================================
