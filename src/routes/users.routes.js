// src/routes/users.routes.js
// Sprint 1 – RF03 · Rotas de Usuário
//
//  POST   /api/users       → criar conta  (usado por authService.register)
//  GET    /api/users/:id   → buscar usuário  [auth]
//  PUT    /api/users/:id   → atualizar dados [auth, owner]
//  DELETE /api/users/:id   → excluir conta   [auth, owner]
//
//  GET /api/listagem/users  → lista pública sem senha
//                             (usado por authService.recoverPassword)

import { Router }  from "express";
import bcrypt      from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { db }      from "../database.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router      = Router();
const SALT_ROUNDS = 10;

// ── Helper: busca usuário por ID sem expor a senha ────────────────────────────
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
    return res.status(400).json({
      status: "erro",
      mensagem: "Campos obrigatórios: email, password e nickname.",
    });
  }
  if (password.length < 6) {
    return res.status(400).json({
      status: "erro",
      mensagem: "A senha deve ter no mínimo 6 caracteres.",
    });
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
            return res.status(409).json({
              status: "erro",
              mensagem: `${campo} já está em uso. Tente outro.`,
            });
          }
          console.error("Erro ao criar usuário:", err.message);
          return res.status(500).json({ status: "erro", mensagem: "Erro interno." });
        }
        res.status(201).json({
          status: "sucesso",
          mensagem: "Usuário criado com sucesso!",
          userId,
        });
      }
    );
  } catch (err) {
    console.error("Erro no POST /users:", err.message);
    res.status(500).json({ status: "erro", mensagem: "Erro interno no servidor." });
  }
});

// ── GET /api/users/:id ─────────────────────────────────────────────────────────
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const user = await findById(req.params.id);
    if (!user) return res.status(404).json({ status: "erro", mensagem: "Usuário não encontrado." });
    res.json({ status: "sucesso", dados: user });
  } catch (err) {
    console.error("Erro no GET /users/:id:", err.message);
    res.status(500).json({ status: "erro", mensagem: "Erro interno." });
  }
});

// ── PUT /api/users/:id ─────────────────────────────────────────────────────────
router.put("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  if (req.userId !== id) {
    return res.status(403).json({
      status: "erro",
      mensagem: "Acesso negado. Você só pode editar seu próprio perfil.",
    });
  }

  const { email, nickname, password } = req.body ?? {};
  if (!email && !nickname && !password) {
    return res.status(400).json({
      status: "erro",
      mensagem: "Informe ao menos um campo: email, nickname ou password.",
    });
  }

  try {
    const user = await findById(id);
    if (!user) return res.status(404).json({ status: "erro", mensagem: "Usuário não encontrado." });

    const sets  = [];
    const vals  = [];

    if (email)    { sets.push("email = ?");    vals.push(email.toLowerCase().trim()); }
    if (nickname) { sets.push("nickname = ?"); vals.push(nickname.trim()); }
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ status: "erro", mensagem: "A nova senha deve ter no mínimo 6 caracteres." });
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
          return res.status(409).json({ status: "erro", mensagem: `${campo} já está em uso.` });
        }
        console.error("Erro ao atualizar usuário:", err.message);
        return res.status(500).json({ status: "erro", mensagem: "Erro interno." });
      }
      res.json({ status: "sucesso", mensagem: "Dados atualizados com sucesso!" });
    });
  } catch (err) {
    console.error("Erro no PUT /users/:id:", err.message);
    res.status(500).json({ status: "erro", mensagem: "Erro interno." });
  }
});

// ── DELETE /api/users/:id ──────────────────────────────────────────────────────
router.delete("/:id", requireAuth, (req, res) => {
  const { id } = req.params;

  if (req.userId !== id) {
    return res.status(403).json({
      status: "erro",
      mensagem: "Acesso negado. Você só pode excluir sua própria conta.",
    });
  }

  db.run("DELETE FROM users WHERE id = ?", [id], function (err) {
    if (err) {
      console.error("Erro ao excluir usuário:", err.message);
      return res.status(500).json({ status: "erro", mensagem: "Erro interno." });
    }
    if (this.changes === 0) return res.status(404).json({ status: "erro", mensagem: "Usuário não encontrado." });
    res.json({ status: "sucesso", mensagem: "Conta excluída com sucesso." });
  });
});

// ── GET /api/listagem/users ────────────────────────────────────────────────────
// Usado pelo authService.recoverPassword() do frontend
router.get("/listagem/users", (req, res) => {
  db.all("SELECT id, email, nickname FROM users", [], (err, rows) => {
    if (err) return res.status(500).json({ status: "erro", mensagem: "Erro ao buscar usuários." });
    res.json({ status: "sucesso", dados: rows });
  });
});

export default router;
