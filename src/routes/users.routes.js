// src/routes/users.routes.js
// RF03 · Rotas de Usuário
//
//  POST   /api/users       → criar conta  (usado por authService.register)
//  GET    /api/users/:id   → buscar usuário  [auth]
//  PUT    /api/users/:id   → atualizar dados [auth, owner]
//  DELETE /api/users/:id   → excluir conta   [auth, owner]

import { Router }  from "express";
import bcrypt      from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { db }      from "../database.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { sendSuccess, sendError } from "../helpers/response.js";

const router      = Router();
const SALT_ROUNDS = 10;

function findById(id) {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT id, email, nickname, created_at, updated_at FROM users WHERE id = ?",
      [id],
      (err, row) => (err ? reject(err) : resolve(row ?? null))
    );
  });
}

// ── POST /api/users ────────────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  const { email, password, nickname } = req.body ?? {};

  if (!email || !password || !nickname) {
    return sendError(res, "Campos obrigatórios: email, password e nickname.", 400);
  }
  if (password.length < 6) {
    return sendError(res, "A senha deve ter no mínimo 6 caracteres.", 400);
  }

  try {
    const hash   = await bcrypt.hash(password, SALT_ROUNDS);
    const userId = uuidv4();
    const now    = new Date().toISOString();

    db.run(
      "INSERT INTO users (id, email, password, nickname, created_at, updated_at) VALUES (?,?,?,?,?,?)",
      [userId, email.toLowerCase().trim(), hash, nickname.trim(), now, now],
      function (err) {
        if (err) {
          if (err.message.includes("UNIQUE")) {
            const campo = err.message.includes("email") ? "E-mail" : "Nickname";
            return sendError(res, `${campo} já está em uso. Tente outro.`, 409);
          }
          return sendError(res, "Erro interno.");
        }
        sendSuccess(res, { mensagem: "Usuário criado com sucesso!", userId }, 201);
      }
    );
  } catch {
    sendError(res, "Erro interno no servidor.");
  }
});

// ── GET /api/users/:id ─────────────────────────────────────────────────────────
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const user = await findById(req.params.id);
    if (!user) return sendError(res, "Usuário não encontrado.", 404);
    sendSuccess(res, { dados: user });
  } catch {
    sendError(res, "Erro interno.");
  }
});

// ── PUT /api/users/:id ─────────────────────────────────────────────────────────
router.put("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  if (req.userId !== id) {
    return sendError(res, "Acesso negado. Você só pode editar seu próprio perfil.", 403);
  }

  const { email, nickname, password } = req.body ?? {};
  if (!email && !nickname && !password) {
    return sendError(res, "Informe ao menos um campo: email, nickname ou password.", 400);
  }

  try {
    const user = await findById(id);
    if (!user) return sendError(res, "Usuário não encontrado.", 404);

    const sets = [];
    const vals = [];

    if (email)    { sets.push("email = ?");    vals.push(email.toLowerCase().trim()); }
    if (nickname) { sets.push("nickname = ?"); vals.push(nickname.trim()); }
    if (password) {
      if (password.length < 6) {
        return sendError(res, "A nova senha deve ter no mínimo 6 caracteres.", 400);
      }
      sets.push("password = ?");
      vals.push(await bcrypt.hash(password, SALT_ROUNDS));
    }

    sets.push("updated_at = ?");
    vals.push(new Date().toISOString());
    vals.push(id);

    db.run(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`, vals, function (err) {
      if (err) {
        if (err.message.includes("UNIQUE")) {
          const campo = err.message.includes("email") ? "E-mail" : "Nickname";
          return sendError(res, `${campo} já está em uso.`, 409);
        }
        return sendError(res, "Erro interno.");
      }
      sendSuccess(res, { mensagem: "Dados atualizados com sucesso!" });
    });
  } catch {
    sendError(res, "Erro interno.");
  }
});

// ── DELETE /api/users/:id ──────────────────────────────────────────────────────
router.delete("/:id", requireAuth, (req, res) => {
  const { id } = req.params;

  if (req.userId !== id) {
    return sendError(res, "Acesso negado. Você só pode excluir sua própria conta.", 403);
  }

  db.run("DELETE FROM users WHERE id = ?", [id], function (err) {
    if (err) return sendError(res, "Erro interno.");
    if (this.changes === 0) return sendError(res, "Usuário não encontrado.", 404);
    sendSuccess(res, { mensagem: "Conta excluída com sucesso." });
  });
});

export default router;
