// api.js — Matchup API
// Base: branch system-api. Rotas /api/admin/* adicionadas para o painel Murilo.
import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import { db, createTables } from "./statements.js";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// =============================================================
// AUTH
// =============================================================

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ status: "erro", mensagem: "Email e senha são obrigatórios." });
  }

  const query = `
    SELECT u.id, u.email, u.password,
           p.id AS profile_id,
           p.nickname,
           p.avatar_url
    FROM users u
    LEFT JOIN profiles p ON p.user_id = u.id
    WHERE u.email = ?
  `;

  db.get(query, [email], async (err, user) => {
    if (err) return res.status(500).json({ status: "erro", mensagem: "Erro interno no banco de dados." });
    if (!user) return res.status(401).json({ status: "erro", mensagem: "E-mail ou senha incorretos." });

    try {
      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.status(401).json({ status: "erro", mensagem: "E-mail ou senha incorretos." });

      res.json({
        status: "sucesso",
        dados: {
          id: user.id,
          profile_id: user.profile_id,
          email: user.email,
          nickname: user.nickname || "Jogador",
          avatar_url: user.avatar_url,
        },
      });
    } catch {
      res.status(500).json({ status: "erro", mensagem: "Erro ao processar a autenticação." });
    }
  });
});

// =============================================================
// JOGOS
// =============================================================

