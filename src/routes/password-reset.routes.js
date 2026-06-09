// src/routes/password-reset.routes.js
// Sprint 3 — Recuperação de senha
//
//  POST /api/password-resets          → cria token de reset
//  POST /api/password-resets/verify   → valida token
//  POST /api/password-resets/reset    → aplica nova senha e invalida token

import { Router } from "express";
import bcrypt     from "bcryptjs";
import { db }     from "../database.js";
import { sendSuccess, sendError } from "../helpers/response.js";

const router = Router();

// Garante que a tabela existe (idempotente — também está em statements.sql)
db.run(`
  CREATE TABLE IF NOT EXISTS password_resets (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    TEXT    NOT NULL,
    token      TEXT    NOT NULL UNIQUE,
    expires_at TEXT    NOT NULL,
    used       INTEGER NOT NULL DEFAULT 0,
    created_at TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

// ── POST /api/password-resets ──────────────────────────────────────────────────
router.post("/", (req, res) => {
  const { user_id, token, expires_at } = req.body ?? {};

  if (!user_id || !token || !expires_at) {
    return sendError(res, "Campos obrigatórios: user_id, token, expires_at.", 400);
  }

  db.run(
    "UPDATE password_resets SET used = 1 WHERE user_id = ? AND used = 0",
    [user_id],
    () => {
      db.run(
        "INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)",
        [user_id, token, expires_at],
        function (err) {
          if (err) {
            return sendError(res, "Erro interno ao registrar pedido de recuperação.");
          }

          // Simulação de envio de e-mail (substituir por Nodemailer/SendGrid em produção)
          const resetLink = `http://localhost:5173/reset-password?token=${token}`;
          console.log("\n📧  [SIMULAÇÃO DE E-MAIL]");
          console.log(`   Para:  usuário ${user_id}`);
          console.log(`   Link:  ${resetLink}`);
          console.log(`   Expira: ${expires_at}\n`);

          sendSuccess(res, {
            mensagem: "Token de recuperação registrado. Link enviado por e-mail.",
            _debug_token: token,
          }, 201);
        }
      );
    }
  );
});

// ── POST /api/password-resets/verify ──────────────────────────────────────────
router.post("/verify", (req, res) => {
  const { token } = req.body ?? {};

  if (!token) return sendError(res, "Token obrigatório.", 400);

  db.get(
    "SELECT * FROM password_resets WHERE token = ? AND used = 0",
    [token],
    (err, row) => {
      if (err) return sendError(res, "Erro interno.");
      if (!row) return sendError(res, "Token inválido ou já utilizado.", 404);

      if (new Date(row.expires_at) < new Date()) {
        return sendError(res, "Token expirado. Solicite um novo link de recuperação.", 410);
      }

      sendSuccess(res, { mensagem: "Token válido.", user_id: row.user_id });
    }
  );
});

// ── POST /api/password-resets/reset ───────────────────────────────────────────
router.post("/reset", async (req, res) => {
  const { token, newPassword } = req.body ?? {};

  if (!token || !newPassword) {
    return sendError(res, "Campos obrigatórios: token e newPassword.", 400);
  }

  if (newPassword.length < 6) {
    return sendError(res, "A nova senha deve ter no mínimo 6 caracteres.", 400);
  }

  db.get(
    "SELECT * FROM password_resets WHERE token = ? AND used = 0",
    [token],
    async (err, row) => {
      if (err) return sendError(res, "Erro interno.");
      if (!row) return sendError(res, "Token inválido ou já utilizado.", 404);

      if (new Date(row.expires_at) < new Date()) {
        return sendError(res, "Token expirado. Solicite um novo link de recuperação.", 410);
      }

      try {
        const hash = await bcrypt.hash(newPassword, 10);

        db.run(
          "UPDATE users SET password = ?, updated_at = ? WHERE id = ?",
          [hash, new Date().toISOString(), row.user_id],
          function (errUpd) {
            if (errUpd) return sendError(res, "Erro interno.");

            db.run("UPDATE password_resets SET used = 1 WHERE id = ?", [row.id]);

            sendSuccess(res, { mensagem: "Senha redefinida com sucesso! Faça login com a nova senha." });
          }
        );
      } catch {
        sendError(res, "Erro interno.");
      }
    }
  );
});

export default router;
