-- User-submitted refund requests (reviewed in admin panel)

CREATE TABLE IF NOT EXISTS public.refund_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected', 'processed')),
    stripe_subscription_id TEXT,
    stripe_refund_id TEXT,
    admin_notes TEXT,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_refund_requests_user_id ON public.refund_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_status ON public.refund_requests(status);
CREATE INDEX IF NOT EXISTS idx_refund_requests_created_at ON public.refund_requests(created_at DESC);

-- One open request per user at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_refund_requests_one_pending_per_user
    ON public.refund_requests(user_id)
    WHERE status = 'pending';

DROP TRIGGER IF EXISTS on_refund_requests_updated ON public.refund_requests;
CREATE TRIGGER on_refund_requests_updated
    BEFORE UPDATE ON public.refund_requests
    FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own refund_requests"
    ON public.refund_requests FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admin has all access to refund_requests"
    ON public.refund_requests TO authenticated
    USING (public.is_admin());