app.get("/api/games", (req, res) => {
  const query = `
    SELECT g.id, g.name, g.image_url AS cover_url, g.ranks_tags,
           gn.name AS genre,
           COUNT(gg.id) AS rooms_count
    FROM games g
    INNER JOIN genres gn ON g.genre_id = gn.id
    LEFT JOIN game_groups gg ON g.id = gg.game_id
    GROUP BY g.id, g.name, g.image_url, g.ranks_tags, gn.name
  `;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get("/api/games/:gameId", (req, res) => {
  const { gameId } = req.params;
  const query = `
    SELECT g.id, g.name, '#1a0a2e' AS cover_color, '#c084fc' AS cover_accent,
           g.image_url, gn.name AS genre
    FROM games g
    INNER JOIN genres gn ON g.genre_id = gn.id
    WHERE g.id = ?
  `;
  db.get(query, [gameId], (err, row) => {
    if (err) return res.status(500).json({ status: "erro", mensagem: err.message });
    if (!row) return res.status(404).json({ status: "erro", mensagem: "Jogo não encontrado." });
    res.json(row);
  });
});

// =============================================================
// SALAS (GAME GROUPS)
// =============================================================

app.get("/api/rooms/detail/:roomId", (req, res) => {
  const { roomId } = req.params;
  const roomQuery = `
    SELECT gg.*, g.name AS game_name, g.image_url AS game_cover
    FROM game_groups gg
    INNER JOIN games g ON gg.game_id = g.id
    WHERE gg.id = ?
  `;
  db.get(roomQuery, [roomId], (err, room) => {
    if (err) return res.status(500).json({ status: "erro", mensagem: err.message });
    if (!room) return res.status(404).json({ status: "erro", mensagem: "Sala não encontrada." });

    const membersQuery = `
      SELECT p.id, p.nickname, p.avatar_url
      FROM group_members gm
      INNER JOIN profiles p ON gm.profile_id = p.id
      WHERE gm.group_id = ?
      ORDER BY gm.joined_at ASC
    `;
    db.all(membersQuery, [roomId], (memErr, members) => {
      if (memErr) return res.status(500).json({ status: "erro", mensagem: memErr.message });
      room.members = members;
      res.json({ status: "sucesso", dados: room });
    });
  });
});

app.get("/api/rooms/:roomId/messages", (req, res) => {
  const { roomId } = req.params;
  const query = `
    SELECT rm.id, rm.content, rm.created_at,
           p.id AS profile_id, p.nickname, p.avatar_url
    FROM room_messages rm
    INNER JOIN profiles p ON rm.profile_id = p.id
    WHERE rm.group_id = ?
    ORDER BY rm.created_at ASC
    LIMIT 50
  `;
  db.all(query, [roomId], (err, rows) => {
    if (err) return res.status(500).json({ status: "erro", mensagem: err.message });
    res.json({ status: "sucesso", dados: rows });
  });
});

app.get("/api/games/:gameId/rooms", (req, res) => {
  const { gameId } = req.params;
  const query = `
    SELECT
      gg.id, gg.name,
      p.nickname AS owner,
      p.avatar_url AS owner_avatar,
      gg.game_style AS style,
      (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = gg.id) AS members,
      gg.max_slots AS slots,
      gg.rank_min, gg.rank_max,
      gg.schedule, gg.language,
      gg.mic_required,
      gg.bio AS description,
      gg.tags,
      strftime('%d/%m/%Y %H:%M', gg.created_at) AS created_at
    FROM game_groups gg
    LEFT JOIN profiles p ON gg.creator_id = p.id
    WHERE gg.game_id = ?
    ORDER BY gg.created_at DESC
  `;
  db.all(query, [gameId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const formatted = rows.map((row) => ({
      id: row.id,
      name: row.name,
      owner: row.owner,
      owner_avatar: row.owner_avatar,
      style: row.style || "Casual",
      members: row.members,
      slots: row.slots,
      rank_min: row.rank_min,
      rank_max: row.rank_max,
      schedule: row.schedule,
      language: row.language,
      mic_required: row.mic_required === 1,
      description: row.description,
      created_at: row.created_at,
      tags: row.tags ? row.tags.split(",").map((t) => t.trim()) : [],
      status: row.members >= row.slots ? "full" : "open",
    }));
    res.json(formatted);
  });
});

app.post("/api/rooms", (req, res) => {
  const { game_id, creator_id, name, bio, max_slots, game_style, rank_min, rank_max, schedule, language, mic_required, tags } = req.body;

  if (!game_id || !creator_id || !name || !bio) {
    return res.status(400).json({ status: "erro", mensagem: "Por favor, preencha todos os campos obrigatórios (Jogo, Título e Descrição)." });
  }

  const queryRoom = `
    INSERT INTO game_groups (game_id, creator_id, name, bio, max_slots, game_style, rank_min, rank_max, schedule, language, mic_required, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const tagsString = Array.isArray(tags) ? tags.join(", ") : tags;
  const micValue = mic_required ? 1 : 0;

  db.run(queryRoom, [
    parseInt(game_id), parseInt(creator_id), name.trim(), bio.trim(),
    parseInt(max_slots) || 4, game_style || "Casual",
    rank_min || "Livre", rank_max || "Livre",
    schedule ? schedule.trim() : "-",
    language ? language.trim() : "Português",
    micValue, tagsString ? tagsString.trim() : null,
  ], function (err) {
    if (err) return res.status(500).json({ status: "erro", mensagem: "Erro ao criar sala: " + err.message });

    const novaSalaId = this.lastID;
    const queryMember = `INSERT INTO group_members (group_id, profile_id, role, joined_at) VALUES (?, ?, 'owner', CURRENT_TIMESTAMP)`;
    db.run(queryMember, [novaSalaId, parseInt(creator_id)], () => {
      res.status(201).json({ status: "sucesso", salaId: novaSalaId });
    });
  });
});

app.post("/api/rooms/:roomId/messages", (req, res) => {
  const { roomId } = req.params;
  const { profile_id, content } = req.body;

  if (!profile_id || !content || content.trim() === "") {
    return res.status(400).json({ status: "erro", mensagem: "Mensagem inválida ou sem remetente." });
  }
  db.run(
    "INSERT INTO room_messages (group_id, profile_id, content) VALUES (?, ?, ?)",
    [roomId, profile_id, content.trim()],
    function (err) {
      if (err) return res.status(500).json({ status: "erro", mensagem: err.message });
      res.status(201).json({ status: "sucesso", id: this.lastID });
    },
  );
});

// =============================================================
// USUÁRIOS
// =============================================================

app.post("/api/users", async (req, res) => {
  const { email, password, nickname } = req.body;
  if (!email || !password || !nickname) {
    return res.status(400).json({ status: "erro", mensagem: "Email, senha e nickname são obrigatórios." });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");
      db.run("INSERT INTO users (email, password) VALUES (?, ?)", [email, hashedPassword], function (err) {
        if (err) {
          db.run("ROLLBACK");
          if (err.message.includes("UNIQUE")) {
            return res.status(400).json({ status: "erro", mensagem: "Este email já está cadastrado." });
          }
          return res.status(500).json({ status: "erro", mensagem: err.message });
        }
        const userId = this.lastID;
        db.run("INSERT INTO profiles (user_id, nickname) VALUES (?, ?)", [userId, nickname], function (err) {
          if (err) {
            db.run("ROLLBACK");
            return res.status(500).json({ status: "erro", mensagem: err.message });
          }
          db.run("COMMIT");
          res.status(201).json({ status: "sucesso", mensagem: "Conta e perfil criados com sucesso!", userId });
        });
      });
    });
  } catch {
    res.status(500).json({ status: "erro", mensagem: "Erro interno ao processar a senha." });
  }
});

app.put("/api/users/:id", (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  if (!password) return res.status(400).json({ status: "erro", mensagem: "A nova senha é obrigatória." });
  db.run("UPDATE users SET password = ? WHERE id = ?", [password, id], function (err) {
    if (err) return res.status(500).json({ status: "erro", mensagem: err.message });
    if (this.changes === 0) return res.status(404).json({ status: "erro", mensagem: "Usuário não encontrado." });
    res.json({ status: "sucesso", mensagem: "Senha atualizada com sucesso!" });
  });
});

app.delete("/api/users/:id", (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM users WHERE id = ?", [id], function (err) {
    if (err) return res.status(500).json({ status: "erro", mensagem: err.message });
    if (this.changes === 0) return res.status(404).json({ status: "erro", mensagem: "Usuário não encontrado." });
    res.json({ status: "sucesso", mensagem: "Usuário e dados vinculados removidos com sucesso!" });
  });
});

// =============================================================
// PERFIS
// =============================================================

app.put("/api/profiles/:id", (req, res) => {
  const { id } = req.params;
  const { nickname, bio, avatar_url, schedule_availability } = req.body;
  if (!nickname) return res.status(400).json({ status: "erro", mensagem: "O nickname é obrigatório." });
  db.run(
    "UPDATE profiles SET nickname=?, bio=?, avatar_url=?, schedule_availability=?, updated_at=CURRENT_TIMESTAMP WHERE id=?",
    [nickname, bio || null, avatar_url || null, schedule_availability || null, id],
    function (err) {
      if (err) return res.status(500).json({ status: "erro", mensagem: err.message });
      if (this.changes === 0) return res.status(404).json({ status: "erro", mensagem: "Perfil não encontrado." });
      res.json({ status: "sucesso", mensagem: "Perfil atualizado com sucesso!" });
    },
  );
});

app.delete("/api/profiles/:id", (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM profiles WHERE id = ?", [id], function (err) {
    if (err) return res.status(500).json({ status: "erro", mensagem: err.message });
    if (this.changes === 0) return res.status(404).json({ status: "erro", mensagem: "Perfil não encontrado." });
    res.json({ status: "sucesso", mensagem: "Perfil removido com sucesso." });
  });
});

// =============================================================
// JOGOS (CRUD)
// =============================================================

app.post("/api/games", (req, res) => {
  const { name, genre_id, image_url } = req.body;
  if (!name) return res.status(400).json({ status: "erro", mensagem: "O nome do jogo é obrigatório." });
  db.run("INSERT INTO games (name, genre_id, image_url) VALUES (?, ?, ?)", [name, genre_id, image_url || null], function (err) {
    if (err) return res.status(500).json({ status: "erro", mensagem: err.message });
    res.status(201).json({ status: "sucesso", mensagem: "Jogo cadastrado!", id: this.lastID });
  });
});

app.put("/api/games/:id", (req, res) => {
  const { id } = req.params;
  const { name, genre_id, image_url } = req.body;
  if (!name) return res.status(400).json({ status: "erro", mensagem: "O nome do jogo é obrigatório." });
  if (!genre_id) return res.status(400).json({ status: "erro", mensagem: "A categoria/gênero é obrigatória." });
  db.run("UPDATE games SET name=?, genre_id=?, image_url=? WHERE id=?", [name, genre_id, image_url || null, id], function (err) {
    if (err) {
      if (err.message.includes("UNIQUE constraint failed")) return res.status(409).json({ status: "erro", mensagem: "Já existe outro jogo com este nome." });
      if (err.message.includes("FOREIGN KEY constraint failed")) return res.status(400).json({ status: "erro", mensagem: "A categoria informada é inválida." });
      return res.status(500).json({ status: "erro", mensagem: err.message });
    }
    if (this.changes === 0) return res.status(404).json({ status: "erro", mensagem: "Jogo não encontrado." });
    res.json({ status: "sucesso", mensagem: "Jogo atualizado com sucesso!" });
  });
});

app.delete("/api/games/:id", (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM games WHERE id = ?", [id], function (err) {
    if (err) return res.status(500).json({ status: "erro", mensagem: err.message });
    if (this.changes === 0) return res.status(404).json({ status: "erro", mensagem: "Jogo não encontrado." });
    res.json({ status: "sucesso", mensagem: "Jogo removido do catálogo." });
  });
});

// =============================================================
// USER_GAMES
// =============================================================

app.post("/api/user-games", (req, res) => {
  const { profile_id, game_id, game_style, game_rank } = req.body;
  if (!profile_id || !game_id || !game_style) {
    return res.status(400).json({ status: "erro", mensagem: "profile_id, game_id e game_style são obrigatórios." });
  }
  if (!["casual", "competitive"].includes(game_style)) {
    return res.status(400).json({ status: "erro", mensagem: "game_style deve ser 'casual' ou 'competitive'." });
  }
  db.run(
    "INSERT INTO user_games (profile_id, game_id, game_style, game_rank) VALUES (?, ?, ?, ?)",
    [profile_id, game_id, game_style, game_rank || null],
    function (err) {
      if (err) return res.status(500).json({ status: "erro", mensagem: err.message });
      res.status(201).json({ status: "sucesso", mensagem: "Jogo vinculado ao perfil com sucesso!" });
    },
  );
});

app.put("/api/user-games", (req, res) => {
  const { profile_id, game_id, skill_level } = req.body;
  if (!profile_id || !game_id || !skill_level) {
    return res.status(400).json({ status: "erro", mensagem: "profile_id, game_id e skill_level são obrigatórios." });
  }
  db.run("UPDATE user_games SET skill_level=? WHERE profile_id=? AND game_id=?", [skill_level, profile_id, game_id], function (err) {
    if (err) return res.status(500).json({ status: "erro", mensagem: err.message });
    if (this.changes === 0) return res.status(404).json({ status: "erro", mensagem: "Vínculo de jogo não encontrado." });
    res.json({ status: "sucesso", mensagem: "Nível de habilidade atualizado!" });
  });
});

app.delete("/api/user-games", (req, res) => {
  const { profile_id, game_id } = req.body;
  db.run("DELETE FROM user_games WHERE profile_id=? AND game_id=?", [profile_id, game_id], function (err) {
    if (err) return res.status(500).json({ status: "erro", mensagem: err.message });
    if (this.changes === 0) return res.status(404).json({ status: "erro", mensagem: "Vínculo não encontrado." });
    res.json({ status: "sucesso", mensagem: "Jogo desvinculado do perfil." });
  });
});

// =============================================================
// GAME GROUPS
// =============================================================

app.post("/api/game-groups", (req, res) => {
  const { creator_id, game_id, name, max_slots } = req.body;
  if (!creator_id || !game_id || !name || !max_slots) {
    return res.status(400).json({ status: "erro", mensagem: "Dono, jogo, nome e vagas máximas são obrigatórios." });
  }
  db.run("INSERT INTO game_groups (creator_id, game_id, name, max_slots) VALUES (?, ?, ?, ?)", [creator_id, game_id, name, max_slots], function (err) {
    if (err) return res.status(500).json({ status: "erro", mensagem: err.message });
    res.status(201).json({ status: "sucesso", mensagem: "Grupo criado com sucesso!", id: this.lastID });
  });
});

app.put("/api/game-groups/:id", (req, res) => {
  const { id } = req.params;
  const { name, description, max_players } = req.body;
  if (!name) return res.status(400).json({ status: "erro", mensagem: "O nome do grupo é obrigatório." });
  db.run("UPDATE game_groups SET name=?, description=?, max_players=? WHERE id=?", [name, description || null, max_players || 5, id], function (err) {
    if (err) return res.status(500).json({ status: "erro", mensagem: err.message });
    if (this.changes === 0) return res.status(404).json({ status: "erro", mensagem: "Grupo não encontrado." });
    res.json({ status: "sucesso", mensagem: "Grupo atualizado com sucesso!" });
  });
});

app.delete("/api/game-groups/:id", (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM game_groups WHERE id=?", [id], function (err) {
    if (err) return res.status(500).json({ status: "erro", mensagem: err.message });
    if (this.changes === 0) return res.status(404).json({ status: "erro", mensagem: "Grupo não encontrado." });
    res.json({ status: "sucesso", mensagem: "Grupo removido com sucesso." });
  });
});

// =============================================================
// GROUP MEMBERS
// =============================================================

app.post("/api/group-members", (req, res) => {
  const { group_id, profile_id } = req.body;
  if (!group_id || !profile_id) {
    return res.status(400).json({ status: "erro", mensagem: "Dados insuficientes para entrar na sala." });
  }

  db.get("SELECT group_id FROM group_members WHERE group_id=? AND profile_id=?", [group_id, profile_id], (errCheck, existing) => {
    if (errCheck) return res.status(500).json({ status: "erro", mensagem: errCheck.message });
    if (existing) return res.json({ status: "sucesso", mensagem: "Você já é membro deste lobby, redirecionando..." });

    db.get(
      "SELECT gg.max_slots, COUNT(gm.profile_id) as current_members FROM game_groups gg LEFT JOIN group_members gm ON gg.id=gm.group_id WHERE gg.id=? GROUP BY gg.id",
      [group_id],
      (errSlots, roomInfo) => {
        if (errSlots) return res.status(500).json({ status: "erro", mensagem: errSlots.message });
        if (!roomInfo) return res.status(404).json({ status: "erro", mensagem: "Sala não encontrada." });
        if (roomInfo.current_members >= roomInfo.max_slots) {
          return res.status(400).json({ status: "erro", mensagem: "A sala atingiu o limite máximo de jogadores!" });
        }
        db.run("INSERT INTO group_members (group_id, profile_id, role, joined_at) VALUES (?, ?, 'member', CURRENT_TIMESTAMP)", [group_id, profile_id], function (err) {
          if (err) return res.status(500).json({ status: "erro", mensagem: err.message });
          res.status(201).json({ status: "sucesso", mensagem: "Entrou na sala com sucesso!" });
        });
      },
    );
  });
});

app.delete("/api/rooms/:roomId/members/:profileId", (req, res) => {
  const { roomId, profileId } = req.params;
  const requesterId = req.headers["x-user-id"];

  db.get("SELECT creator_id FROM game_groups WHERE id=?", [roomId], (err, room) => {
    if (err) return res.status(500).json({ status: "erro", mensagem: err.message });
    if (!room) return res.status(404).json({ status: "erro", mensagem: "Sala não encontrada." });
    if (parseInt(room.creator_id) !== parseInt(requesterId)) {
      return res.status(403).json({ status: "erro", mensagem: "Apenas o Host da sala pode remover membros." });
    }
    db.run("DELETE FROM group_members WHERE group_id=? AND profile_id=?", [roomId, profileId], function (delErr) {
      if (delErr) return res.status(500).json({ status: "erro", mensagem: delErr.message });
      res.json({ status: "sucesso", mensagem: "Membro removido com sucesso." });
    });
  });
});

app.delete("/api/group-members", (req, res) => {
  const { group_id, profile_id } = req.body;
  db.run("DELETE FROM group_members WHERE group_id=? AND profile_id=?", [group_id, profile_id], function (err) {
    if (err) return res.status(500).json({ status: "erro", mensagem: err.message });
    res.json({ status: "sucesso", mensagem: "Você saiu da sala." });
  });
});

// =============================================================
// PLAYERS
// =============================================================

app.get("/api/players", (req, res) => {
  const { game, style } = req.query;
  let query = `
    SELECT DISTINCT p.id, p.nickname, p.bio, p.avatar_url,
           p.schedule_availability, ug.game_style, ug.game_rank, g.name AS game_name
    FROM profiles p
    INNER JOIN user_games ug ON p.id = ug.profile_id
    INNER JOIN games g ON ug.game_id = g.id
    WHERE 1=1
  `;
  const params = [];
  if (game) { query += " AND g.id = ?"; params.push(game); }
  if (style) { query += " AND ug.game_style = ?"; params.push(style); }
  query += " ORDER BY p.nickname ASC LIMIT 50";

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ status: "erro", mensagem: err.message });
    res.json({ status: "sucesso", dados: rows });
  });
});

app.get("/api/players/:id", (req, res) => {
  const { id } = req.params;
  const query = `
    SELECT p.id, p.nickname, p.bio, p.avatar_url, p.schedule_availability, p.created_at,
           json_group_array(json_object('game_name', g.name, 'game_style', ug.game_style, 'game_rank', ug.game_rank, 'image_url', g.image_url)) AS games
    FROM profiles p
    LEFT JOIN user_games ug ON p.id = ug.profile_id
    LEFT JOIN games g ON ug.game_id = g.id
    WHERE p.id = ?
    GROUP BY p.id
  `;
  db.get(query, [id], (err, row) => {
    if (err) return res.status(500).json({ status: "erro", mensagem: err.message });
    if (!row) return res.status(404).json({ status: "erro", mensagem: "Jogador não encontrado." });
    row.games = JSON.parse(row.games || "[]").filter((g) => g.game_name !== null);
    res.json({ status: "sucesso", dados: row });
  });
});

// =============================================================
// ADMIN — Painel Murilo
// =============================================================

// Helper: encontra ou cria um gênero pelo nome, retorna o id via callback
function getOrCreateGenreId(genreName, callback) {
  db.get("SELECT id FROM genres WHERE name = ?", [genreName], (err, row) => {
    if (err) return callback(err);
    if (row) return callback(null, row.id);
    db.run("INSERT INTO genres (name) VALUES (?)", [genreName], function (insErr) {
      if (insErr) return callback(insErr);
      callback(null, this.lastID);
    });
  });
}

app.get("/api/admin/stats", (req, res) => {
  const queries = [
    "SELECT COUNT(*) AS cnt FROM users",
    "SELECT COUNT(*) AS cnt FROM profiles",
    "SELECT COUNT(*) AS cnt FROM games",
    "SELECT COUNT(*) AS cnt FROM game_groups",
    "SELECT COUNT(*) AS cnt FROM group_members",
  ];
  const keys = ["users", "profiles", "games", "groups", "group_members"];
  const stats = {};
  let pending = queries.length;

  queries.forEach((q, i) => {
    db.get(q, [], (err, row) => {
      stats[keys[i]] = err ? 0 : row.cnt;
      if (--pending === 0) res.json({ status: "sucesso", dados: stats });
    });
  });
});

app.get("/api/admin/users", (req, res) => {
  db.all(
    "SELECT u.id, u.email, p.nickname, u.created_at FROM users u LEFT JOIN profiles p ON p.user_id = u.id ORDER BY u.id DESC",
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ status: "erro", mensagem: err.message });
      res.json({ status: "sucesso", dados: rows });
    },
  );
});

app.delete("/api/admin/users/:id", (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM users WHERE id=?", [id], function (err) {
    if (err) return res.status(500).json({ status: "erro", mensagem: err.message });
    if (this.changes === 0) return res.status(404).json({ status: "erro", mensagem: "Usuário não encontrado." });
    res.json({ status: "sucesso", mensagem: "Usuário removido." });
  });
});

app.get("/api/admin/profiles", (req, res) => {
  db.all(
    "SELECT id, nickname, bio, schedule_availability, created_at FROM profiles ORDER BY id DESC",
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ status: "erro", mensagem: err.message });
      res.json({ status: "sucesso", dados: rows });
    },
  );
});

app.delete("/api/admin/profiles/:id", (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM profiles WHERE id=?", [id], function (err) {
    if (err) return res.status(500).json({ status: "erro", mensagem: err.message });
    if (this.changes === 0) return res.status(404).json({ status: "erro", mensagem: "Perfil não encontrado." });
    res.json({ status: "sucesso", mensagem: "Perfil removido." });
  });
});

app.get("/api/admin/games", (req, res) => {
  db.all(
    `SELECT g.id, g.name, gn.name AS genre, g.image_url AS cover_url,
            COUNT(gg.id) AS rooms_count
     FROM games g
     INNER JOIN genres gn ON g.genre_id = gn.id
     LEFT JOIN game_groups gg ON g.id = gg.game_id
     GROUP BY g.id ORDER BY g.id DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ status: "erro", mensagem: err.message });
      res.json({ status: "sucesso", dados: rows });
    },
  );
});

