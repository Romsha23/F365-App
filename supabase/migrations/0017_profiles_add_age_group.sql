-- Add age_group column to profiles table
-- Stores an encrypted/obfuscated age group ('teen', 'young_adult', 'adult', 'mature')
-- instead of the raw birth year to protect user privacy.
-- This allows the age gate to persist across sessions without storing PII.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS age_group TEXT DEFAULT NULL;

-- Add a check constraint to ensure only valid values are stored
ALTER TABLE profiles
  ADD CONSTRAINT profiles_age_group_check
  CHECK (age_group IS NULL OR age_group IN ('teen', 'young_adult', 'adult', 'mature'));
