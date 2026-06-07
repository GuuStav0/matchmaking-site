// api.js
import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import { db, createTables } from "./statements.js";

const app = express();
const PORT = 3000;

// Configurações Globais / Middlewares
app.use(cors());
app.use(express.json());

// =======================================================
// MÉTODOS GET (LISTAGENS / BUSCAS)
// =======================================================

// 1. Rota de Login: Verificar credenciais do usuário
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ status: "erro", mensagem: "Email e senha são obrigatórios." });
  }

  // Busca os dados do User E os dados do Profile vinculado
  const query = `
        SELECT 
            u.id, 
            u.email, 
            u.password, 
            p.nickname, 
            p.avatar_url 
        FROM users u
        LEFT JOIN profiles p
        ON p.id = gg.creator_id
        WHERE u.email = ?
    `;

  db.get(query, [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ status: "erro", mensagem: err.message });
    }

    // Se o usuário não existir
    if (!user) {
      return res
        .status(401)
        .json({ status: "erro", mensagem: "E-mail ou senha incorretos." });
    }

    // Compara a senha digitada com a senha criptografada do banco
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res
        .status(401)
        .json({ status: "erro", mensagem: "E-mail ou senha incorretos." });
    }

    // Se deu tudo certo, retorna os dados do usuário E do perfil para o React salvar na sessão
    res.json({
      status: "sucesso",
      mensagem: "Login realizado com sucesso!",
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        avatar_url: user.avatar_url,
      },
    });
  });
});

// 2. Listar todos os jogos disponíveis no catálogo (games) com contagem de salas ativas para cada jogo
// Dentro do seu api.js (Backend)

// Dentro do seu api.js (Backend)
app.get("/api/games", (req, res) => {
  const query = `
    SELECT 
      g.id, 
      g.name, 
      g.image_url AS cover_url, 
      gn.name AS genre,
      COUNT(gg.id) AS rooms_count
    FROM games g
    INNER JOIN genres gn ON g.genre_id = gn.id
    LEFT JOIN game_groups gg ON g.id = gg.game_id
    GROUP BY g.id, g.name, g.image_url, gn.name
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error("❌ Erro na consulta de jogos:", err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows); // Envia o array
  });
});

// ─── BUSCAR DADOS DE UM JOGO ESPECÍFICO ───────────────────────────────────
// Buscar metadados do jogo para o Banner
app.get("/api/games/:gameId", (req, res) => {
  const { gameId } = req.params;
  const query = `
    SELECT id, name, '#1a0a2e' AS cover_color, '#c084fc' AS cover_accent, image_url
    FROM games 
    WHERE id = ?
  `;
  db.get(query, [gameId], (err, row) => {
    if (err)
      return res.status(500).json({ status: "erro", mensagem: err.message });
    if (!row)
      return res
        .status(404)
        .json({ status: "erro", mensagem: "Jogo não encontrado." });

    // Adiciona o gênero simulado ou estático baseado na sua tabela
    res.json({ ...row, genre: "FPS" });
  });
});

// ─── BUSCAR APENAS AS SALAS DESSE JOGO ────────────────────────────────────
app.get("/api/games/:gameId/rooms", (req, res) => {
  const { gameId } = req.params;

  const query = `
    SELECT 
      gg.id,
      gg.name,
      p.nickname AS owner,
      p.avatar_url AS owner_avatar,
      gg.game_style AS style, 
      (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = gg.id) AS members,
      gg.max_slots AS slots,
      gg.rank_min,
      gg.rank_max,
      gg.schedule,
      gg.language,
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

    const formattedRooms = rows.map((row) => ({
      id: row.id,
      name: roomNameMap(row.name), // Mantém qualquer lógica interna
      owner: row.owner,
      owner_avatar: row.owner_avatar,
      style: row.style || "Casual",
      members: row.members,
      slots: row.slots,
      rank_min: row.rank_min,
      rank_max: row.rank_max,
      schedule: row.schedule,
      language: row.language,
      mic_required: row.mic_required === 1, // Transforma 1 em true de forma real
      description: row.description,
      created_at: row.created_at,
      // Converte "Tag1, Tag2" do banco no Array ["Tag1", "Tag2"] esperado pelo seu CSS original
      tags: row.tags ? row.tags.split(",").map((t) => t.trim()) : [],
      status: row.members >= row.slots ? "full" : "open",
    }));

    res.json(formattedRooms);
  });
});

