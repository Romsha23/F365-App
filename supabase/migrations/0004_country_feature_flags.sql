-- Country access (market-level) and per-feature flags by country

CREATE TABLE IF NOT EXISTS public.country_access (
    country_code TEXT PRIMARY KEY,
    country_name TEXT DEFAULT '',
    is_allowed BOOLEAN NOT NULL DEFAULT true,
    block_message TEXT,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.country_feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code TEXT NOT NULL,
    feature_key TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (country_code, feature_key)
);

CREATE INDEX IF NOT EXISTS idx_country_feature_flags_country ON public.country_feature_flags(country_code);
CREATE INDEX IF NOT EXISTS idx_country_feature_flags_feature ON public.country_feature_flags(feature_key);

DROP TRIGGER IF EXISTS on_country_access_updated ON public.country_access;
CREATE TRIGGER on_country_access_updated
    BEFORE UPDATE ON public.country_access
    FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

DROP TRIGGER IF EXISTS on_country_feature_flags_updated ON public.country_feature_flags;
CREATE TRIGGER on_country_feature_flags_updated
    BEFORE UPDATE ON public.country_feature_flags
    FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

ALTER TABLE public.country_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.country_feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read country_access" ON public.country_access FOR SELECT USING (true);
CREATE POLICY "Admin has all access to country_access" ON public.country_access TO authenticated USING (public.is_admin());

CREATE POLICY "Anyone can read country_feature_flags" ON public.country_feature_flags FOR SELECT USING (true);
CREATE POLICY "Admin has all access to country_feature_flags" ON public.country_feature_flags TO authenticated USING (public.is_admin());

-- Example: partner sharing disabled in CN (admin can change via dashboard)
INSERT INTO public.country_access (country_code, country_name, is_allowed, block_message)
VALUES ('CN', 'China', false, 'f365 is not yet available in your region.')
ON CONFLICT (country_code) DO NOTHING;

INSERT INTO public.country_feature_flags (country_code, feature_key, enabled)
VALUES
    ('CN', 'partner_sharing', false),
    ('CN', 'ai_insights', false),
    ('CN', 'subscription_checkout', false),
    ('CN', 'code_redemption', false)
ON CONFLICT (country_code, feature_key) DO NOTHING;
