-- INFINITO TESTNET D1 ONLY. No real tokens or reserves.
PRAGMA foreign_keys=ON;

CREATE TABLE _cf_KV (
        key TEXT PRIMARY KEY,
        value BLOB
      ) WITHOUT ROWID;

CREATE TABLE faucet_claims (
 id TEXT PRIMARY KEY,
 user_id TEXT NOT NULL UNIQUE REFERENCES wallets(user_id),
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE history (
 id TEXT PRIMARY KEY NOT NULL,
 actor TEXT NOT NULL,
 from_address TEXT,
 to_address TEXT,
 kind TEXT NOT NULL CHECK(kind IN ('faucet','send','buy','sell','physical')),
 inft_milli INTEGER NOT NULL,
 coin_delta INTEGER NOT NULL DEFAULT 0,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE physical_claims (
 id TEXT PRIMARY KEY,
 user_id TEXT NOT NULL REFERENCES wallets(user_id),
 serial TEXT NOT NULL CHECK(serial='INFT-DEMO-2026'),
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 UNIQUE(user_id,serial)
);

CREATE TABLE swaps (
 id TEXT PRIMARY KEY,
 user_id TEXT NOT NULL REFERENCES wallets(user_id),
 direction TEXT NOT NULL CHECK(direction IN ('buy','sell')),
 coins INTEGER NOT NULL CHECK(coins>=10 AND coins<=1000 AND coins%10=0),
 nonce TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 UNIQUE(user_id,nonce)
);

CREATE TABLE transfers (
 id TEXT PRIMARY KEY,
 sender TEXT NOT NULL REFERENCES wallets(user_id),
 recipient_address TEXT NOT NULL REFERENCES wallets(address),
 amount INTEGER NOT NULL CHECK(amount>0 AND amount<=1000000),
 nonce TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 UNIQUE(sender,nonce)
);

CREATE TABLE wallets (
 user_id TEXT PRIMARY KEY NOT NULL,
 address TEXT NOT NULL UNIQUE,
 inft_milli INTEGER NOT NULL DEFAULT 0 CHECK(inft_milli>=0),
 test_coins INTEGER NOT NULL DEFAULT 0 CHECK(test_coins>=0),
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX history_actor_time ON history(actor,created_at DESC);

CREATE INDEX history_time ON history(created_at DESC);

CREATE TRIGGER faucet_grant AFTER INSERT ON faucet_claims BEGIN
 UPDATE wallets SET inft_milli=inft_milli+100000,test_coins=test_coins+1000 WHERE user_id=NEW.user_id;
 INSERT INTO history(id,actor,from_address,to_address,kind,inft_milli,coin_delta)
 SELECT NEW.id,NEW.user_id,NULL,address,'faucet',100000,1000 FROM wallets WHERE user_id=NEW.user_id;
END;

CREATE TRIGGER physical_grant AFTER INSERT ON physical_claims BEGIN
 UPDATE wallets SET inft_milli=inft_milli+5000 WHERE user_id=NEW.user_id;
 INSERT INTO history(id,actor,from_address,to_address,kind,inft_milli,coin_delta)
 SELECT NEW.id,NEW.user_id,NULL,address,'physical',5000,0 FROM wallets WHERE user_id=NEW.user_id;
END;

CREATE TRIGGER swaps_commit AFTER INSERT ON swaps BEGIN
 UPDATE wallets SET
  inft_milli=inft_milli+(CASE NEW.direction WHEN 'buy' THEN NEW.coins*100 ELSE -NEW.coins*100 END),
  test_coins=test_coins+(CASE NEW.direction WHEN 'buy' THEN -NEW.coins ELSE NEW.coins END)
 WHERE user_id=NEW.user_id;
 INSERT INTO history(id,actor,from_address,to_address,kind,inft_milli,coin_delta)
 SELECT NEW.id,NEW.user_id,address,address,NEW.direction,NEW.coins*100,CASE NEW.direction WHEN 'buy' THEN -NEW.coins ELSE NEW.coins END
 FROM wallets WHERE user_id=NEW.user_id;
END;

CREATE TRIGGER swaps_guard BEFORE INSERT ON swaps BEGIN
 SELECT CASE WHEN NEW.direction='buy' AND (SELECT test_coins FROM wallets WHERE user_id=NEW.user_id)<NEW.coins THEN RAISE(ABORT,'insufficient_coins') END;
 SELECT CASE WHEN NEW.direction='sell' AND (SELECT inft_milli FROM wallets WHERE user_id=NEW.user_id)<(NEW.coins*100) THEN RAISE(ABORT,'insufficient_inft') END;
 SELECT CASE WHEN (SELECT COUNT(*) FROM history WHERE actor=NEW.user_id AND datetime(created_at)>datetime('now','-1 day'))>=100 THEN RAISE(ABORT,'daily_limit') END;
END;

CREATE TRIGGER transfer_commit AFTER INSERT ON transfers BEGIN
 UPDATE wallets SET inft_milli=inft_milli-NEW.amount WHERE user_id=NEW.sender;
 UPDATE wallets SET inft_milli=inft_milli+NEW.amount WHERE address=NEW.recipient_address;
 INSERT INTO history(id,actor,from_address,to_address,kind,inft_milli,coin_delta)
 SELECT NEW.id,NEW.sender,(SELECT address FROM wallets WHERE user_id=NEW.sender),NEW.recipient_address,'send',NEW.amount,0;
END;

CREATE TRIGGER transfer_guard BEFORE INSERT ON transfers BEGIN
 SELECT CASE WHEN (SELECT address FROM wallets WHERE user_id=NEW.sender)=NEW.recipient_address THEN RAISE(ABORT,'self_transfer') END;
 SELECT CASE WHEN (SELECT inft_milli FROM wallets WHERE user_id=NEW.sender)<NEW.amount THEN RAISE(ABORT,'insufficient_inft') END;
 SELECT CASE WHEN (SELECT COUNT(*) FROM history WHERE actor=NEW.sender AND datetime(created_at)>datetime('now','-1 day'))>=100 THEN RAISE(ABORT,'daily_limit') END;
END;