// Função auxiliar apenas caso seu código original use alguma normalização de strings
function roomNameMap(name) {
  return name;
}

app.post("/api/rooms", (req, res) => {
  const {
    game_id,
    creator_id,
    name,
    bio,
    max_slots,
    game_style,
    rank_min,
    rank_max,
    schedule,
    language,
    mic_required,
    tags,
  } = req.body;

  const query = `
    INSERT INTO game_groups (
      game_id, creator_id, name, bio, max_slots, 
      game_style, rank_min, rank_max, schedule, language, mic_required, tags
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  // Se o front mandar as tags como Array ['A', 'B'], o .join junta em "A, B" para o banco
  const tagsString = Array.isArray(tags) ? tags.join(", ") : tags;

  // Converte true/false do Front para 1/0 do SQLite
  const micValue = mic_required ? 1 : 0;

  db.run(
    query,
    [
      game_id,
      creator_id,
      name,
      bio,
      max_slots,
      game_style || "-",
      rank_min || "-",
      rank_max || "-",
      schedule || "-",
      language || "-",
      micValue,
      tagsString,
    ],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ status: "sucesso", id: this.lastID });
    },
  );
});

// =======================================================
// MÉTODOS POST (INSERTS - CRIAÇÃO)
// =======================================================

// 1. Cadastro completo: Cria Usuário (users) e Perfil (profiles) com senha criptografada
app.post("/api/users", async (req, res) => {
  // <-- ADICIONADO 'async' AQUI
  // Pegando os dados que vêm do formulário do React
  const { email, password, nickname } = req.body;

  if (!email || !password || !nickname) {
    return res.status(400).json({
      status: "erro",
      mensagem: "Email, senha e nickname são obrigatórios.",
    });
  }

  try {
    // 🔥 GERANDO A CRIPTOGRAFIA AQUI ANTES DE SALVAR NO BANCO
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Iniciamos uma transação para garantir integridade dos dados
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");

      // Passo 1: Inserir na tabela 'users' (Usando a 'hashedPassword')
      const queryUser = `INSERT INTO users (email, password) VALUES (?, ?)`;
      db.run(queryUser, [email, hashedPassword], function (err) {
        // <-- Trocado de 'password' para 'hashedPassword'
        if (err) {
          db.run("ROLLBACK");
          if (err.message.includes("UNIQUE")) {
            return res.status(400).json({
              status: "erro",
              mensagem: "Este email já está cadastrado.",
            });
          }
          return res
            .status(500)
            .json({ status: "erro", mensagem: err.message });
        }

        const userId = this.lastID; // ID gerado para o usuário

        // Passo 2: Inserir na tabela 'profiles' usando o userId gerado
        const queryProfile = `INSERT INTO profiles (user_id, nickname) VALUES (?, ?)`;
        db.run(queryProfile, [userId, nickname], function (err) {
          if (err) {
            db.run("ROLLBACK");
            return res
              .status(500)
              .json({ status: "erro", mensagem: err.message });
          }

          // Se os dois inserts derem certo, salva em definitivo no banco
          db.run("COMMIT");
          res.status(201).json({
            status: "sucesso",
            mensagem: "Conta e perfil criados com sucesso!",
            userId: userId,
          });
        });
      });
    });
  } catch (error) {
    console.error("Erro ao criptografar senha:", error);
    return res
      .status(500)
      .json({ status: "erro", mensagem: "Erro interno ao processar a senha." });
  }
});

// 2. Vincular Jogo ao Perfil (user_games) - Respeitando o game_style ('casual' ou 'competitive')
app.post("/api/user-games", (req, res) => {
  const { profile_id, game_id, game_style, game_rank } = req.body;

  if (!profile_id || !game_id || !game_style) {
    return res.status(400).json({
      status: "erro",
      mensagem: "profile_id, game_id e game_style são obrigatórios.",
    });
  }

  // Validação extra do CHECK constraint do SQL
  if (!["casual", "competitive"].includes(game_style)) {
    return res.status(400).json({
      status: "erro",
      mensagem: "game_style deve ser 'casual' ou 'competitive'.",
    });
  }

  const query = `INSERT INTO user_games (profile_id, game_id, game_style, game_rank) VALUES (?, ?, ?, ?)`;
  db.run(
    query,
    [profile_id, game_id, game_style, game_rank || null],
    function (err) {
      if (err)
        return res.status(500).json({ status: "erro", mensagem: err.message });
      res.status(201).json({
        status: "sucesso",
        mensagem: "Jogo vinculado ao perfil com sucesso!",
      });
    },
  );
});

// 3. Cadastrar novo Jogo no sistema (games)
app.post("/api/games", (req, res) => {
  const { name, genre_id, image_url } = req.body;

  if (!name) {
    return res
      .status(400)
      .json({ status: "erro", mensagem: "O nome do jogo é obrigatório." });
  }

  const query = `INSERT INTO games (name, genre_id, image_url) VALUES (?, ?, ?)`;
  db.run(query, [name, genre_id, image_url || null], function (err) {
    if (err)
      return res.status(500).json({ status: "erro", mensagem: err.message });
    res.status(201).json({
      status: "sucesso",
      mensagem: "Jogo cadastrado no sistema!",
      id: this.lastID,
    });
  });
});

// 4. Criar um novo Grupo de jogo (game_groups)
app.post("/api/game-groups", (req, res) => {
  const { creator_id, game_id, name, max_slots } = req.body;

  if (!creator_id || !game_id || !name || !max_slots) {
    return res.status(400).json({
      status: "erro",
      mensagem: "Dono, jogo, nome e vagas máximas são obrigatórios.",
    });
  }

  const query = `INSERT INTO game_groups (creator_id, game_id, name, max_slots) VALUES (?, ?, ?, ?)`;
  db.run(query, [creator_id, game_id, name, max_slots], function (err) {
    if (err)
      return res.status(500).json({ status: "erro", mensagem: err.message });
    res.status(201).json({
      status: "sucesso",
      mensagem: "Grupo criado com sucesso!",
      id: this.lastID,
    });
  });
});

// 5. Adicionar Membro em um Grupo (group_members)
app.post("/api/group-members", (req, res) => {
  const { group_id, profile_id, role } = req.body;

  if (!group_id || !profile_id) {
    return res.status(400).json({
      status: "erro",
      mensagem: "group_id e profile_id são obrigatórios.",
    });
  }

  // Validação extra do CHECK constraint do SQL para role
  const finalRole = role || "member";
  if (!["owner", "member"].includes(finalRole)) {
    return res
      .status(400)
      .json({ status: "erro", mensagem: "role deve ser 'owner' ou 'member'." });
  }

  const query = `INSERT INTO group_members (group_id, profile_id, role) VALUES (?, ?, ?)`;
  db.run(query, [group_id, profile_id, finalRole], function (err) {
    if (err)
      return res.status(500).json({ status: "erro", mensagem: err.message });
    res
      .status(201)
      .json({ status: "sucesso", mensagem: "Jogador adicionado ao grupo!" });
  });
});

// =======================================================
// MÉTODOS PUT (UPDATES - ATUALIZAÇÃO)
// =======================================================

// 1. Atualizar Senha do Usuário (users)
app.put("/api/users/:id", (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  if (!password) {
    return res
      .status(400)
      .json({ status: "erro", mensagem: "A nova password é obrigatória." });
  }

  const query = `UPDATE users SET password = ? WHERE id = ?`;
  db.run(query, [password, id], function (err) {
    if (err)
      return res.status(500).json({ status: "erro", mensagem: err.message });
    if (this.changes === 0)
      return res
        .status(404)
        .json({ status: "erro", mensagem: "Usuário não encontrado." });
    res.json({ status: "sucesso", mensagem: "Senha atualizada com sucesso!" });
  });
});

// 2. Atualizar Perfil (profiles)
app.put("/api/profiles/:id", (req, res) => {
  const { id } = req.params;
  const { nickname, bio, avatar_url, schedule_availability } = req.body;

  if (!nickname) {
    return res
      .status(400)
      .json({ status: "erro", mensagem: "O nickname é obrigatório." });
  }

  const query = `
        UPDATE profiles 
        SET nickname = ?, bio = ?, avatar_url = ?, schedule_availability = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `;
  db.run(
    query,
    [
      nickname,
      bio || null,
      avatar_url || null,
      schedule_availability || null,
      id,
    ],
    function (err) {
      if (err)
        return res.status(500).json({ status: "erro", mensagem: err.message });
      if (this.changes === 0)
        return res
          .status(404)
          .json({ status: "erro", mensagem: "Perfil não encontrado." });
      res.json({
        status: "sucesso",
        mensagem: "Perfil atualizado com sucesso!",
      });
    },
  );
});

// 3. Atualizar Dados de um Jogo (games)
app.put("/api/games/:id", (req, res) => {
  const { id } = req.params;
  const { name, genre_id, image_url } = req.body;

  // Validação obrigatória
  if (!name) {
    return res
      .status(400)
      .json({ status: "erro", mensagem: "O nome do jogo é obrigatório." });
  }
  if (!genre_id) {
    return res
      .status(400)
      .json({ status: "erro", mensagem: "A categoria/gênero é obrigatória." });
  }

  const query = `UPDATE games SET name = ?, genre_id = ?, image_url = ? WHERE id = ?`;

  db.run(query, [name, genre_id, image_url || null, id], function (err) {
    if (err) {
      if (err.message.includes("UNIQUE constraint failed")) {
        return res.status(409).json({
          status: "erro",
          mensagem: "Já existe outro jogo cadastrado com este nome.",
        });
      }

      // Captura o erro caso passem um genre_id que não existe na tabela 'genres'
      if (err.message.includes("FOREIGN KEY constraint failed")) {
        return res.status(400).json({
          status: "erro",
          mensagem: "A categoria informada é inválida ou não existe.",
        });
      }

      return res.status(500).json({ status: "erro", mensagem: err.message });
    }

    if (this.changes === 0) {
      return res
        .status(404)
        .json({ status: "erro", mensagem: "Jogo não encontrado." });
    }

    res.json({ status: "sucesso", mensagem: "Jogo atualizado com sucesso!" });
  });
});

// 4. Atualizar Nível de Habilidade no Jogo (user_games)
app.put("/api/user-games", (req, res) => {
  const { profile_id, game_id, skill_level } = req.body;

  if (!profile_id || !game_id || !skill_level) {
    return res.status(400).json({
      status: "erro",
      mensagem: "profile_id, game_id e skill_level são obrigatórios.",
    });
  }

  const query = `UPDATE user_games SET skill_level = ? WHERE profile_id = ? AND game_id = ?`;
  db.run(query, [skill_level, profile_id, game_id], function (err) {
    if (err)
      return res.status(500).json({ status: "erro", mensagem: err.message });
    if (this.changes === 0)
      return res
        .status(404)
        .json({ status: "erro", mensagem: "Vínculo de jogo não encontrado." });
    res.json({
      status: "sucesso",
      mensagem: "Nível de habilidade atualizado!",
    });
  });
});

// 5. Atualizar Informações de um Grupo (game_groups)
app.put("/api/game-groups/:id", (req, res) => {
  const { id } = req.params;
  const { name, description, max_players } = req.body;

  if (!name) {
    return res
      .status(400)
      .json({ status: "erro", mensagem: "O nome do grupo é obrigatório." });
  }

  const query = `UPDATE game_groups SET name = ?, description = ?, max_players = ? WHERE id = ?`;
  db.run(
    query,
    [name, description || null, max_players || 5, id],
    function (err) {
      if (err)
        return res.status(500).json({ status: "erro", mensagem: err.message });
      if (this.changes === 0)
        return res
          .status(404)
          .json({ status: "erro", mensagem: "Grupo não encontrado." });
      res.json({
        status: "sucesso",
        mensagem: "Grupo atualizado com sucesso!",
      });
    },
  );
});

// 6. Alterar Cargo de um Membro no Grupo (group_members)
app.put("/api/group-members", (req, res) => {
  const { group_id, profile_id, role } = req.body;

  if (!group_id || !profile_id || !role) {
    return res.status(400).json({
      status: "erro",
      mensagem: "group_id, profile_id e role são obrigatórios.",
    });
  }

  const query = `UPDATE group_members SET role = ? WHERE group_id = ? AND profile_id = ?`;
  db.run(query, [role, group_id, profile_id], function (err) {
    if (err)
      return res.status(500).json({ status: "erro", mensagem: err.message });
    if (this.changes === 0)
      return res
        .status(404)
        .json({ status: "erro", mensagem: "Membro ou grupo não encontrado." });
    res.json({ status: "sucesso", mensagem: "Cargo do membro atualizado!" });
  });
});

// =======================================================
// MÉTODOS DELETE (DELETES - REMOÇÃO)
// =======================================================

// 1. Apagar Usuário (users) -> Cascata apaga profiles, admins, etc.
app.delete("/api/users/:id", (req, res) => {
  const { id } = req.params;

  db.run(`DELETE FROM users WHERE id = ?`, [id], function (err) {
    if (err)
      return res.status(500).json({ status: "erro", mensagem: err.message });
    if (this.changes === 0)
      return res
        .status(404)
        .json({ status: "erro", mensagem: "Usuário não encontrado." });
    res.json({
      status: "sucesso",
      mensagem: "Usuário e dados vinculados removidos com sucesso!",
    });
  });
});

// 2. Apagar apenas o Perfil (profiles)
app.delete("/api/profiles/:id", (req, res) => {
  const { id } = req.params;

  db.run(`DELETE FROM profiles WHERE id = ?`, [id], function (err) {
    if (err)
      return res.status(500).json({ status: "erro", mensagem: err.message });
    if (this.changes === 0)
      return res
        .status(404)
        .json({ status: "erro", message: "Perfil não encontrado." });
    res.json({ status: "sucesso", mensagem: "Perfil removido com sucesso." });
  });
});

// 3. Remover um Jogo do catálogo (games)
app.delete("/api/games/:id", (req, res) => {
  const { id } = req.params;

  db.run(`DELETE FROM games WHERE id = ?`, [id], function (err) {
    if (err)
      return res.status(500).json({ status: "erro", mensagem: err.message });
    if (this.changes === 0)
      return res
        .status(404)
        .json({ status: "erro", mensagem: "Jogo não encontrado." });
    res.json({ status: "sucesso", mensagem: "Jogo removido do catálogo." });
  });
});

// 4. Remover um Jogo do perfil de um usuário (user_games)
app.delete("/api/user-games", (req, res) => {
  const { profile_id, game_id } = req.body;

  db.run(
    `DELETE FROM user_games WHERE profile_id = ? AND game_id = ?`,
    [profile_id, game_id],
    function (err) {
      if (err)
        return res.status(500).json({ status: "erro", mensagem: err.message });
      if (this.changes === 0)
        return res
          .status(404)
          .json({ status: "erro", mensagem: "Vínculo não encontrado." });
      res.json({ status: "sucesso", mensagem: "Jogo desvinculado do perfil." });
    },
  );
});

// 5. Deletar um Grupo de jogo (game_groups)
app.delete("/api/game-groups/:id", (req, res) => {
  const { id } = req.params;

  db.run(`DELETE FROM game_groups WHERE id = ?`, [id], function (err) {
    if (err)
      return res.status(500).json({ status: "erro", mensagem: err.message });
    if (this.changes === 0)
      return res
        .status(404)
        .json({ status: "erro", mensagem: "Grupo não encontrado." });
    res.json({ status: "sucesso", mensagem: "Grupo removido com sucesso." });
  });
});

// 6. Remover um Membro de um Grupo / Sair do grupo (group_members)
app.delete("/api/group-members", (req, res) => {
  const { group_id, profile_id } = req.body;

  db.run(
    `DELETE FROM group_members WHERE group_id = ? AND profile_id = ?`,
    [group_id, profile_id],
    function (err) {
      if (err)
        return res.status(500).json({ status: "erro", mensagem: err.message });
      if (this.changes === 0)
        return res.status(404).json({
          status: "erro",
          mensagem: "Membro não encontrado neste grupo.",
        });
      res.json({ status: "sucesso", mensagem: "Membro removido do grupo." });
    },
  );
});

app.listen(PORT, () => {
  console.log(
    `API ativa com suporte completo a CRUD em http://localhost:${PORT}`,
  );
});
