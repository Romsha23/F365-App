-- F365 Clinic Finder - Database Setup
-- Run this in Supabase SQL Editor

-- 1. Clinics table (master list of fertility clinics)
CREATE TABLE IF NOT EXISTS clinics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'AU',
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  latitude DOUBLE PRECISION DEFAULT 0,
  longitude DOUBLE PRECISION DEFAULT 0,
  services TEXT[] DEFAULT '{}',
  wait_time TEXT DEFAULT '2-4 weeks',
  gp_referral_required BOOLEAN DEFAULT false,
  telehealth_available BOOLEAN DEFAULT false,
  packages_available BOOLEAN DEFAULT false,
  direct_booking BOOLEAN DEFAULT false,
  medicare_accepted BOOLEAN DEFAULT false,
  description TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  website TEXT DEFAULT '',
  operating_hours TEXT DEFAULT 'Mon-Fri 8am-5pm',
  accreditation TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Clinic contact requests (when user requests contact from a clinic)
CREATE TABLE IF NOT EXISTS clinic_contact_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  consent_share_profile BOOLEAN DEFAULT false,
  consent_share_fertility_report BOOLEAN DEFAULT false,
  consent_share_with_multiple BOOLEAN DEFAULT false,
  selected_clinic_ids UUID[] DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'responded', 'closed')),
  user_age INTEGER,
  user_location TEXT,
  fertility_summary JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Clinic consent log (audit trail for data sharing consent)
CREATE TABLE IF NOT EXISTS clinic_consent_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
  consent_type TEXT NOT NULL CHECK (consent_type IN ('share_profile', 'share_fertility_report', 'share_multiple', 'revoke')),
  consent_given BOOLEAN DEFAULT false,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_clinics_country ON clinics(country);
CREATE INDEX IF NOT EXISTS idx_clinics_active ON clinics(is_active);
CREATE INDEX IF NOT EXISTS idx_clinic_contact_user ON clinic_contact_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_clinic_contact_clinic ON clinic_contact_requests(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_contact_status ON clinic_contact_requests(status);
CREATE INDEX IF NOT EXISTS idx_clinic_consent_user ON clinic_consent_log(user_id);

-- 5. RLS Policies
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_contact_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_consent_log ENABLE ROW LEVEL SECURITY;

-- Clinics: anyone authenticated can read
CREATE POLICY "Clinics are viewable by authenticated users" ON clinics
  FOR SELECT TO authenticated USING (is_active = true);

-- Contact requests: users can only see/create their own
CREATE POLICY "Users can view own contact requests" ON clinic_contact_requests
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can create contact requests" ON clinic_contact_requests
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own contact requests" ON clinic_contact_requests
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Consent log: users can only see/create their own
CREATE POLICY "Users can view own consent log" ON clinic_consent_log
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can create consent log entries" ON clinic_consent_log
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
