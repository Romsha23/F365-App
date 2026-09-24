-- Enable PostgreSQL Extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 1. Cleanup Obsolete Tables
DROP TABLE IF EXISTS public.subscriptions CASCADE;

-- 2. Enums and Custom Types
DO $$ BEGIN
    CREATE TYPE app_role AS ENUM ('admin', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Core Tables & Relationships

-- Profiles: add avatar_url, keep encrypted_username, encrypted_email
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    encrypted_username TEXT NOT NULL,
    encrypted_email TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- If profiles existed from 0000_init, let's make sure avatar_url exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- User Roles
-- Drop existing table if it doesn't match, or recreate it to use enum
DROP TABLE IF EXISTS public.user_roles CASCADE;

CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role DEFAULT 'user'::app_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, role)
);

-- App Settings
CREATE TABLE IF NOT EXISTS public.app_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_by UUID REFERENCES auth.users(id)
);

-- Content Pages
CREATE TABLE IF NOT EXISTS public.content_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    meta_description TEXT,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Pre-Launch & Marketing

-- Waitlist
CREATE TABLE IF NOT EXISTS public.waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    referral_code TEXT UNIQUE DEFAULT ('FL' || substr(md5(random()::text), 1, 8)),
    referred_by TEXT,
    referral_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Pricing & Monetization (Dynamic)

-- Pricing Plans
CREATE TABLE IF NOT EXISTS public.pricing_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10,2) DEFAULT 0,
    currency TEXT DEFAULT 'AUD',
    billing_interval TEXT DEFAULT 'year',
    stripe_price_id TEXT,
    stripe_product_id TEXT,
    features JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    discount_countries TEXT[],
    discount_price NUMERIC(10,2),
    discount_stripe_price_id TEXT
);

-- Country Pricing
CREATE TABLE IF NOT EXISTS public.country_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code TEXT UNIQUE NOT NULL,
    country_name TEXT DEFAULT '',
    monthly_price NUMERIC DEFAULT 0,
    yearly_price NUMERIC DEFAULT 0,
    currency TEXT DEFAULT 'AUD',
    monthly_stripe_price_id TEXT,
    yearly_stripe_price_id TEXT,
    is_free BOOLEAN DEFAULT false
);

-- 6. Security & Analytics

-- Recreate site_visits to match the required schema
DROP TABLE IF EXISTS public.site_visits CASCADE;

CREATE TABLE public.site_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_path TEXT NOT NULL,
    referrer TEXT,
    user_agent TEXT,
    device_type TEXT,
    browser TEXT,
    os TEXT,
    country TEXT,
    city TEXT,
    ip_hash TEXT,
    session_id TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_site_visits_created_at ON public.site_visits(created_at);
CREATE INDEX IF NOT EXISTS idx_site_visits_page_path ON public.site_visits(page_path);
CREATE INDEX IF NOT EXISTS idx_site_visits_ip_hash ON public.site_visits(ip_hash);

-- Recreate security_events
DROP TABLE IF EXISTS public.security_events CASCADE;

CREATE TABLE public.security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    severity TEXT DEFAULT 'low',
    ip_hash TEXT,
    user_agent TEXT,
    details JSONB,
    page_path TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON public.security_events(created_at);
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON public.security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON public.security_events(severity);

-- 7. Functions & Triggers

-- Centralized updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Attach to tables with updated_at
DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;
CREATE TRIGGER on_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

DROP TRIGGER IF EXISTS on_app_settings_updated ON public.app_settings;
CREATE TRIGGER on_app_settings_updated BEFORE UPDATE ON public.app_settings FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

DROP TRIGGER IF EXISTS on_content_pages_updated ON public.content_pages;
CREATE TRIGGER on_content_pages_updated BEFORE UPDATE ON public.content_pages FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();


-- is_admin() Function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'::app_role
    );
$$;

-- has_role() Function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id AND role = _role
    );
$$;

-- handle_new_user() Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    -- Initialize profiles with safe fallback since encryption might be handled via API
    INSERT INTO public.profiles (id, encrypted_username, encrypted_email)
    VALUES (NEW.id, 'default_encrypted_user', 'default_encrypted_email');
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user'::app_role);
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 8. Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.country_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies that might conflict
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can select own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin has all access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admin has all access to user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Anyone can read app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "Admin has all access to app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "Anyone can read published content_pages" ON public.content_pages;
DROP POLICY IF EXISTS "Admin has all access to content_pages" ON public.content_pages;
DROP POLICY IF EXISTS "Anyone can insert waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Admin has all access to waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Anyone can read active pricing_plans" ON public.pricing_plans;
DROP POLICY IF EXISTS "Admin has all access to pricing_plans" ON public.pricing_plans;
DROP POLICY IF EXISTS "Anyone can read country_pricing" ON public.country_pricing;
DROP POLICY IF EXISTS "Admin has all access to country_pricing" ON public.country_pricing;
DROP POLICY IF EXISTS "Anyone can insert site_visits" ON public.site_visits;
DROP POLICY IF EXISTS "Admin can read site_visits" ON public.site_visits;
DROP POLICY IF EXISTS "Anyone can insert security_events" ON public.security_events;
DROP POLICY IF EXISTS "Admin can read security_events" ON public.security_events;

