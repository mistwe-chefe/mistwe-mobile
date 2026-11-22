-- 1.1.2: Diagnose – Ergebnis des letzten Push-Versands je Abo und Zeitpunkt des letzten Cron-Laufs
ALTER TABLE subscriptions ADD COLUMN last_status INTEGER;
ALTER TABLE subscriptions ADD COLUMN last_reason TEXT;
ALTER TABLE subscriptions ADD COLUMN last_at INTEGER;
INSERT OR IGNORE INTO counters (name, value) VALUES ('cron_at', 0);
