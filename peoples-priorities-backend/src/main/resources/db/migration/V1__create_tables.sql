CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE constituencies (
  id             VARCHAR(50) PRIMARY KEY,
  name           VARCHAR(255) NOT NULL,
  state          VARCHAR(100),
  mp_name        VARCHAR(255),
  mp_user_id     VARCHAR(255)
);

CREATE TABLE themes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  constituency_id   VARCHAR(50) REFERENCES constituencies(id),
  label             VARCHAR(255) NOT NULL,
  submission_count  INT DEFAULT 0,
  ai_summary        TEXT,
  last_updated      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE submissions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_id         VARCHAR(255),
  constituency_id    VARCHAR(50) REFERENCES constituencies(id),
  type               VARCHAR(20) NOT NULL CHECK (type IN ('text','voice','photo')),
  raw_content        TEXT,
  translated_content TEXT,
  language_detected  VARCHAR(10),
  category           VARCHAR(50),
  lat                DECIMAL(9,6),
  lng                DECIMAL(9,6),
  ward               VARCHAR(100),
  gcs_uri            VARCHAR(500),
  status             VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','clustered','rejected')),
  theme_id           UUID REFERENCES themes(id),
  created_at         TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE priorities (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  constituency_id VARCHAR(50) REFERENCES constituencies(id),
  theme_id        UUID REFERENCES themes(id),
  rank            INT,
  score           DECIMAL(5,2),
  evidence        TEXT,
  status          VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','approved','flagged')),
  approved_by     VARCHAR(255),
  approved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_submissions_constituency ON submissions(constituency_id);
CREATE INDEX idx_submissions_theme ON submissions(theme_id);
CREATE INDEX idx_submissions_created ON submissions(created_at DESC);
CREATE INDEX idx_priorities_constituency_rank ON priorities(constituency_id, rank);
