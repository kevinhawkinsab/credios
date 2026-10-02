

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  identification VARCHAR(50),
  role VARCHAR(20) NOT NULL DEFAULT 'USER',
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  revoked_reason VARCHAR(255),
  last_used_at TIMESTAMPTZ,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS credit_requests (
  id UUID PRIMARY KEY,
  request_number VARCHAR(30) NOT NULL UNIQUE,
  applicant_id UUID NOT NULL REFERENCES users(id),
  created_by UUID NOT NULL REFERENCES users(id),
  amount NUMERIC(12, 2) NOT NULL,
  term_months SMALLINT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  decision_comment VARCHAR(1000),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);
CREATE INDEX IF NOT EXISTS users_status_idx ON users(status);
CREATE INDEX IF NOT EXISTS refresh_tokens_user_id_idx ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS refresh_tokens_expires_at_idx ON refresh_tokens(expires_at);
CREATE INDEX IF NOT EXISTS credit_requests_applicant_idx ON credit_requests(applicant_id);
CREATE INDEX IF NOT EXISTS credit_requests_created_by_idx ON credit_requests(created_by);
CREATE INDEX IF NOT EXISTS credit_requests_reviewed_by_idx ON credit_requests(reviewed_by);
CREATE INDEX IF NOT EXISTS credit_requests_status_created_idx ON credit_requests(status, created_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'credit_requests_amount_range_check'
  ) THEN
    ALTER TABLE credit_requests
      ADD CONSTRAINT credit_requests_amount_range_check
      CHECK (amount >= 500 AND amount <= 50000);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'credit_requests_term_months_range_check'
  ) THEN
    ALTER TABLE credit_requests
      ADD CONSTRAINT credit_requests_term_months_range_check
      CHECK (term_months >= 6 AND term_months <= 60);
  END IF;
END $$;
