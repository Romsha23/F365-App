-- ============================================
-- IVF Readiness Assessment Table
-- ============================================
-- Stores IVF readiness assessment results per user
-- Each assessment captures the full scoring breakdown,
-- input data, predictions, and recommended actions.

CREATE TABLE IF NOT EXISTS ivf_readiness_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_score INTEGER NOT NULL CHECK (total_score >= 0 AND total_score <= 100),
  category TEXT NOT NULL CHECK (category IN ('low', 'watch', 'high', 'critical')),
  sub_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  predictions JSONB NOT NULL DEFAULT '{}'::jsonb,
  actions TEXT[] NOT NULL DEFAULT '{}',
  input_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_ivf_assessments_user_id ON ivf_readiness_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_ivf_assessments_created_at ON ivf_readiness_assessments(created_at DESC);

-- RLS policies
ALTER TABLE ivf_readiness_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own IVF assessments"
  ON ivf_readiness_assessments
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own IVF assessments"
  ON ivf_readiness_assessments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own IVF assessments"
  ON ivf_readiness_assessments
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own IVF assessments"
  ON ivf_readiness_assessments
  FOR DELETE
  USING (auth.uid() = user_id);
