-- Repair admin user created by incomplete 0002 seed (fixes "Database error querying schema")
DO $$
DECLARE
  admin_uid UUID;
  admin_email TEXT := 'f365@admin.app';
BEGIN
  SELECT id INTO admin_uid FROM auth.users WHERE email = admin_email LIMIT 1;

  IF admin_uid IS NULL THEN
    RETURN;
  END IF;

  UPDATE auth.users
  SET
    confirmation_token = COALESCE(confirmation_token, ''),
    email_change = COALESCE(email_change, ''),
    email_change_token_new = COALESCE(email_change_token_new, ''),
    recovery_token = COALESCE(recovery_token, ''),
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    updated_at = now()
  WHERE id = admin_uid;

  IF NOT EXISTS (
    SELECT 1 FROM auth.identities
    WHERE user_id = admin_uid AND provider = 'email'
  ) THEN
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

  UPDATE public.user_roles
  SET role = 'admin'::app_role
  WHERE user_id = admin_uid;

END $$;
