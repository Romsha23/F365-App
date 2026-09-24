# Database Migration Guide - Flow 365

## Database: Supabase (PostgreSQL)

**Supabase URL**: `https://dibuhpxjzgaxvvrbkofk.supabase.co`

---

## 🎯 Privacy-First Schema (NO PII)

This schema does **NOT** collect:
- ❌ Names
- ❌ Email addresses  
- ❌ Phone numbers
- ❌ Any personally identifiable information

We only store:
- ✅ Anonymous user IDs (UUID)
- ✅ Health tracking data
- ✅ Timestamps
- ✅ Subscription status

---

## 📊 Database Schema

### 1️⃣ Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_premium BOOLEAN DEFAULT FALSE,
  average_cycle_length INTEGER DEFAULT 28,
  average_period_length INTEGER DEFAULT 5,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  insights_enabled BOOLEAN DEFAULT TRUE,
  onboarded BOOLEAN DEFAULT FALSE
);
```

**Indexes**:
```sql
CREATE INDEX idx_users_premium ON users(is_premium);
CREATE INDEX idx_users_created ON users(created_at DESC);
```

---

### 2️⃣ Mood Logs Table
```sql
CREATE TABLE mood_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mood_score INTEGER NOT NULL CHECK (mood_score >= 1 AND mood_score <= 100),
  intensity INTEGER CHECK (intensity >= 1 AND intensity <= 5),
  emoji TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes**:
```sql
CREATE INDEX idx_mood_logs_user_date ON mood_logs(user_id, created_at DESC);
CREATE INDEX idx_mood_logs_score ON mood_logs(user_id, mood_score);
```

---

### 3️⃣ Symptom Logs Table
```sql
CREATE TABLE symptom_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  cycle_day INTEGER,
  symptoms JSONB DEFAULT '[]'::jsonb,
  moods TEXT[] DEFAULT ARRAY[]::TEXT[],
  notes TEXT,
  flow_intensity TEXT,
  discharge_type TEXT,
  pain_level TEXT,
  cravings TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);
```

**Indexes**:
```sql
CREATE INDEX idx_symptom_logs_user_date ON symptom_logs(user_id, date DESC);
CREATE INDEX idx_symptom_logs_cycle ON symptom_logs(user_id, cycle_day);
CREATE INDEX idx_symptom_logs_symptoms_gin ON symptom_logs USING GIN (symptoms);
```

---

### 4️⃣ Custom Symptoms Table
```sql
CREATE TABLE custom_symptoms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes**:
```sql
CREATE INDEX idx_custom_symptoms_user ON custom_symptoms(user_id);
```

---

### 5️⃣ Lifestyle Logs Table (Optional - Future Use)
```sql
CREATE TABLE lifestyle_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sleep_hours FLOAT,
  exercise_minutes INTEGER,
  water_intake_ml INTEGER,
  stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  date DATE NOT NULL,
  UNIQUE(user_id, date)
);
```

**Indexes**:
```sql
CREATE INDEX idx_lifestyle_logs_user_date ON lifestyle_logs(user_id, date DESC);
```

---

### 6️⃣ AI Predictions Table
```sql
CREATE TABLE ai_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  predicted_mood INTEGER CHECK (predicted_mood >= 0 AND predicted_mood <= 100),
  confidence FLOAT CHECK (confidence >= 0 AND confidence <= 1),
  prediction_date DATE NOT NULL,
  prediction_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes**:
```sql
CREATE INDEX idx_ai_predictions_user_date ON ai_predictions(user_id, prediction_date DESC);
CREATE INDEX idx_ai_predictions_type ON ai_predictions(user_id, prediction_type);
```

---

### 7️⃣ Cycle Predictions Table
```sql
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  next_period_date DATE NOT NULL,
  fertile_window_start DATE NOT NULL,
  fertile_window_end DATE NOT NULL,
  average_cycle_length INTEGER NOT NULL,
  average_period_length INTEGER NOT NULL,
  confidence NUMERIC(3,2) DEFAULT 0.8,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes**:
```sql
CREATE INDEX idx_predictions_user ON predictions(user_id);
CREATE INDEX idx_predictions_next_period ON predictions(user_id, next_period_date DESC);
```

---

### 8️⃣ AI Insights Table
```sql
CREATE TABLE ai_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes**:
```sql
CREATE INDEX idx_ai_insights_user_read ON ai_insights(user_id, read, created_at DESC);
CREATE INDEX idx_ai_insights_type ON ai_insights(user_id, type);
```

---

## 🔐 Row Level Security (RLS)

Enable RLS on all tables:

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE symptom_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_symptoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE lifestyle_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
```

### RLS Policies

**Users can only access their own data**:

```sql
-- Users table
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own data" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Mood logs
CREATE POLICY "Users can manage own mood logs" ON mood_logs
  FOR ALL USING (auth.uid() = user_id);

-- Symptom logs
CREATE POLICY "Users can manage own symptom logs" ON symptom_logs
  FOR ALL USING (auth.uid() = user_id);