app.post("/api/admin/games", (req, res) => {
  const { name, genre, cover_url } = req.body;
  if (!name || !genre) return res.status(400).json({ status: "erro", mensagem: "Nome e gênero são obrigatórios." });

  getOrCreateGenreId(genre, (err, genreId) => {
    if (err) return res.status(500).json({ status: "erro", mensagem: err.message });
    db.run("INSERT INTO games (name, genre_id, image_url) VALUES (?, ?, ?)", [name, genreId, cover_url || null], function (insErr) {
      if (insErr) {
        if (insErr.message.includes("UNIQUE")) return res.status(409).json({ status: "erro", mensagem: "Já existe um jogo com este nome." });
        return res.status(500).json({ status: "erro", mensagem: insErr.message });
      }
      res.status(201).json({ status: "sucesso", mensagem: "Jogo cadastrado!", id: this.lastID });
    });
  });
});

app.put("/api/admin/games/:id", (req, res) => {
  const { id } = req.params;
  const { name, genre, cover_url } = req.body;
  if (!name || !genre) return res.status(400).json({ status: "erro", mensagem: "Nome e gênero são obrigatórios." });

  getOrCreateGenreId(genre, (err, genreId) => {
    if (err) return res.status(500).json({ status: "erro", mensagem: err.message });
    db.run("UPDATE games SET name=?, genre_id=?, image_url=? WHERE id=?", [name, genreId, cover_url || null, id], function (updErr) {
      if (updErr) {
        if (updErr.message.includes("UNIQUE")) return res.status(409).json({ status: "erro", mensagem: "Já existe outro jogo com este nome." });
        return res.status(500).json({ status: "erro", mensagem: updErr.message });
      }
      if (this.changes === 0) return res.status(404).json({ status: "erro", mensagem: "Jogo não encontrado." });
      res.json({ status: "sucesso", mensagem: "Jogo atualizado!" });
    });
  });
});

