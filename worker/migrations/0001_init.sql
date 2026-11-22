-- Persönliche App – Push- und Sync-Dienst, D1-Schema (Architektur 8.2)
-- Veröffentlichte Migrationen werden NIE geändert. Änderungen = neue Datei 0002_….sql

-- Konto (genau eine Zeile; persönliche App = ein Nutzer)
CREATE TABLE account (
  id             INTEGER PRIMARY KEY CHECK (id = 1),
  auth_hash      TEXT NOT NULL,              -- SHA-256 des Login-Schlüssels (base64url)
  kdf_salt       TEXT NOT NULL,              -- Salt der Schlüsselableitung (öffentlich)
  kdf_iter       INTEGER NOT NULL,           -- PBKDF2-Iterationen
  timezone       TEXT NOT NULL DEFAULT 'Europe/Berlin',
  quiet_start    INTEGER,                    -- Ruhezeit Beginn, Minuten nach Mitternacht, NULL = aus
  quiet_end      INTEGER,                    -- Ruhezeit Ende
  break_deadline INTEGER NOT NULL DEFAULT 0, -- Abgabe-Erinnerungen dürfen die Ruhezeit durchbrechen
  created_at     INTEGER NOT NULL
);

CREATE TABLE devices (
  id            TEXT PRIMARY KEY,
  token_hash    TEXT NOT NULL UNIQUE,        -- SHA-256 des Geräte-Tokens (Token selbst nie gespeichert)
  name          TEXT,
  created_at    INTEGER NOT NULL,
  last_seen_at  INTEGER
);

CREATE TABLE subscriptions (
  endpoint      TEXT PRIMARY KEY,
  device_id     TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  p256dh        TEXT NOT NULL,
  auth          TEXT NOT NULL,
  created_at    INTEGER NOT NULL,
  fail_count    INTEGER NOT NULL DEFAULT 0
);

-- Verschlüsselte Datensätze synchronisierter Collections
CREATE TABLE items (
  module        TEXT NOT NULL,
  collection    TEXT NOT NULL,
  id            TEXT NOT NULL,
  schema        INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL,
  deleted       INTEGER NOT NULL DEFAULT 0,
  payload       TEXT NOT NULL,               -- AES-GCM (base64url: iv | ciphertext)
  seq           INTEGER NOT NULL,
  PRIMARY KEY (module, collection, id)
);
CREATE INDEX idx_items_seq ON items(seq);

-- Erinnerungen (Klartext: nur Zeiten und Status, keine Inhalte)
CREATE TABLE reminders (
  module        TEXT NOT NULL,
  item_id       TEXT NOT NULL,
  stage         TEXT,                        -- Stufen-ID (z. B. '1d')
  stage_min     INTEGER NOT NULL,
  deadline      INTEGER,
  overdue_min   INTEGER NOT NULL DEFAULT 15,
  next_at       INTEGER,
  done          INTEGER NOT NULL DEFAULT 0,
  deleted       INTEGER NOT NULL DEFAULT 0,
  title_enc     TEXT,
  last_sent_at  INTEGER,
  sent_count    INTEGER NOT NULL DEFAULT 0,
  updated_at    INTEGER NOT NULL,            -- Zeitpunkt der letzten Nutzeränderung (Cron ändert ihn nicht)
  seq           INTEGER NOT NULL,
  PRIMARY KEY (module, item_id)
);
CREATE INDEX idx_reminders_due ON reminders(done, next_at);
CREATE INDEX idx_reminders_seq ON reminders(seq);

CREATE TABLE counters (name TEXT PRIMARY KEY, value INTEGER NOT NULL);
INSERT INTO counters (name, value) VALUES ('seq', 0);

CREATE TABLE login_attempts (ts INTEGER NOT NULL);
CREATE INDEX idx_login_attempts_ts ON login_attempts(ts);
