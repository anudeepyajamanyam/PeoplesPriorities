-- V3: Add performance indexes for high scale queries

-- Index for filtering/sorting submissions by constituency and status (highly used in clustering & stats)
CREATE INDEX IF NOT EXISTS idx_submissions_constituency_status ON submissions(constituency_id, status);

-- Index for filtering submissions by status alone
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);

-- Index for mapping themes to constituencies
CREATE INDEX IF NOT EXISTS idx_themes_constituency_id ON themes(constituency_id);

-- Index for filtering priorities by status (e.g. pending vs approved)
CREATE INDEX IF NOT EXISTS idx_priorities_status ON priorities(status);

-- Index for finding submissions by type (for filtering/analytics)
CREATE INDEX IF NOT EXISTS idx_submissions_type ON submissions(type);
