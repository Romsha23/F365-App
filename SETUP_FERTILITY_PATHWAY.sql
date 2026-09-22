-- ============================================================
-- F365 Fertility Pathway - Database Setup
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Add role column to users table if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- 1. IVF Cost Estimates Table
-- Admin-managed, country-specific cost data
-- No fields are mandatory (global coverage varies)
CREATE TABLE IF NOT EXISTS ivf_cost_estimates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  country TEXT,
  treatment_type TEXT,
  min_cost NUMERIC,
  max_cost NUMERIC,
  medicare_rebate NUMERIC,
  out_of_pocket_min NUMERIC,
  out_of_pocket_max NUMERIC,
  insurance_discount NUMERIC,
  currency TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE ivf_cost_estimates ENABLE ROW LEVEL SECURITY;

-- Public read access (no auth needed for cost data)
CREATE POLICY "Anyone can read active cost estimates"
  ON ivf_cost_estimates FOR SELECT
  USING (is_active = true);

-- Admin write access
CREATE POLICY "Admins can manage cost estimates"
  ON ivf_cost_estimates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Index for fast country lookups
CREATE INDEX IF NOT EXISTS idx_ivf_cost_estimates_country
  ON ivf_cost_estimates(country, is_active);

-- 2. Doctor Question Templates Table
-- Admin-managed question templates
CREATE TABLE IF NOT EXISTS doctor_question_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_text TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  applicable_age_range TEXT,
  applicable_conditions TEXT[],
  applicable_life_stages TEXT[],
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE doctor_question_templates ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can read active question templates"
  ON doctor_question_templates FOR SELECT
  USING (is_active = true);

-- Admin write access
CREATE POLICY "Admins can manage question templates"
  ON doctor_question_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- 3. User Doctor Q&A Responses Table
-- Stores user answers for future ML/LLM training
CREATE TABLE IF NOT EXISTS user_doctor_qa_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  question_text TEXT NOT NULL,
  user_answer TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, question_id)
);

-- Enable RLS
ALTER TABLE user_doctor_qa_responses ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their own responses
CREATE POLICY "Users can manage their own QA responses"
  ON user_doctor_qa_responses FOR ALL
  USING (user_id::text = auth.uid()::text);

-- Admin read access for ML data
CREATE POLICY "Admins can read all QA responses"
  ON user_doctor_qa_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_user_doctor_qa_user
  ON user_doctor_qa_responses(user_id);

-- 4. User Feedback Table
-- Report/Feedback from users on any screen
CREATE TABLE IF NOT EXISTS user_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT,
  screen_name TEXT,
  feedback_type TEXT,
  details TEXT,
  context_data JSONB,
  user_country TEXT,
  user_age_group TEXT,
  status TEXT DEFAULT 'new',
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

-- Users can insert feedback
CREATE POLICY "Users can submit feedback"
  ON user_feedback FOR INSERT
  WITH CHECK (true);

-- Users can read their own feedback
CREATE POLICY "Users can read own feedback"
  ON user_feedback FOR SELECT
  USING (user_id::text = auth.uid()::text);

-- Admin full access
CREATE POLICY "Admins can manage all feedback"
  ON user_feedback FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Index for admin dashboard
CREATE INDEX IF NOT EXISTS idx_user_feedback_status
  ON user_feedback(status, created_at DESC);

-- ============================================================
-- SEED DATA: Cost Estimates (Australia)
-- ============================================================
INSERT INTO ivf_cost_estimates (country, treatment_type, min_cost, max_cost, medicare_rebate, out_of_pocket_min, out_of_pocket_max, insurance_discount, currency, notes) VALUES
('AU', 'ivf_standard', 8000, 12000, 3000, 5000, 9000, NULL, 'AUD', 'Standard IVF cycle cost in Australia. Medicare Safety Net may apply after threshold.'),
('AU', 'ivf_icsi', 9000, 14000, 3500, 5500, 10500, NULL, 'AUD', 'IVF with ICSI for male factor infertility. Additional lab fees apply.'),
('AU', 'iui', 1500, 3000, 500, 1000, 2500, NULL, 'AUD', 'Less invasive option. Often tried before IVF.'),
('AU', 'egg_freezing', 5000, 8000, NULL, 5000, 8000, NULL, 'AUD', 'Plus annual storage fees of $300-$500/year.'),
('AU', 'consultation', 250, 500, 100, 150, 400, NULL, 'AUD', 'Initial fertility specialist consultation. GP referral required for Medicare.'),
('AU', 'blood_tests', 500, 1500, 300, 200, 1200, NULL, 'AUD', 'Hormone panel, AMH, FSH, and other diagnostic tests.'),
('AU', 'medication', 2000, 5000, 800, 1200, 4200, NULL, 'AUD', 'Stimulation medications per cycle. PBS may cover some.'),
('AU', 'pgd_pgt', 3000, 6000, NULL, 3000, 6000, NULL, 'AUD', 'Pre-implantation genetic testing. Not Medicare covered.');

