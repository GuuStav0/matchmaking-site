-- statements.sql
-- Inicialização do banco de dados Matchup (SQLite).
-- Executado automaticamente por initDatabase() em database.js.

PRAGMA foreign_keys = ON;

-- ── Usuários ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id         TEXT PRIMARY KEY,
  email      TEXT UNIQUE NOT NULL,
  password   TEXT NOT NULL,
  nickname   TEXT UNIQUE NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ── Perfis (1:1 com users, mesmo id) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id                    TEXT PRIMARY KEY,
  nickname              TEXT NOT NULL DEFAULT '',
  bio                   TEXT,
  avatar_url            TEXT,
  schedule_availability TEXT,
  created_at            TEXT DEFAULT (datetime('now')),
  updated_at            TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── Jogos ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS games (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT UNIQUE NOT NULL,
  genre       TEXT,
  cover_url   TEXT,
  rooms_count INTEGER DEFAULT 0,
  created_at  TEXT DEFAULT (datetime('now'))
);

-- ── Pivô Perfil <-> Jogo (N:N) ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_games (
  profile_id TEXT    NOT NULL,
  game_id    INTEGER NOT NULL,
  game_style TEXT    NOT NULL CHECK (game_style IN ('casual', 'competitive')),
  game_rank  TEXT,
  PRIMARY KEY (profile_id, game_id),
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (game_id)    REFERENCES games(id)    ON DELETE CASCADE
);

-- ── Salas de Matchmaking ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS game_groups (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  creator_id TEXT    NOT NULL,
  game_id    INTEGER NOT NULL,
  name       TEXT    NOT NULL,
  max_slots  INTEGER NOT NULL CHECK (max_slots > 1),
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (creator_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (game_id)    REFERENCES games(id)    ON DELETE CASCADE
);

-- ── Pivô Sala <-> Perfil (N:N) ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS group_members (
  group_id   INTEGER NOT NULL,
  profile_id TEXT    NOT NULL,
  role       TEXT    NOT NULL CHECK (role IN ('owner', 'member')),
  joined_at  TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (group_id, profile_id),
  FOREIGN KEY (group_id)   REFERENCES game_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (profile_id) REFERENCES profiles(id)    ON DELETE CASCADE
);

-- ── Recuperação de Senha ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS password_resets (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    TEXT NOT NULL,
  token      TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  used       INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── Administradores (1:1 com users) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admins (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT UNIQUE NOT NULL,
  name    TEXT NOT NULL,
  level   INTEGER DEFAULT 1,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── Índices para queries de busca/filtro ──────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_user_games_game     ON user_games (game_id);
CREATE INDEX IF NOT EXISTS idx_user_games_profile  ON user_games (profile_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members (group_id);
CREATE INDEX IF NOT EXISTS idx_profiles_nickname   ON profiles (nickname);

-- ── Seed: jogos pré-cadastrados ───────────────────────────────────────────────
INSERT OR IGNORE INTO games (name, genre, cover_url, rooms_count) VALUES
  ('Valorant',          'FPS',           NULL, 142),
  ('League of Legends', 'MOBA',          NULL,  98),
  ('CS2',               'FPS',           NULL,  87),
  ('Apex Legends',      'Battle Royale', NULL,  63),
  ('Rainbow Six Siege', 'FPS',           NULL,  55),
  ('Rocket League',     'Esporte',       NULL,  44),
  ('Dota 2',            'MOBA',          NULL,  39),
  ('Overwatch 2',       'FPS',           NULL,  36),
  ('Fortnite',          'Battle Royale', NULL,  31),
  ('Minecraft',         'Sandbox',       NULL,  19),
  ('FIFA 25',           'Esporte',       NULL,  17),
  ('World of Warcraft', 'MMORPG',        NULL,  15);
