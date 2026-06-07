--DROP TABLE IF EXISTS group_members;
--DROP TABLE IF EXISTS game_groups;
--DROP TABLE IF EXISTS user_games;
--DROP TABLE IF EXISTS profiles;
--DROP TABLE IF EXISTS genres;
--DROP TABLE IF EXISTS games;
--DROP TABLE IF EXISTS admins;
--DROP TABLE IF EXISTS password_resets;

-- 1. Tabela de Autenticação (User)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabela de Perfil do Jogador (Profile)
-- Relacionamento 1:1 com a tabela de Usuários
CREATE TABLE IF NOT EXISTS profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INT UNIQUE NOT NULL,
    nickname VARCHAR(50) NOT NULL,
    bio TEXT,
    avatar_url VARCHAR(255),
    schedule_availability VARCHAR(100), -- Armazena os horários disponíveis
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_profile_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

--- 3. Tabela de Gêneros de Jogos (Genre)
CREATE TABLE IF NOT EXISTS genres (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabela de Jogos Cadastrados (Game)
CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    genre_id INT NOT NULL,
    image_url VARCHAR(255) DEFAULT NULL,
    ranks_tags TEXT DEFAULT NULL, -- Armazena os ranks/tags separados por vírgula (ex: "Bronze,Prata,Ouro")
    game_style INTEGER DEFAULT 3, -- 1: Casual, 2: Competitivo, 3: Ambos
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_game_genre FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE RESTRICT
);

-- 5. Tabela Pivô: Jogador e Jogos (User_Games)
-- Relacionamento Many-to-Many (N:N) entre Perfil e Jogo
CREATE TABLE IF NOT EXISTS user_games (
    profile_id INT NOT NULL,
    game_id INT NOT NULL,
    game_style VARCHAR(20) CHECK (game_style IN ('casual', 'competitive')) NOT NULL, -- Estilo de jogo
    game_rank VARCHAR(50), -- Rank/Elo atualizado por jogo
    PRIMARY KEY (profile_id, game_id),
    CONSTRAINT fk_user_games_profile FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_games_game FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

-- 6. Tabela de Grupos/Salas (Group)
CREATE TABLE IF NOT EXISTS game_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER,
    creator_id INTEGER,
    name TEXT,
    bio TEXT,           -- Sua descrição
    max_slots INTEGER,
    game_style TEXT,    -- 'Competitivo' ou 'Casual'
    rank_min TEXT,
    rank_max TEXT,
    schedule TEXT,
    language TEXT,
    mic_required INTEGER, -- 1 ou 0
    tags TEXT,          -- "Tag1, Tag2"
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(game_id) REFERENCES games(id),
    FOREIGN KEY(creator_id) REFERENCES profiles(id)
);

-- 7. Tabela de Membros dos Grupos (Group_Members)
-- Relacionamento Many-to-Many (N:N) que gerencia os participantes e seus papéis
CREATE TABLE IF NOT EXISTS group_members (
    group_id INT NOT NULL,
    profile_id INT NOT NULL,
    role VARCHAR(20) CHECK (role IN ('owner', 'member')) NOT NULL DEFAULT 'member', -- Papel no grupo
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (group_id, profile_id),
    CONSTRAINT fk_group_members_group FOREIGN KEY (group_id) REFERENCES game_groups(id) ON DELETE CASCADE,
    CONSTRAINT fk_group_members_profile FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- 8. Tabela para gerenciar tokens de redefinição de senha
-- Relacionamento 1:N com a tabela de Usuários (um usuário pode ter vários tokens, mas cada token pertence a um único usuário)
CREATE TABLE IF NOT EXISTS password_resets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INT NOT NULL,
    token VARCHAR(64) UNIQUE NOT NULL, -- Hash do token que será enviado por e-mail
    expires_at TIMESTAMP NOT NULL,      -- Data/hora de expiração (ex: +15 minutos)
    used BOOLEAN DEFAULT FALSE,         -- Garante que o token só seja usado uma vez
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_password_resets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 9. Tabela de Administradores (Admin)
-- Relacionamento 1:1 com a tabela de Usuários para diferenciar de 'profiles'
CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INT UNIQUE NOT NULL,
    level INT NOT NULL DEFAULT 1, -- Nível de permissão (ex: 1 = Admin Comum, 2 = Super Admin)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_admin_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Otimização para a rota de busca/filtro de jogadores (GET /players)
CREATE INDEX IF NOT EXISTS idx_user_games_search ON user_games(game_id, game_style, game_rank);

-- Otimização para buscar grupos abertos por jogo específicos
CREATE INDEX IF NOT EXISTS idx_groups_game ON game_groups(game_id);