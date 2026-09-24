CREATE TABLE IF NOT EXISTS public.redemption_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    product_type TEXT NOT NULL,
    product_name TEXT NOT NULL,
    created_for_email TEXT,
    status TEXT NOT NULL DEFAULT 'available',
    redeemed_by_email TEXT,
    redeemed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_redemption_codes_status ON public.redemption_codes(status);
CREATE INDEX IF NOT EXISTS idx_redemption_codes_code ON public.redemption_codes(code);
