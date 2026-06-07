// src/routes/profiles.routes.js
// Sprint 2 – RF01  Edição de perfil (PUT/PATCH)
//
//  PUT   /api/profiles/:id  → atualiza bio, avatar_url, schedule_availability
//  GET   /api/profiles/:id  → retorna perfil público de um usuário
//
// O perfil é criado automaticamente no POST /api/users (cadastro).
// Esta rota apenas atualiza campos opcionais do perfil já existente.

import { Router }          from "express";
import { db }              from "../database.js";
import { requireAuth }     from "../middleware/authMiddleware.js";

const router = Router();

// ── Helper: busca perfil por ID ───────────────────────────────────────────────
function findProfile(id) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT p.id, p.nickname, p.bio, p.avatar_url, p.schedule_availability,
              p.created_at, p.updated_at
       FROM profiles p WHERE p.id = ?`,
      [id],
      (err, row) => (err ? reject(err) : resolve(row ?? null))
    );
  });
}

// ── GET /api/profiles/:id ─────────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const profile = await findProfile(req.params.id);
    if (!profile) {
      return res.status(404).json({ status: "erro", mensagem: "Perfil não encontrado." });
    }
    res.json({ status: "sucesso", dados: profile });
  } catch (err) {
    console.error("Erro no GET /profiles/:id:", err.message);
    res.status(500).json({ status: "erro", mensagem: "Erro interno." });
  }
});

// ── PUT /api/profiles/:id ─────────────────────────────────────────────────────
// Requer autenticação; apenas o dono do perfil pode editar.
router.put("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  // Apenas o próprio usuário pode editar seu perfil
  if (req.userId !== id) {
    return res.status(403).json({
      status: "erro",
      mensagem: "Acesso negado. Você só pode editar seu próprio perfil.",
    });
  }

  const { nickname, bio, avatar_url, schedule_availability } = req.body ?? {};

  if (!nickname && !bio && avatar_url === undefined && !schedule_availability) {
    return res.status(400).json({
      status: "erro",
      mensagem: "Informe ao menos um campo para atualizar.",
    });
  }

  // Validações básicas
  if (bio !== undefined) {
    if (bio.trim().length < 10) {
      return res.status(400).json({ status: "erro", mensagem: "Bio deve ter ao menos 10 caracteres." });
    }
    if (bio.length > 300) {
      return res.status(400).json({ status: "erro", mensagem: "Bio pode ter no máximo 300 caracteres." });
    }
  }

  try {
    // Garante que o perfil existe (pode não ter sido criado ainda em dados legados)
    const existing = await findProfile(id);

    const sets = [];
    const vals = [];

    if (nickname)              { sets.push("nickname = ?");              vals.push(nickname.trim()); }
    if (bio !== undefined)     { sets.push("bio = ?");                   vals.push(bio.trim()); }
    if (avatar_url !== undefined) { sets.push("avatar_url = ?");         vals.push(avatar_url?.trim() || null); }
    if (schedule_availability) { sets.push("schedule_availability = ?"); vals.push(schedule_availability); }

    sets.push("updated_at = ?");
    vals.push(new Date().toISOString());
    vals.push(id);

    if (existing) {
      // Atualiza perfil existente
      db.run(
        `UPDATE profiles SET ${sets.join(", ")} WHERE id = ?`,
        vals,
        function (err) {
          if (err) {
            console.error("Erro ao atualizar perfil:", err.message);
            return res.status(500).json({ status: "erro", mensagem: "Erro interno." });
          }
          res.json({ status: "sucesso", mensagem: "Perfil atualizado com sucesso!" });
        }
      );
    } else {
      // Cria perfil caso não exista (compatibilidade com usuários legados)
      db.run(
        `INSERT INTO profiles (id, nickname, bio, avatar_url, schedule_availability, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          nickname ?? "",
          bio?.trim() ?? null,
          avatar_url?.trim() ?? null,
          schedule_availability ?? null,
          new Date().toISOString(),
          new Date().toISOString(),
        ],
        function (err) {
          if (err) {
            console.error("Erro ao criar perfil:", err.message);
            return res.status(500).json({ status: "erro", mensagem: "Erro interno." });
          }
          res.status(201).json({ status: "sucesso", mensagem: "Perfil criado com sucesso!" });
        }
      );
    }
  } catch (err) {
    console.error("Erro no PUT /profiles/:id:", err.message);
    res.status(500).json({ status: "erro", mensagem: "Erro interno." });
  }
});

export default router;