-- Custom symptoms
CREATE POLICY "Users can manage own custom symptoms" ON custom_symptoms
  FOR ALL USING (auth.uid() = user_id);

-- Lifestyle logs
CREATE POLICY "Users can manage own lifestyle logs" ON lifestyle_logs
  FOR ALL USING (auth.uid() = user_id);

-- AI predictions
CREATE POLICY "Users can view own predictions" ON ai_predictions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert predictions" ON ai_predictions
  FOR INSERT WITH CHECK (true);

-- Cycle predictions
CREATE POLICY "Users can manage own predictions" ON predictions
  FOR ALL USING (auth.uid() = user_id);

-- AI insights
CREATE POLICY "Users can view own insights" ON ai_insights
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own insights" ON ai_insights
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert insights" ON ai_insights
  FOR INSERT WITH CHECK (true);
```

---

## 🚀 Migration Methods

### Method 1: Automatic Migration (Recommended)

1. Set environment variables in `.env`:
```env
SUPABASE_URL=https://dibuhpxjzgaxvvrbkofk.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here
```

2. Run migration through the app:
   - Navigate to `/setup-database` in the app
   - Click "Run Migration"

---

### Method 2: Manual Migration (Most Reliable)

1. Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/dibuhpxjzgaxvvrbkofk/sql)

2. Copy the complete SQL script from `docs/MIGRATION_SCRIPT.sql`

3. Paste and execute in SQL Editor

4. Verify tables are created successfully

---

### Method 3: tRPC Endpoint

```typescript
// Call from frontend
const result = await trpc.db.migrate.query();
console.log(result);
```

---

## 📈 Scalability Considerations

### Database Performance

1. **Connection Pooling**: Supabase provides automatic connection pooling
   - Default: 15 connections per client
   - Scales to thousands of concurrent users

2. **Indexes**: All critical queries have indexes
   - User-based lookups: O(log n)
   - Date range queries: Optimized with composite indexes
   - JSONB queries: GIN indexes for symptom data

3. **Partitioning Strategy** (for 1M+ users):
```sql
-- Partition symptom_logs by month
CREATE TABLE symptom_logs_2025_01 PARTITION OF symptom_logs
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- Partition mood_logs by month
CREATE TABLE mood_logs_2025_01 PARTITION OF mood_logs
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

4. **Read Replicas**: Supabase Pro provides read replicas for scaling reads

5. **Caching Strategy**:
   - Use React Query for client-side caching
   - Cache predictions for 1 hour
   - Cache user settings indefinitely

---

## 🔍 Monitoring & Maintenance

### Key Metrics to Track

```sql
-- Active users
SELECT COUNT(DISTINCT user_id) 
FROM mood_logs 
WHERE created_at > NOW() - INTERVAL '30 days';

-- Database size
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Slow queries
SELECT * FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

---

## 🗄️ Data Retention Policy

```sql
-- Delete old predictions (keep 90 days)
DELETE FROM ai_predictions 
WHERE created_at < NOW() - INTERVAL '90 days';

-- Archive old logs (optional)
CREATE TABLE symptom_logs_archive AS 
SELECT * FROM symptom_logs 
WHERE created_at < NOW() - INTERVAL '365 days';

DELETE FROM symptom_logs 
WHERE created_at < NOW() - INTERVAL '365 days';
```

---

## 🔄 Backup Strategy

Supabase automatically provides:
- **Daily backups** (Free tier: 7 days retention)
- **Point-in-time recovery** (Pro tier: 30 days)
- **Export options**: SQL dumps, CSV exports

Manual backup:
```bash
# Export entire database
pg_dump -h db.dibuhpxjzgaxvvrbkofk.supabase.co \
  -U postgres \
  -d postgres \
  > backup_$(date +%Y%m%d).sql
```

---

## 🔧 Troubleshooting

### Common Issues

**1. Migration fails with "relation already exists"**
- Tables already exist
- Solution: Drop tables or use `IF NOT EXISTS`

**2. RLS blocks all queries**
- auth.uid() returns null
- Solution: Ensure user is authenticated or use service role key

**3. Slow queries**
- Missing indexes
- Solution: Run `EXPLAIN ANALYZE` and add indexes

**4. Connection limits reached**
- Too many concurrent connections
- Solution: Upgrade plan or implement connection pooling

---

## 📞 Support

- **Supabase Dashboard**: https://supabase.com/dashboard/project/dibuhpxjzgaxvvrbkofk
- **Supabase Docs**: https://supabase.com/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs/

---

## ✅ Post-Migration Checklist

- [ ] All tables created successfully
- [ ] Indexes created
- [ ] RLS enabled on all tables
- [ ] RLS policies created
- [ ] Test insert/update/delete operations
- [ ] Verify auth.uid() returns correct user ID
- [ ] Test queries with React Query
- [ ] Monitor performance metrics
- [ ] Set up automated backups
- [ ] Configure alerts for errors
