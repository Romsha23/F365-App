import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"

export async function assertCountryFeatureAllowed(
  client: SupabaseClient,
  countryCode: string | null | undefined,
  featureKey: string
): Promise<void> {
  if (!countryCode) return;

  const code = countryCode.toUpperCase();

  const { data: access, error: accessError } = await client
    .from("country_access")
    .select("is_allowed, block_message")
    .eq("country_code", code)
    .maybeSingle();

  if (accessError) throw accessError;
  if (access && !access.is_allowed) {
    throw new Error(
      access.block_message || "This service is not available in your region."
    );
  }

  const { data: flag, error: flagError } = await client
    .from("country_feature_flags")
    .select("enabled")
    .eq("country_code", code)
    .eq("feature_key", featureKey)
    .maybeSingle();

  if (flagError) throw flagError;
  if (flag && !flag.enabled) {
    throw new Error("This feature is not available in your region.");
  }
}
