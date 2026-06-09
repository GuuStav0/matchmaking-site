// api.js
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import bcrypt from "bcrypt";
import { db, createTables } from "./statements.js";

const app = express();
app.use(cookieParser());
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

  const query = `
    SELECT 
      u.id, 
      u.email, 
      u.password, 
      p.id AS profile_id, 
      p.nickname, 
      p.avatar_url 
    FROM users u
    LEFT JOIN profiles p ON p.user_id = u.id
    WHERE u.email = ?
  `;

  db.get(query, [email], async (err, user) => {
    if (err) {
      return res
        .status(500)
        .json({ status: "erro", mensagem: "Erro interno no banco de dados." });
    }

    if (!user) {
      return res
        .status(401)
        .json({ status: "erro", mensagem: "E-mail ou senha incorretos." });
    }

    try {
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res
          .status(401)
          .json({ status: "erro", mensagem: "E-mail ou senha incorretos." });
      }

      // 🌟 PASSO NOVO: Configurando o Cookie HttpOnly seguro
      const umDia = 24 * 60 * 60 * 1000;
      res.cookie("sessao", user.id, {
        httpOnly: true, // 🛡️ Impede scripts JS maliciosos de lerem o cookie
        secure: false, // 🔒 Deixe 'false' para localhost (HTTP). Mude para 'true' apenas em produção (HTTPS)
        maxAge: umDia, // Tempo de expiração no navegador
        sameSite: "lax", // Proteção padrão contra CSRF
        path: "/", // Disponível em todo o domínio do app
      });

      // Retornamos os dados para o estado do React usar na hora do login,
      // mas sabendo que a chave de segurança real agora está trancada no cookie!
      res.json({
        status: "sucesso",
        mensagem: "Login realizado com sucesso!",
        dados: {
          id: user.id,
          profile_id: user.profile_id,
          email: user.email,
          nickname: user.nickname || "Jogador",
          avatar_url: user.avatar_url,
        },
      });
    } catch (bcryptErr) {
      res.status(500).json({
        status: "erro",
        mensagem: "Erro ao processar a autenticação.",
      });
    }
  });
});

