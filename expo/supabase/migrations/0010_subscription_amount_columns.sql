ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS amount NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'AUD';

-- Backfill existing rows from pricing_plans defaults
UPDATE public.subscriptions s
SET amount = pp.price, currency = pp.currency
FROM public.pricing_plans pp
WHERE (s.amount IS NULL OR s.amount = 0)
  AND ((s.plan = 'monthly' AND pp.plan_key = 'plus_monthly')
    OR (s.plan = 'yearly' AND pp.plan_key = 'plus_annual'));
