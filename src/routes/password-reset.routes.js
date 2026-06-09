// src/routes/password-reset.routes.js
// Sprint 3 — Recuperação de senha por e-mail
//
//  POST /api/password-resets
//    Recebe { user_id, token, expires_at } gerado pelo authService.recoverPassword
//    Persiste o token na tabela password_resets e simula o envio por e-mail.
//    Em produção, substituir o console.log pelo envio real via Nodemailer/SendGrid.
//
//  POST /api/password-resets/verify
//    Valida o token { token } enviado pelo usuário (ex.: via link de e-mail).
//    Retorna o user_id se válido e não expirado.
//
//  POST /api/password-resets/reset
//    Recebe { token, newPassword } — aplica a nova senha (hash bcrypt) e
//    invalida o token usado.

import { Router }       from "express";
import bcrypt           from "bcryptjs";
import { db }           from "../database.js";

const router = Router();

// ── Garante que a tabela password_resets existe ────────────────────────────────
// (também está no statements.sql — esta execução é idempotente)
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
// Cria um registro de reset e simula o envio do e-mail.
router.post("/", (req, res) => {
  const { user_id, token, expires_at } = req.body ?? {};

  if (!user_id || !token || !expires_at) {
    return res.status(400).json({
      status:   "erro",
      mensagem: "Campos obrigatórios: user_id, token, expires_at.",
    });
  }

  // Invalida tokens anteriores do mesmo usuário
  db.run(
    "UPDATE password_resets SET used = 1 WHERE user_id = ? AND used = 0",
    [user_id],
    (errInv) => {
      if (errInv) {
        console.error("Erro ao invalidar tokens antigos:", errInv.message);
      }

      // Insere o novo token
      db.run(
        `INSERT INTO password_resets (user_id, token, expires_at)
         VALUES (?, ?, ?)`,
        [user_id, token, expires_at],
        function (err) {
          if (err) {
            console.error("Erro ao criar password reset:", err.message);
            return res.status(500).json({
              status:   "erro",
              mensagem: "Erro interno ao registrar pedido de recuperação.",
            });
          }

          // ── Simulação de envio de e-mail ─────────────────────────────────
          // Em produção substitua por Nodemailer / SendGrid / Resend:
          //
          //   await transporter.sendMail({
          //     to: userEmail,
          //     subject: "Redefinição de senha — Matchup",
          //     html: `<a href="${FRONTEND_URL}/reset-password?token=${token}">
          //              Redefinir senha
          //            </a>`,
          //   });

          const resetLink = `http://localhost:5173/reset-password?token=${token}`;
          console.log("\n📧  [SIMULAÇÃO DE E-MAIL]");
          console.log(`   Para:  usuário ${user_id}`);
          console.log(`   Link:  ${resetLink}`);
          console.log(`   Expira: ${expires_at}\n`);

          res.status(201).json({
            status:   "sucesso",
            mensagem: "Token de recuperação registrado. Link enviado por e-mail.",
            // Em produção NÃO retorne o token — apenas o status.
            // Incluído aqui para facilitar testes sem e-mail real.
            _debug_token: token,
          });
        }
      );
    }
  );
});

// ── POST /api/password-resets/verify ──────────────────────────────────────────
// Valida o token sem aplicar a troca de senha.
router.post("/verify", (req, res) => {
  const { token } = req.body ?? {};

  if (!token) {
    return res.status(400).json({ status: "erro", mensagem: "Token obrigatório." });
  }

  db.get(
    "SELECT * FROM password_resets WHERE token = ? AND used = 0",
    [token],
    (err, row) => {
      if (err) {
        return res.status(500).json({ status: "erro", mensagem: "Erro interno." });
      }
      if (!row) {
        return res.status(404).json({
          status:   "erro",
          mensagem: "Token inválido ou já utilizado.",
        });
      }

      const agora = new Date();
      if (new Date(row.expires_at) < agora) {
        return res.status(410).json({
          status:   "erro",
          mensagem: "Token expirado. Solicite um novo link de recuperação.",
        });
      }

      res.json({
        status:   "sucesso",
        mensagem: "Token válido.",
        user_id:  row.user_id,
      });
    }
  );
});

// ── POST /api/password-resets/reset ───────────────────────────────────────────
// Aplica a nova senha e invalida o token.
router.post("/reset", async (req, res) => {
  const { token, newPassword } = req.body ?? {};

  if (!token || !newPassword) {
    return res.status(400).json({
      status:   "erro",
      mensagem: "Campos obrigatórios: token e newPassword.",
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      status:   "erro",
      mensagem: "A nova senha deve ter no mínimo 6 caracteres.",
    });
  }

  db.get(
    "SELECT * FROM password_resets WHERE token = ? AND used = 0",
    [token],
    async (err, row) => {
      if (err) {
        return res.status(500).json({ status: "erro", mensagem: "Erro interno." });
      }
      if (!row) {
        return res.status(404).json({
          status:   "erro",
          mensagem: "Token inválido ou já utilizado.",
        });
      }

      if (new Date(row.expires_at) < new Date()) {
        return res.status(410).json({
          status:   "erro",
          mensagem: "Token expirado. Solicite um novo link de recuperação.",
        });
      }

      try {
        const hash = await bcrypt.hash(newPassword, 10);

        // Atualiza senha do usuário
        db.run(
          "UPDATE users SET password = ?, updated_at = ? WHERE id = ?",
          [hash, new Date().toISOString(), row.user_id],
          function (errUpd) {
            if (errUpd) {
              console.error("Erro ao atualizar senha:", errUpd.message);
              return res.status(500).json({ status: "erro", mensagem: "Erro interno." });
            }

            // Invalida o token
            db.run(
              "UPDATE password_resets SET used = 1 WHERE id = ?",
              [row.id]
            );

            res.json({
              status:   "sucesso",
              mensagem: "Senha redefinida com sucesso! Faça login com a nova senha.",
            });
          }
        );
      } catch (hashErr) {
        console.error("Erro ao gerar hash:", hashErr.message);
        res.status(500).json({ status: "erro", mensagem: "Erro interno." });
      }
    }
  );
});

export default router;
