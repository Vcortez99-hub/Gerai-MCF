-- Create presentation_history table
CREATE TABLE IF NOT EXISTS presentation_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  briefing TEXT NOT NULL,
  template_id VARCHAR(100) NOT NULL,
  template_name VARCHAR(255),
  config JSONB DEFAULT '{}',
  ai_content JSONB NOT NULL,
  generated_file_path VARCHAR(500),
  generated_file_url VARCHAR(500),
  status VARCHAR(50) DEFAULT 'completed',
  generation_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_presentation_history_user_id ON presentation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_presentation_history_created_at ON presentation_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_presentation_history_status ON presentation_history(status);

-- Add RLS (Row Level Security) policies
ALTER TABLE presentation_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own presentations
CREATE POLICY "Users can view own presentations"
  ON presentation_history FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can only insert their own presentations
CREATE POLICY "Users can insert own presentations"
  ON presentation_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own presentations
CREATE POLICY "Users can update own presentations"
  ON presentation_history FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can only delete their own presentations
CREATE POLICY "Users can delete own presentations"
  ON presentation_history FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_presentation_history_updated_at
  BEFORE UPDATE ON presentation_history
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create user_stats view for analytics
CREATE OR REPLACE VIEW user_presentation_stats AS
SELECT
  user_id,
  COUNT(*) as total_presentations,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_presentations,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_presentations,
  AVG(generation_time_ms) as avg_generation_time_ms,
  MIN(created_at) as first_presentation,
  MAX(created_at) as last_presentation
FROM presentation_history
GROUP BY user_id;

-- Grant permissions
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT SELECT ON auth.users TO postgres, anon, authenticated, service_role;