-- Profiles Policies
CREATE POLICY "Users can select own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admin has all access to profiles" ON public.profiles TO authenticated USING (public.is_admin());

-- User Roles Policies
CREATE POLICY "Users can select own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin has all access to user_roles" ON public.user_roles TO authenticated USING (public.is_admin());

-- App Settings Policies
CREATE POLICY "Anyone can read app_settings" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Admin has all access to app_settings" ON public.app_settings TO authenticated USING (public.is_admin());

-- Content Pages Policies
CREATE POLICY "Anyone can read published content_pages" ON public.content_pages FOR SELECT USING (is_published = true);
CREATE POLICY "Admin has all access to content_pages" ON public.content_pages TO authenticated USING (public.is_admin());

-- Waitlist Policies
-- Anon access strictly blocked on waitlist select. Writes allowed contextually via edge function or service role, but we'll allow public inserts?
CREATE POLICY "Anyone can insert waitlist" ON public.waitlist FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin has all access to waitlist" ON public.waitlist TO authenticated USING (public.is_admin());

-- Pricing Plans Policies
CREATE POLICY "Anyone can read active pricing_plans" ON public.pricing_plans FOR SELECT USING (is_active = true);
CREATE POLICY "Admin has all access to pricing_plans" ON public.pricing_plans TO authenticated USING (public.is_admin());

-- Country Pricing Policies
CREATE POLICY "Anyone can read country_pricing" ON public.country_pricing FOR SELECT USING (true);
CREATE POLICY "Admin has all access to country_pricing" ON public.country_pricing TO authenticated USING (public.is_admin());

-- Site Visits Policies
CREATE POLICY "Anyone can insert site_visits" ON public.site_visits FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can read site_visits" ON public.site_visits FOR SELECT TO authenticated USING (public.is_admin());

-- Security Events Policies
CREATE POLICY "Anyone can insert security_events" ON public.security_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can read security_events" ON public.security_events FOR SELECT TO authenticated USING (public.is_admin());


-- 9. Seeded Data Context

-- App Settings
INSERT INTO public.app_settings (setting_key, setting_value)
VALUES ('archive_retention_months', '36')
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;

-- Pricing Plans
INSERT INTO public.pricing_plans (plan_key, name, description, price, currency, billing_interval, is_active, sort_order)
VALUES 
    ('starter', 'Starter', 'Free access to essential features.', 0, 'AUD', 'month', true, 1),
    ('plus_annual', 'Plus Annual', 'Premium features billed annually.', 99.99, 'AUD', 'year', true, 2),
    ('corporate', 'Corporate', 'Custom enterprise solutions.', 0, 'AUD', 'year', true, 3)
ON CONFLICT (plan_key) DO UPDATE SET 
    name = EXCLUDED.name, 
    price = EXCLUDED.price, 
    sort_order = EXCLUDED.sort_order;

-- Country Pricing
INSERT INTO public.country_pricing (country_code, country_name, is_free, yearly_price, currency)
VALUES 
    ('IN', 'India', true, 0, 'AUD'),
    ('PK', 'Pakistan', false, 55, 'AUD')
ON CONFLICT (country_code) DO UPDATE SET 
    is_free = EXCLUDED.is_free, 
    yearly_price = EXCLUDED.yearly_price;

-- Admin Demo Account Seed (local dev)
DO $$
DECLARE
  admin_uid UUID;
  admin_email TEXT := 'f365@admin.app';
BEGIN
  SELECT id INTO admin_uid FROM auth.users WHERE email = admin_email LIMIT 1;

  IF admin_uid IS NULL THEN
    admin_uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, recovery_sent_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      admin_uid,
      'authenticated',
      'authenticated',
      admin_email,
      extensions.crypt('Pass#1234', extensions.gen_salt('bf')),
      now(), now(), now(),
      '{"provider": "email", "providers": ["email"]}',
      '{}',
      now(), now(),
      '', '', '', ''
    );

    INSERT INTO auth.identities (
      id, user_id, provider_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    )
    VALUES (
      gen_random_uuid(),
      admin_uid,
      admin_uid::text,
      jsonb_build_object('sub', admin_uid::text, 'email', admin_email),
      'email',
      now(), now(), now()
    );
  END IF;

  -- Update role to admin (the trigger creates them as 'user')
  UPDATE public.user_roles
  SET role = 'admin'::app_role
  WHERE user_id = admin_uid;

END $$;
