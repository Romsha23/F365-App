-- Pending coupons: codes redeemed by users, applied to their next checkout session

CREATE TABLE IF NOT EXISTS public.pending_coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    coupon_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'used', 'expired')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pending_coupons_user_status
    ON public.pending_coupons(user_id, status);

-- Prevent the same user from redeeming the same code twice
CREATE UNIQUE INDEX IF NOT EXISTS idx_pending_coupons_user_coupon
    ON public.pending_coupons(user_id, coupon_id);

ALTER TABLE public.pending_coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages pending_coupons"
    ON public.pending_coupons FOR ALL TO service_role USING (true) WITH CHECK (true);