app.delete("/api/admin/games/:id", (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM games WHERE id=?", [id], function (err) {
    if (err) return res.status(500).json({ status: "erro", mensagem: err.message });
    if (this.changes === 0) return res.status(404).json({ status: "erro", mensagem: "Jogo não encontrado." });
    res.json({ status: "sucesso", mensagem: "Jogo removido." });
  });
});

app.get("/api/admin/groups", (req, res) => {
  db.all(
    `SELECT gg.id, gg.name, g.name AS game_name, gg.creator_id, gg.max_slots,
            COUNT(gm.profile_id) AS members_count,
            strftime('%d/%m/%Y', gg.created_at) AS created_at
     FROM game_groups gg
     LEFT JOIN games g ON gg.game_id = g.id
     LEFT JOIN group_members gm ON gm.group_id = gg.id
     GROUP BY gg.id ORDER BY gg.id DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ status: "erro", mensagem: err.message });
      res.json({ status: "sucesso", dados: rows });
    },
  );
});

app.delete("/api/admin/groups/:id", (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM game_groups WHERE id=?", [id], function (err) {
    if (err) return res.status(500).json({ status: "erro", mensagem: err.message });
    if (this.changes === 0) return res.status(404).json({ status: "erro", mensagem: "Sala não encontrada." });
    res.json({ status: "sucesso", mensagem: "Sala removida." });
  });
});

app.get("/api/admin/group-members", (req, res) => {
  db.all(
    `SELECT gm.group_id, gm.profile_id, p.nickname, gg.name AS group_name,
            gm.role,
            strftime('%d/%m/%Y', gm.joined_at) AS joined_at
     FROM group_members gm
     INNER JOIN profiles p ON gm.profile_id = p.id
     INNER JOIN game_groups gg ON gm.group_id = gg.id
     ORDER BY gm.joined_at DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ status: "erro", mensagem: err.message });
      res.json({ status: "sucesso", dados: rows });
    },
  );
});

app.delete("/api/admin/group-members/:gid/:pid", (req, res) => {
  const { gid, pid } = req.params;
  db.run("DELETE FROM group_members WHERE group_id=? AND profile_id=?", [gid, pid], function (err) {
    if (err) return res.status(500).json({ status: "erro", mensagem: err.message });
    if (this.changes === 0) return res.status(404).json({ status: "erro", mensagem: "Membro não encontrado." });
    res.json({ status: "sucesso", mensagem: "Membro removido." });
  });
});

// =============================================================
// ERROR HANDLER GLOBAL
// =============================================================

app.use((err, req, res, next) => {
  console.error("Erro não tratado:", err.stack);
  res.status(500).json({ status: "erro", mensagem: "Erro interno do servidor." });
});

app.listen(PORT, () => {
  console.log(`API Matchup ativa em http://localhost:${PORT}`);
});