-- SEED DATA: Cost Estimates (India)
INSERT INTO ivf_cost_estimates (country, treatment_type, min_cost, max_cost, medicare_rebate, out_of_pocket_min, out_of_pocket_max, insurance_discount, currency, notes) VALUES
('IN', 'ivf_standard', 100000, 250000, NULL, 100000, 250000, NULL, 'INR', 'Standard IVF cycle. Costs vary significantly by city and clinic tier.'),
('IN', 'ivf_icsi', 150000, 350000, NULL, 150000, 350000, NULL, 'INR', 'IVF with ICSI. Premium clinics may charge more.'),
('IN', 'iui', 15000, 40000, NULL, 15000, 40000, NULL, 'INR', 'Basic IUI procedure. Multiple cycles may be recommended.'),
('IN', 'egg_freezing', 80000, 150000, NULL, 80000, 150000, NULL, 'INR', 'Plus annual storage fees.'),
('IN', 'consultation', 1000, 3000, NULL, 1000, 3000, NULL, 'INR', 'Initial fertility consultation. Direct booking available.'),
('IN', 'medication', 30000, 80000, NULL, 30000, 80000, NULL, 'INR', 'Stimulation medications per cycle.');

-- SEED DATA: Cost Estimates (Pakistan)
INSERT INTO ivf_cost_estimates (country, treatment_type, min_cost, max_cost, medicare_rebate, out_of_pocket_min, out_of_pocket_max, insurance_discount, currency, notes) VALUES
('PK', 'ivf_standard', 300000, 600000, NULL, 300000, 600000, NULL, 'PKR', 'Standard IVF cycle. Costs vary by clinic and city.'),
('PK', 'ivf_icsi', 400000, 800000, NULL, 400000, 800000, NULL, 'PKR', 'IVF with ICSI for male factor cases.'),
('PK', 'iui', 50000, 100000, NULL, 50000, 100000, NULL, 'PKR', 'Basic IUI procedure.'),
('PK', 'consultation', 3000, 10000, NULL, 3000, 10000, NULL, 'PKR', 'Initial fertility consultation. Direct booking available.');

-- SEED DATA: Cost Estimates (US)
INSERT INTO ivf_cost_estimates (country, treatment_type, min_cost, max_cost, medicare_rebate, out_of_pocket_min, out_of_pocket_max, insurance_discount, currency, notes) VALUES
('US', 'ivf_standard', 12000, 25000, NULL, 12000, 25000, 30, 'USD', 'Per cycle. Some states mandate insurance coverage. Check your plan.'),
('US', 'ivf_icsi', 15000, 30000, NULL, 15000, 30000, 30, 'USD', 'Adds $1,500-$3,000 to standard IVF cost.'),
('US', 'iui', 1000, 4000, NULL, 1000, 4000, 20, 'USD', 'Less expensive alternative to IVF.'),
('US', 'egg_freezing', 6000, 15000, NULL, 6000, 15000, NULL, 'USD', 'Plus annual storage fees of $500-$1,000.'),
('US', 'medication', 3000, 7000, NULL, 3000, 7000, 20, 'USD', 'Per cycle. Generic options may reduce costs.');

-- SEED DATA: Cost Estimates (UK)
INSERT INTO ivf_cost_estimates (country, treatment_type, min_cost, max_cost, medicare_rebate, out_of_pocket_min, out_of_pocket_max, insurance_discount, currency, notes) VALUES
('UK', 'ivf_standard', 4000, 8000, NULL, 4000, 8000, NULL, 'GBP', 'Private IVF. NHS may fund 1-3 cycles based on CCG criteria.'),
('UK', 'ivf_icsi', 5000, 10000, NULL, 5000, 10000, NULL, 'GBP', 'Private ICSI. NHS eligibility varies by region.'),
('UK', 'iui', 800, 2000, NULL, 800, 2000, NULL, 'GBP', 'Private IUI. Some NHS funding may be available.'),
('UK', 'consultation', 200, 400, NULL, 200, 400, NULL, 'GBP', 'Initial private fertility consultation.');

-- ============================================================
-- SEED DATA: Doctor Question Templates
-- ============================================================
INSERT INTO doctor_question_templates (question_text, category, applicable_life_stages, sort_order) VALUES
('Should I consider IVF or IUI first based on my situation?', 'general', ARRAY['trying_to_conceive'], 1),
('What diagnostic tests do I need before starting treatment?', 'general', NULL, 2),
('What is the expected success rate for someone in my age group?', 'success_rates', NULL, 3),
('What are the potential risks and side effects of hormonal stimulation?', 'risks', NULL, 4),
('How many IVF cycles should I expect before a successful pregnancy?', 'ivf_process', ARRAY['trying_to_conceive'], 5),
('What is the total estimated cost, including medications and monitoring?', 'costs', NULL, 6),
('How long is the typical timeline from first consultation to embryo transfer?', 'timeline', NULL, 7),
('Do I need hormone testing, and what should my AMH/FSH levels ideally be?', 'general', NULL, 8),
('Should my partner have a semen analysis done, and when?', 'male_fertility', NULL, 9),
('What lifestyle changes can improve our chances of success?', 'lifestyle', NULL, 10),
('Is genetic testing (PGT) recommended for our situation?', 'ivf_process', NULL, 11),
('What emotional or psychological support services does the clinic offer?', 'emotional', NULL, 12),
('Are there any supplements or medications I should start before treatment?', 'lifestyle', NULL, 13),
('What happens to unused embryos — can they be frozen for future use?', 'ivf_process', NULL, 14),
('How will my existing health conditions (if any) affect treatment outcomes?', 'risks', NULL, 15);
