// src/routes/profiles.routes.js
// RF01 · Edição de perfil
//
//  PUT   /api/profiles/:id  → atualiza bio, avatar_url, schedule_availability
//  GET   /api/profiles/:id  → retorna perfil público de um usuário

import { Router }      from "express";
import { db }          from "../database.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { sendSuccess, sendError } from "../helpers/response.js";

const router = Router();

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
    if (!profile) return sendError(res, "Perfil não encontrado.", 404);
    sendSuccess(res, { dados: profile });
  } catch {
    sendError(res, "Erro interno.");
  }
});

// ── PUT /api/profiles/:id ─────────────────────────────────────────────────────
router.put("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  if (req.userId !== id) {
    return sendError(res, "Acesso negado. Você só pode editar seu próprio perfil.", 403);
  }

  const { nickname, bio, avatar_url, schedule_availability } = req.body ?? {};

  if (!nickname && !bio && avatar_url === undefined && !schedule_availability) {
    return sendError(res, "Informe ao menos um campo para atualizar.", 400);
  }

  if (bio !== undefined) {
    if (bio.trim().length < 10) {
      return sendError(res, "Bio deve ter ao menos 10 caracteres.", 400);
    }
    if (bio.length > 300) {
      return sendError(res, "Bio pode ter no máximo 300 caracteres.", 400);
    }
  }

  try {
    const existing = await findProfile(id);

    const sets = [];
    const vals = [];

    if (nickname)                { sets.push("nickname = ?");              vals.push(nickname.trim()); }
    if (bio !== undefined)       { sets.push("bio = ?");                   vals.push(bio.trim()); }
    if (avatar_url !== undefined){ sets.push("avatar_url = ?");            vals.push(avatar_url?.trim() || null); }
    if (schedule_availability)   { sets.push("schedule_availability = ?"); vals.push(schedule_availability); }

    sets.push("updated_at = ?");
    vals.push(new Date().toISOString());
    vals.push(id);

    if (existing) {
      db.run(
        `UPDATE profiles SET ${sets.join(", ")} WHERE id = ?`,
        vals,
        function (err) {
          if (err) return sendError(res, "Erro interno.");
          sendSuccess(res, { mensagem: "Perfil atualizado com sucesso!" });
        }
      );
    } else {
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
          if (err) return sendError(res, "Erro interno.");
          sendSuccess(res, { mensagem: "Perfil criado com sucesso!" }, 201);
        }
      );
    }
  } catch {
    sendError(res, "Erro interno.");
  }
});

export default router;
