-- CB180 — schéma Turso (SQLite / libSQL)
-- Principe RGPD : le profil de réponses et l'email sont dans deux tables
-- séparées, reliées par un id de session opaque, jamais par une donnée
-- identifiante. Charger avec :  turso db shell cb180 < schema.sql

-- Table 1 — audits anonymisés (profil de réponses + résultat)
CREATE TABLE IF NOT EXISTS audits (
  id            TEXT PRIMARY KEY,          -- uuid de session, opaque
  created_at    TEXT NOT NULL,             -- ISO timestamp
  -- réponses en fourchettes, jamais de montant exact ni de nom de banque
  spend_band        TEXT,                  -- ex. "1000_2000"
  foreign_share     TEXT,                  -- ex. "moins_5pct"
  travel_freq       TEXT,                  -- ex. "1_3_par_an"
  foreign_withdraw  TEXT,                  -- ex. "rarement"
  current_fee_band  TEXT,                  -- ex. "100_150"
  reward_pref       TEXT,                  -- ex. "interesse" | "aucun"
  income_band       TEXT,                  -- ex. "1800_2500"
  profile_type      TEXT,                  -- ex. "voyageur_regulier"
  -- résultat calculé, pour l'analyse agrégée
  top_card_id       TEXT,                  -- id de la carte en tête du classement
  current_annual_cost REAL,                -- coût annuel estimé de la situation actuelle
  best_annual_gain    REAL                 -- gain net vs la carte de tête
);

-- Table 2 — emails (séparée, reliée seulement par session_id)
CREATE TABLE IF NOT EXISTS emails (
  id          TEXT PRIMARY KEY,            -- uuid propre
  session_id  TEXT,                        -- référence opaque vers audits.id
  email       TEXT NOT NULL,
  created_at  TEXT NOT NULL,
  consent     INTEGER DEFAULT 0            -- 1 si consentement marketing explicite
);

-- Table 3 — events de funnel (léger, pour mesurer les abandons)
CREATE TABLE IF NOT EXISTS events (
  id          TEXT PRIMARY KEY,
  session_id  TEXT,
  event_type  TEXT NOT NULL,               -- "arrivee" | "start_quiz" | "complete" | "click_affilie"
  meta        TEXT,                        -- json optionnel, ex. la carte cliquée
  created_at  TEXT NOT NULL
);

-- Index utiles pour l'analyse
CREATE INDEX IF NOT EXISTS idx_audits_created ON audits(created_at);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
