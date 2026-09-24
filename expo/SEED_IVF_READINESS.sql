-- ============================================
-- SEED DATA: IVF Readiness Assessments
-- ============================================
-- Insert dummy assessments for the demo user.
-- Replace the user_id with your actual auth.users UUID.
-- To find your user_id, run:
--   SELECT id FROM auth.users LIMIT 5;
-- Then replace 'YOUR_USER_ID_HERE' below.

-- Example: Low risk assessment
INSERT INTO ivf_readiness_assessments (user_id, total_score, category, sub_scores, predictions, actions, input_data, created_at)
VALUES (
  (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1),
  24,
  'low',
  '{
    "age": {"label": "Age Impact", "score": 5, "maxScore": 25, "level": "low", "description": "Age is on your side for natural conception."},
    "cycle": {"label": "Cycle Health", "score": 5, "maxScore": 20, "level": "low", "description": "Regular cycles suggest healthy ovulation patterns."},
    "timeToConceive": {"label": "Time Trying", "score": 5, "maxScore": 20, "level": "low", "description": "Still early — most couples conceive within 12 months."},
    "medical": {"label": "Medical Factors", "score": 0, "maxScore": 15, "level": "low", "description": "No significant medical risk factors identified."},
    "ovulation": {"label": "Ovulation Confidence", "score": 2, "maxScore": 10, "level": "low", "description": "Consistent ovulation detected from your tracking data."},
    "symptoms": {"label": "Symptom Severity", "score": 7, "maxScore": 10, "level": "high", "description": "Significant symptoms may indicate underlying hormonal imbalance."}
  }'::jsonb,
  '{"interventionLikelihood": 20, "naturalConceptionLikelihood": 72}'::jsonb,
  ARRAY['Continue regular cycle tracking and healthy lifestyle habits.', 'Track symptom patterns to share with your provider.'],
  '{
    "ageRange": "25_29",
    "cycleRegularity": "regular",
    "timeConceiving": "under_6",
    "ovulationConfidence": "consistent",
    "medicalHistory": {"pcos": false, "endometriosis": false, "thyroidIssue": false, "previousMiscarriage": false, "previousIVF": false, "fibroids": false},
    "symptomProfile": {"painSeverity": "low", "irregularBleeding": false, "hormonalAcne": false, "moodSwings": "low"},
    "tryingToConceive": true,
    "stressLevel": "moderate"
  }'::jsonb,
  now() - interval '14 days'
);

-- Example: Watch risk assessment
INSERT INTO ivf_readiness_assessments (user_id, total_score, category, sub_scores, predictions, actions, input_data, created_at)
VALUES (
  (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1),
  48,
  'watch',
  '{
    "age": {"label": "Age Impact", "score": 10, "maxScore": 25, "level": "moderate", "description": "Fertility begins a gradual decline around 30."},
    "cycle": {"label": "Cycle Health", "score": 10, "maxScore": 20, "level": "moderate", "description": "Mildly irregular cycles may indicate minor hormonal variations."},
    "timeToConceive": {"label": "Time Trying", "score": 10, "maxScore": 20, "level": "moderate", "description": "6-12 months is normal but worth monitoring closely."},
    "medical": {"label": "Medical Factors", "score": 4, "maxScore": 15, "level": "low", "description": "PCOS noted. Continue monitoring."},
    "ovulation": {"label": "Ovulation Confidence", "score": 6, "maxScore": 10, "level": "moderate", "description": "Ovulation patterns are uncertain — consider OPK testing."},
    "symptoms": {"label": "Symptom Severity", "score": 8, "maxScore": 10, "level": "high", "description": "Significant symptoms may indicate underlying hormonal imbalance."}
  }'::jsonb,
  '{"interventionLikelihood": 38, "naturalConceptionLikelihood": 55}'::jsonb,
  ARRAY['Improve ovulation tracking for at least 2 more cycles.', 'Discuss cycle irregularities with your healthcare provider.', 'Continue regular cycle tracking and healthy lifestyle habits.', 'Track symptom patterns to share with your provider.'],
  '{
    "ageRange": "30_34",
    "cycleRegularity": "mildly_irregular",
    "timeConceiving": "6_12",
    "ovulationConfidence": "uncertain",
    "medicalHistory": {"pcos": true, "endometriosis": false, "thyroidIssue": false, "previousMiscarriage": false, "previousIVF": false, "fibroids": false},
    "symptomProfile": {"painSeverity": "moderate", "irregularBleeding": true, "hormonalAcne": true, "moodSwings": "moderate"},
    "tryingToConceive": true,
    "stressLevel": "high"
  }'::jsonb,
  now() - interval '7 days'
);

-- Example: High risk assessment (most recent)
INSERT INTO ivf_readiness_assessments (user_id, total_score, category, sub_scores, predictions, actions, input_data, created_at)
VALUES (
  (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1),
  72,
  'high',
  '{
    "age": {"label": "Age Impact", "score": 18, "maxScore": 25, "level": "high", "description": "Fertility declines more noticeably after 35."},
    "cycle": {"label": "Cycle Health", "score": 18, "maxScore": 20, "level": "high", "description": "Highly irregular cycles often indicate ovulation issues."},
    "timeToConceive": {"label": "Time Trying", "score": 16, "maxScore": 20, "level": "high", "description": "After 12 months, a specialist consultation is recommended."},
    "medical": {"label": "Medical Factors", "score": 7, "maxScore": 15, "level": "moderate", "description": "PCOS, Endometriosis detected. Monitor closely with your healthcare provider."},
    "ovulation": {"label": "Ovulation Confidence", "score": 6, "maxScore": 10, "level": "moderate", "description": "Ovulation patterns are uncertain — consider OPK testing."},
    "symptoms": {"label": "Symptom Severity", "score": 7, "maxScore": 10, "level": "high", "description": "Significant symptoms may indicate underlying hormonal imbalance."}
  }'::jsonb,
  '{"interventionLikelihood": 68, "naturalConceptionLikelihood": 25}'::jsonb,
  ARRAY['Consult a fertility specialist within 1-3 months.', 'Improve ovulation tracking for at least 2 more cycles.', 'Discuss cycle irregularities with your healthcare provider.', 'Consider hormonal testing (AMH, FSH, LH, thyroid panel).', 'Consider egg quality assessment (AMH blood test).'],
  '{
    "ageRange": "35_37",
    "cycleRegularity": "highly_irregular",
    "timeConceiving": "12_18",
    "ovulationConfidence": "uncertain",
    "medicalHistory": {"pcos": true, "endometriosis": true, "thyroidIssue": false, "previousMiscarriage": false, "previousIVF": false, "fibroids": false},
    "symptomProfile": {"painSeverity": "high", "irregularBleeding": true, "hormonalAcne": false, "moodSwings": "high"},
    "tryingToConceive": true,
    "stressLevel": "high"
  }'::jsonb,
  now()
);
