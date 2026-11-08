-- Estructura adicional de INFINITO LAB: mercado y certificados, NO usar para token real.
PRAGMA foreign_keys=ON;

CREATE TABLE inft_market_snapshots (
 slot INTEGER NOT NULL PRIMARY KEY,
 captured_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 index_bps INTEGER NOT NULL CHECK(index_bps BETWEEN 1000 AND 30000),
 buys_milli INTEGER NOT NULL DEFAULT 0,
 sells_milli INTEGER NOT NULL DEFAULT 0,
 inft_users INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE inft_physical_certificates (
 serial TEXT NOT NULL PRIMARY KEY,
 user_id TEXT NOT NULL REFERENCES wallets(user_id),
 proof_hash TEXT NOT NULL UNIQUE,
 value_milli INTEGER NOT NULL DEFAULT 1000 CHECK(value_milli=1000),
 status TEXT NOT NULL DEFAULT 'reserved' CHECK(status IN ('reserved','cancelled')),
 nonce TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 updated_at TEXT,
 UNIQUE(user_id,nonce)
);

CREATE INDEX inft_physical_created ON inft_physical_certificates(created_at DESC);

CREATE INDEX inft_physical_owner_created ON inft_physical_certificates(user_id,created_at DESC);

CREATE TRIGGER inft_physical_cancel_commit AFTER UPDATE OF status ON inft_physical_certificates
WHEN OLD.status='reserved' AND NEW.status='cancelled'
BEGIN
 UPDATE wallets SET inft_milli=inft_milli+OLD.value_milli WHERE user_id=NEW.user_id;
END;

CREATE TRIGGER inft_physical_no_reopen BEFORE UPDATE OF status ON inft_physical_certificates
WHEN OLD.status='cancelled' AND NEW.status!='cancelled'
BEGIN
 SELECT RAISE(ABORT,'cannot_reopen');
END;

CREATE TRIGGER inft_physical_reserve_commit AFTER INSERT ON inft_physical_certificates
BEGIN
 UPDATE wallets SET inft_milli=inft_milli-1000 WHERE user_id=NEW.user_id;
END;

CREATE TRIGGER inft_physical_reserve_guard BEFORE INSERT ON inft_physical_certificates
BEGIN
 SELECT CASE WHEN (SELECT COALESCE(inft_milli,0) FROM wallets WHERE user_id=NEW.user_id)<1000
 THEN RAISE(ABORT,'insufficient_inft') END;
 SELECT CASE WHEN (SELECT COUNT(*) FROM inft_physical_certificates WHERE user_id=NEW.user_id AND status='reserved')>=10
 THEN RAISE(ABORT,'user_certificate_limit') END;
 SELECT CASE WHEN (SELECT COUNT(*) FROM inft_physical_certificates WHERE status='reserved')>=1000
 THEN RAISE(ABORT,'edition_certificate_limit') END;
END;