// 2. Listar todos os jogos disponíveis no catálogo (games) com contagem de salas ativas para cada jogo
// Dentro do api.js (Backend)
app.get("/api/games", (req, res) => {
  const query = `
    SELECT 
      g.id, 
      g.name, 
      g.image_url AS cover_url, 
      g.ranks_tags,
      gn.name AS genre,
      COUNT(gg.id) AS rooms_count
    FROM games g
    INNER JOIN genres gn ON g.genre_id = gn.id
    LEFT JOIN game_groups gg ON g.id = gg.game_id
    GROUP BY g.id, g.name, g.image_url, g.ranks_tags, gn.name
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

// 1.1 GET /api/rooms/:roomId — Retorna os dados completos de uma sala e seus membros
app.get("/api/rooms/detail/:roomId", (req, res) => {
  const { roomId } = req.params;

  // Consulta para obter os dados da sala + nome do jogo
  const roomQuery = `
    SELECT gg.*, g.name AS game_name, g.image_url AS game_cover
    FROM game_groups gg
    INNER JOIN games g ON gg.game_id = g.id
    WHERE gg.id = ?
  `;

  db.get(roomQuery, [roomId], (err, room) => {
    if (err)
      return res.status(500).json({ status: "erro", mensagem: err.message });
    if (!room)
      return res
        .status(404)
        .json({ status: "erro", mensagem: "Sala não encontrada." });

    // Consulta secundária para buscar os membros atuais inseridos na tabela group_members
    const membersQuery = `
      SELECT p.id, p.nickname, p.avatar_url
      FROM group_members gm
      INNER JOIN profiles p ON gm.profile_id = p.id
      WHERE gm.group_id = ?
      ORDER BY gm.joined_at ASC
    `;

    db.all(membersQuery, [roomId], (memErr, members) => {
      if (memErr)
        return res
          .status(500)
          .json({ status: "erro", mensagem: memErr.message });

      room.members = members;
      res.json({ status: "sucesso", dados: room });
    });
  });
});

// 1.2 GET /api/rooms/:roomId/messages — Retorna as últimas 50 mensagens do chat
app.get("/api/rooms/:roomId/messages", (req, res) => {
  const { roomId } = req.params;
  const query = `
    SELECT rm.id, rm.content, rm.created_at, p.id AS profile_id, p.nickname, p.avatar_url
    FROM room_messages rm
    INNER JOIN profiles p ON rm.profile_id = p.id
    WHERE rm.group_id = ?
    ORDER BY rm.created_at ASC
    LIMIT 50
  `;

  db.all(query, [roomId], (err, rows) => {
    if (err)
      return res.status(500).json({ status: "erro", mensagem: err.message });
    res.json({ status: "sucesso", dados: rows });
  });
});

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

  if (!game_id || !creator_id || !name || !bio) {
    return res.status(400).json({
      status: "erro",
      mensagem:
        "Por favor, preencha todos os campos obrigatórios (Jogo, Título e Descrição).",
    });
  }

  const queryRoom = `
    INSERT INTO game_groups (
      game_id, creator_id, name, bio, max_slots, 
      game_style, rank_min, rank_max, schedule, language, mic_required, tags
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const tagsString = Array.isArray(tags) ? tags.join(", ") : tags;
  const micValue = mic_required ? 1 : 0;

  // 1. Criamos a Sala de Jogo
  db.run(
    queryRoom,
    [
      parseInt(game_id),
      parseInt(creator_id),
      name.trim(),
      bio.trim(),
      parseInt(max_slots) || 4,
      game_style || "Casual",
      rank_min || "Livre",
      rank_max || "Livre",
      schedule ? schedule.trim() : "-",
      language ? language.trim() : "Português",
      micValue,
      tagsString ? tagsString.trim() : null,
    ],
    function (err) {
      if (err) {
        return res.status(500).json({
          status: "erro",
          mensagem: "Erro ao criar sala: " + err.message,
        });
      }

      const novaSalaId = this.lastID; // Captura o ID da sala recém-criada

      // Insere automaticamente o criador como membro ativo da própria sala
      // Altere o nome das colunas se a sua tabela 'group_members' usar propriedades diferentes (ex: user_id, status)
      const queryMember = `
        INSERT INTO group_members (group_id, profile_id, joined_at) 
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `;

      db.run(queryMember, [novaSalaId, parseInt(creator_id)], (memberErr) => {
        if (memberErr) {
          console.error(
            "⚠️ Falha ao colocar o criador na sala:",
            memberErr.message,
          );
          // Mesmo se falhar o vínculo do membro, a sala foi gerada, mas o ideal é tratar ou retornar aviso
        }

        // Retorna sucesso informando que a sala está pronta e com o dono lá dentro
        res.status(201).json({
          status: "sucesso",
          salaId: novaSalaId,
        });
      });
    },
  );
});

// =======================================================
// MÉTODOS POST (INSERTS - CRIAÇÃO)
// =======================================================

// 1. Cadastro completo: Cria Usuário (users) e Perfil (profiles) com senha criptografada
app.post("/api/users", async (req, res) => {
  // Pegando os dados que vêm do formulário do React
  const { email, password, nickname } = req.body;

  if (!email || !password || !nickname) {
    return res.status(400).json({
      status: "erro",
      mensagem: "Email, senha e nickname são obrigatórios.",
    });
  }

  try {
    // GERANDO A CRIPTOGRAFIA AQUI ANTES DE SALVAR NO BANCO
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Iniciamos uma transação para garantir integridade dos dados
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");

      // Passo 1: Inserir na tabela 'users' (Usando a 'hashedPassword')
      const queryUser = `INSERT INTO users (email, password) VALUES (?, ?)`;
      db.run(queryUser, [email, hashedPassword], function (err) {
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

// 1.3 POST /api/rooms/:roomId/messages — Salva uma nova mensagem no chat
app.post("/api/rooms/:roomId/messages", (req, res) => {
  const { roomId } = req.params;
  const { profile_id, content } = req.body;

  if (!profile_id || !content || content.trim() === "") {
    return res.status(400).json({
      status: "erro",
      mensagem: "Mensagem inválida ou sem remetente.",
    });
  }

  const query = `
    INSERT INTO room_messages (group_id, profile_id, content)
    VALUES (?, ?, ?)
  `;

  db.run(query, [roomId, profile_id, content.trim()], function (err) {
    if (err)
      return res.status(500).json({ status: "erro", mensagem: err.message });
    res.status(201).json({ status: "sucesso", id: this.lastID });
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

  const {
    name,
    bio,
    game_style,
    max_slots,
    rank_min,
    rank_max,
    schedule,
    mic_required,
    tags,
  } = req.body;

  // Validação básica igual à sua original
  if (!name) {
    return res
      .status(400)
      .json({ status: "erro", mensagem: "O nome do grupo é obrigatório." });
  }

  const query = `
    UPDATE game_groups 
    SET 
      name = ?, 
      bio = ?, 
      game_style = ?, 
      max_slots = ?, 
      rank_min = ?, 
      rank_max = ?, 
      schedule = ?, 
      mic_required = ?, 
      tags = ? 
    WHERE id = ?
  `;

  db.run(
    query,
    [
      name,
      bio || null,
      game_style || "Casual",
      max_slots || 5,
      rank_min || "Qualquer",
      rank_max || "Qualquer",
      schedule || null,
      mic_required ?? 0, // Garante que salve 1 ou 0
      tags || null,
      id,
    ],
    function (err) {
      if (err) {
        return res.status(500).json({ status: "erro", mensagem: err.message });
      }
      if (this.changes === 0) {
        return res
          .status(404)
          .json({ status: "erro", mensagem: "Grupo não encontrado." });
      }
      res.json({
        status: "sucesso",
        mensagem: "Grupo atualizado com sucesso!",
      });
    },
  );
});

// ROTA PARA UM JOGADOR ENTRAR EM UMA SALA EXISTENTE
app.post("/api/group-members", (req, res) => {
  const { group_id, profile_id } = req.body;

  if (!group_id || !profile_id) {
    return res.status(400).json({
      status: "erro",
      mensagem: "Dados insuficientes para entrar na sala.",
    });
  }

  const checkAlreadyMemberQuery = `
    SELECT group_id FROM group_members 
    WHERE group_id = ? AND profile_id = ?
  `;

  db.get(
    checkAlreadyMemberQuery,
    [group_id, profile_id],
    (errCheck, existingMember) => {
      if (errCheck) {
        return res
          .status(500)
          .json({ status: "erro", mensagem: errCheck.message });
      }

      // Se o registro já existir, deixa o jogador passar direto
      if (existingMember) {
        return res.json({
          status: "sucesso",
          mensagem: "Você já é membro deste lobby, redirecionando...",
        });
      }

      // Se não for membro ainda, verifica se a sala tem espaço disponível antes de inserir
      const checkSlotsQuery = `
      SELECT gg.max_slots, COUNT(gm.profile_id) as current_members
      FROM game_groups gg
      LEFT JOIN group_members gm ON gg.id = gm.group_id
      WHERE gg.id = ?
      GROUP BY gg.id
    `;

      db.get(checkSlotsQuery, [group_id], (errSlots, roomInfo) => {
        if (errSlots) {
          return res
            .status(500)
            .json({ status: "erro", mensagem: errSlots.message });
        }
        if (!roomInfo) {
          return res
            .status(404)
            .json({ status: "erro", mensagem: "Sala não encontrada." });
        }

        if (roomInfo.current_members >= roomInfo.max_slots) {
          return res.status(400).json({
            status: "erro",
            mensagem: "A sala atingiu o limite máximo de jogadores!",
          });
        }

        // Faz o INSERT com segurança
        const insertQuery = `
        INSERT INTO group_members (group_id, profile_id, joined_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `;

        db.run(insertQuery, [group_id, profile_id], function (insertErr) {
          if (insertErr) {
            return res
              .status(500)
              .json({ status: "erro", mensagem: insertErr.message });
          }
          res.status(201).json({
            status: "sucesso",
            mensagem: "Entrou na sala com sucesso!",
          });
        });
      });
    },
  );
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
// Deletar um Grupo e suas Mensagens (Dono ou Admin)
// Deletar um Grupo e suas Mensagens (Dono ou Admin) via Headers
app.delete("/api/game-groups/:id", (req, res) => {
  const { id } = req.params;
  
  // Pegamos o ID do perfil requisitante através do Header customizado
  const profile_id = req.headers["x-profile-id"]; 

  if (!profile_id) {
    return res.status(400).json({ 
      status: "erro", 
      mensagem: "O ID do perfil (x-profile-id) é obrigatório no cabeçalho para validação." 
    });
  }

  // Query que verifica se ele é o criador do grupo OU se ele possui registro na tabela de admins
  const checkQuery = `
    SELECT 
      gg.creator_id,
      (SELECT 1 FROM admins a WHERE a.user_id = p.user_id) AS is_admin
    FROM game_groups gg
    LEFT JOIN profiles p ON p.id = ?
    WHERE gg.id = ?
  `;

  db.get(checkQuery, [profile_id, id], (err, row) => {
    if (err) {
      return res.status(500).json({ status: "erro", mensagem: err.message });
    }
    
    if (!row) {
      return res.status(404).json({ status: "erro", mensagem: "Grupo não encontrado." });
    }

    const isCreator = row.creator_id === Number(profile_id);
    const isAdmin = row.is_admin === 1;

    if (!isCreator && !isAdmin) {
      return res.status(403).json({ 
        status: "erro", 
        mensagem: "Você não tem permissão para excluir este grupo." 
      });
    }

    // Executa a limpeza em série das tabelas usando db.serialize
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");

      // Passo A: Deleta da tabela correta: room_messages
      const deleteMessagesQuery = `DELETE FROM room_messages WHERE group_id = ?`;
      
      db.run(deleteMessagesQuery, [id], function (msgErr) {
        if (msgErr) {
          db.run("ROLLBACK");
          return res.status(500).json({ status: "erro", mensagem: "Erro ao apagar mensagens: " + msgErr.message });
        }

        // Passo B: Deleta o grupo de game_groups
        const deleteGroupQuery = `DELETE FROM game_groups WHERE id = ?`;

        db.run(deleteGroupQuery, [id], function (groupErr) {
          if (groupErr) {
            db.run("ROLLBACK");
            return res.status(500).json({ status: "erro", mensagem: "Erro ao apagar o grupo: " + groupErr.message });
          }

          db.run("COMMIT");

          res.json({
            status: "sucesso",
            mensagem: isAdmin 
              ? "Grupo e histórico de chat excluídos por um administrador!" 
              : "Seu grupo e histórico de chat foram excluídos com sucesso!",
          });
        });
      });
    });
  });
});

// GET /api/players — Lista jogadores com filtros opcionais (?game=&style=)
app.get("/api/players", (req, res) => {
  const { game, style } = req.query;

  let query = `
    SELECT DISTINCT
      p.id,
      p.nickname,
      p.bio,
      p.avatar_url,
      p.schedule_availability,
      ug.game_style,
      ug.game_rank,
      g.name AS game_name
    FROM profiles p
    INNER JOIN user_games ug ON p.id = ug.profile_id
    INNER JOIN games g ON ug.game_id = g.id
    WHERE 1=1
  `;

  const params = [];

  if (game) {
    query += ` AND g.id = ?`;
    params.push(game);
  }

  if (style) {
    query += ` AND ug.game_style = ?`;
    params.push(style);
  }

  query += ` ORDER BY p.nickname ASC LIMIT 50`;

  db.all(query, params, (err, rows) => {
    if (err)
      return res.status(500).json({ status: "erro", mensagem: err.message });
    res.json({ status: "sucesso", dados: rows });
  });
});

// GET /api/players/:id — Perfil público completo de um jogador
app.get("/api/players/:id", (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT
      p.id,
      p.nickname,
      p.bio,
      p.avatar_url,
      p.schedule_availability,
      p.created_at,
      json_group_array(
        json_object(
          'game_name', g.name,
          'game_style', ug.game_style,
          'game_rank', ug.game_rank,
          'image_url', g.image_url
        )
      ) AS games
    FROM profiles p
    LEFT JOIN user_games ug ON p.id = ug.profile_id
    LEFT JOIN games g ON ug.game_id = g.id
    WHERE p.id = ?
    GROUP BY p.id
  `;

  db.get(query, [id], (err, row) => {
    if (err)
      return res.status(500).json({ status: "erro", mensagem: err.message });
    if (!row)
      return res
        .status(404)
        .json({ status: "erro", mensagem: "Jogador não encontrado." });

    row.games = JSON.parse(row.games || "[]").filter(
      (g) => g.game_name !== null,
    );
    res.json({ status: "sucesso", dados: row });
  });
});

//!!!!!!!!!!!!!Error handler global — deve ficar aqui, logo antes do app.listen!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
app.use((err, req, res, next) => {
  console.error("❌ Erro não tratado:", err.stack);
  res.status(500).json({
    status: "erro",
    mensagem: "Erro interno do servidor. Tente novamente.",
    detalhe: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

app.listen(PORT, () => {
  console.log(
    `API ativa com suporte completo a CRUD em http://localhost:${PORT}`,
  );
});

// 1.4 DELETE /api/rooms/:roomId/members/:profileId — Expulsa um membro (Apenas Dono)
app.delete("/api/rooms/:roomId/members/:profileId", (req, res) => {
  const { roomId, profileId } = req.params;
  const requesterId = req.headers["x-user-id"]; // Recebe quem está pedindo para validar segurança

  // Primeiro verifica quem é o criador da sala
  db.get(
    "SELECT creator_id FROM game_groups WHERE id = ?",
    [roomId],
    (err, room) => {
      if (err)
        return res.status(500).json({ status: "erro", mensagem: err.message });
      if (!room)
        return res
          .status(404)
          .json({ status: "erro", mensagem: "Sala não encontrada." });

      if (parseInt(room.creator_id) !== parseInt(requesterId)) {
        return res.status(403).json({
          status: "erro",
          mensagem: "Apenas o Host da sala pode kickar membros.",
        });
      }

      // Executa a remoção do membro na tabela de vínculo
      db.run(
        "DELETE FROM group_members WHERE group_id = ? AND profile_id = ?",
        [roomId, profileId],
        function (delErr) {
          if (delErr)
            return res
              .status(500)
              .json({ status: "erro", mensagem: delErr.message });
          res.json({
            status: "sucesso",
            mensagem: "Membro expulso com sucesso da sessão.",
          });
        },
      );
    },
  );
});

// Extra: DELETE /api/group-members — Rota genérica para sair voluntariamente da sala
app.delete("/api/group-members", (req, res) => {
  const { group_id, profile_id } = req.body;

  db.run(
    "DELETE FROM group_members WHERE group_id = ? AND profile_id = ?",
    [group_id, profile_id],
    function (err) {
      if (err)
        return res.status(500).json({ status: "erro", mensagem: err.message });
      res.json({ status: "sucesso", mensagem: "Você saiu da sala." });
    },
  );
});
