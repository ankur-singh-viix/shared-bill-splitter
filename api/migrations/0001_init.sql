CREATE TABLE homes (
  id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CONSTRAINT pk_homes PRIMARY KEY (id),
  CONSTRAINT ck_homes_name_valid CHECK (length(trim(name)) BETWEEN 1 AND 100)
);

-- position is the 1-based insertion order of a member within its home.
CREATE TABLE members (
  id TEXT NOT NULL,
  home_id TEXT NOT NULL,
  name TEXT NOT NULL,
  position INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CONSTRAINT pk_members PRIMARY KEY (id),
  CONSTRAINT fk_members_home FOREIGN KEY (home_id) REFERENCES homes (id),
  CONSTRAINT ck_members_name_valid CHECK (length(trim(name)) BETWEEN 1 AND 100),
  CONSTRAINT ck_members_position_positive CHECK (position >= 1),
  CONSTRAINT uq_members_home_position UNIQUE (home_id, position)
);

CREATE TABLE bills (
  id TEXT NOT NULL,
  home_id TEXT NOT NULL,
  title TEXT NOT NULL,
  total_cents INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CONSTRAINT pk_bills PRIMARY KEY (id),
  CONSTRAINT fk_bills_home FOREIGN KEY (home_id) REFERENCES homes (id),
  CONSTRAINT ck_bills_title_valid CHECK (length(trim(title)) BETWEEN 1 AND 200),
  CONSTRAINT ck_bills_total_positive CHECK (total_cents > 0)
);

-- A share is unpaid while paid_at and idempotency_key are both NULL.
CREATE TABLE shares (
  id TEXT NOT NULL,
  bill_id TEXT NOT NULL,
  member_id TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  paid_at TEXT,
  idempotency_key TEXT,
  CONSTRAINT pk_shares PRIMARY KEY (id),
  CONSTRAINT fk_shares_bill FOREIGN KEY (bill_id) REFERENCES bills (id),
  CONSTRAINT fk_shares_member FOREIGN KEY (member_id) REFERENCES members (id),
  CONSTRAINT ck_shares_amount_nonnegative CHECK (amount_cents >= 0),
  CONSTRAINT ck_shares_payment_consistent CHECK ((paid_at IS NULL) = (idempotency_key IS NULL)),
  CONSTRAINT uq_shares_bill_member UNIQUE (bill_id, member_id)
);

CREATE INDEX idx_bills_home ON bills (home_id);
CREATE INDEX idx_shares_member ON shares (member_id);
CREATE UNIQUE INDEX uq_shares_idempotency_key ON shares (idempotency_key) WHERE idempotency_key IS NOT NULL;
