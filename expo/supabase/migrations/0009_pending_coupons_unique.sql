-- Remove duplicate pending_coupons rows before adding unique constraint

DELETE FROM public.pending_coupons
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY user_id, coupon_id ORDER BY created_at ASC
    ) AS rn
    FROM public.pending_coupons
  ) sub
  WHERE rn > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pending_coupons_user_coupon
    ON public.pending_coupons(user_id, coupon_id);
