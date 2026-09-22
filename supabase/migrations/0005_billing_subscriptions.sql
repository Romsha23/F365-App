-- Billing tables (subscriptions, orders, transactions) in this Supabase project

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    user_email TEXT NOT NULL,
    plan TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    stripe_subscription_id TEXT UNIQUE,
    stripe_customer_id TEXT,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    queued_plan TEXT,
    queued_start_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub ON public.subscriptions(stripe_subscription_id);

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    user_email TEXT,
    type TEXT NOT NULL,
    amount NUMERIC(10,2) DEFAULT 0,
    currency TEXT DEFAULT 'AUD',
    status TEXT NOT NULL DEFAULT 'completed',
    stripe_payment_id TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);

CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    user_email TEXT,
    type TEXT NOT NULL,
    amount NUMERIC(10,2) DEFAULT 0,
    currency TEXT DEFAULT 'AUD',
    status TEXT NOT NULL DEFAULT 'completed',
    stripe_id TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages subscriptions" ON public.subscriptions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role manages orders" ON public.orders FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role manages transactions" ON public.transactions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Default Stripe price IDs (override via env or pricing_plans table)
INSERT INTO public.pricing_plans (plan_key, name, description, price, currency, billing_interval, stripe_price_id, is_active, sort_order)
VALUES
    ('plus_monthly', 'Plus Monthly', 'Premium features billed monthly.', 9.99, 'AUD', 'month', 'price_1SXuFd7fQuFoYSVZvgZSOTWJ', true, 2),
    ('plus_annual', 'Plus Annual', 'Premium features billed annually.', 99.99, 'AUD', 'year', 'price_1SXtPK7fQuFoYSVZjaZ6RyV2', true, 3)
ON CONFLICT (plan_key) DO UPDATE SET
    stripe_price_id = COALESCE(EXCLUDED.stripe_price_id, public.pricing_plans.stripe_price_id),
    price = EXCLUDED.price;
