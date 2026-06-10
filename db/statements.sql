-- statements.sql — Schema do banco de dados Matchup
-- Baseado na branch system-api. Executado automaticamente por statements.js.

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INT UNIQUE NOT NULL,
    nickname VARCHAR(50) NOT NULL,
    bio TEXT,
    avatar_url VARCHAR(255),
    schedule_availability VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_profile_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS genres (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    genre_id INT NOT NULL,
    image_url VARCHAR(255) DEFAULT NULL,
    ranks_tags TEXT DEFAULT NULL,
    game_style INTEGER DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_game_genre FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS user_games (
    profile_id INT NOT NULL,
    game_id INT NOT NULL,
    game_style VARCHAR(20) CHECK (game_style IN ('casual', 'competitive')) NOT NULL,
    game_rank VARCHAR(50),
    PRIMARY KEY (profile_id, game_id),
    CONSTRAINT fk_user_games_profile FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_games_game FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS game_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER,
    creator_id INTEGER,
    name TEXT,
    bio TEXT,
    max_slots INTEGER,
    game_style TEXT,
    rank_min TEXT,
    rank_max TEXT,
    schedule TEXT,
    language TEXT,
    mic_required INTEGER,
    tags TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(game_id) REFERENCES games(id),
    FOREIGN KEY(creator_id) REFERENCES profiles(id)
);

CREATE TABLE IF NOT EXISTS group_members (
    group_id INT NOT NULL,
    profile_id INT NOT NULL,
    role VARCHAR(20) CHECK (role IN ('owner', 'member')) NOT NULL DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (group_id, profile_id),
    CONSTRAINT fk_group_members_group FOREIGN KEY (group_id) REFERENCES game_groups(id) ON DELETE CASCADE,
    CONSTRAINT fk_group_members_profile FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS room_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    profile_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES game_groups(id),
    FOREIGN KEY (profile_id) REFERENCES profiles(id)
);

CREATE TABLE IF NOT EXISTS password_resets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INT NOT NULL,
    token VARCHAR(64) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_password_resets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INT UNIQUE NOT NULL,
    level INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_admin_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_games_search ON user_games(game_id, game_style, game_rank);
CREATE INDEX IF NOT EXISTS idx_groups_game ON game_groups(game_id);

-- Seed: Gêneros
INSERT OR IGNORE INTO genres (name) VALUES
    ('FPS'), ('MOBA'), ('Battle Royale'), ('Esporte'),
    ('Sandbox'), ('MMORPG'), ('RPG'), ('Estratégia'), ('Luta'), ('Outro');

-- Seed: Jogos pré-cadastrados
INSERT OR IGNORE INTO games (name, genre_id, image_url) VALUES
    ('Valorant',          (SELECT id FROM genres WHERE name='FPS'),           NULL),
    ('League of Legends', (SELECT id FROM genres WHERE name='MOBA'),          NULL),
    ('CS2',               (SELECT id FROM genres WHERE name='FPS'),           NULL),
    ('Apex Legends',      (SELECT id FROM genres WHERE name='Battle Royale'), NULL),
    ('Rainbow Six Siege', (SELECT id FROM genres WHERE name='FPS'),           NULL),
    ('Rocket League',     (SELECT id FROM genres WHERE name='Esporte'),       NULL),
    ('Dota 2',            (SELECT id FROM genres WHERE name='MOBA'),          NULL),
    ('Overwatch 2',       (SELECT id FROM genres WHERE name='FPS'),           NULL),
    ('Fortnite',          (SELECT id FROM genres WHERE name='Battle Royale'), NULL),
    ('Minecraft',         (SELECT id FROM genres WHERE name='Sandbox'),       NULL),
    ('FIFA 25',           (SELECT id FROM genres WHERE name='Esporte'),       NULL),
    ('World of Warcraft', (SELECT id FROM genres WHERE name='MMORPG'),        NULL);
