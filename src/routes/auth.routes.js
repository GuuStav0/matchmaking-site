// src/routes/auth.routes.js
// RF04 · Rotas de Autenticação
//
//  POST /api/auth/login     → autenticar usuário
//  POST /api/auth/register  → criar conta
//  POST /api/auth/logout    → encerrar sessão  [auth]
//  POST /api/login          → alias de compatibilidade

import { Router }  from "express";
import bcrypt      from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { db }      from "../database.js";
import { criarSessao, removerSessao, requireAuth } from "../middleware/authMiddleware.js";
import { sendSuccess, sendError } from "../helpers/response.js";

const router = Router();

// ── Handler de Login (reutilizado no alias /api/login) ─────────────────────────
export async function handlerLogin(req, res) {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return sendError(res, "Informe email e senha.", 400);
  }

  db.get(
    "SELECT * FROM users WHERE email = ?",
    [email.toLowerCase().trim()],
    async (err, user) => {
      if (err) return sendError(res, "Erro interno no servidor.");

      if (!user) {
        return sendError(res, "E-mail ou senha incorretos. Verifique as credenciais.", 401);
      }

      const senhaCorreta = await bcrypt.compare(password, user.password);
      if (!senhaCorreta) {
        return sendError(res, "E-mail ou senha incorretos. Verifique as credenciais.", 401);
      }

      const token = criarSessao(user.id);

      sendSuccess(res, {
        mensagem: "Login realizado com sucesso!",
        token,
        user: {
          id:       user.id,
          email:    user.email,
          nickname: user.nickname,
        },
      });
    }
  );
}

// ── POST /api/auth/register ────────────────────────────────────────────────────
async function handlerRegister(req, res) {
  const { email, password, nickname } = req.body ?? {};

  if (!email || !password || !nickname) {
    return sendError(res, "Campos obrigatórios: email, password e nickname.", 400);
  }
  if (password.length < 6) {
    return sendError(res, "A senha deve ter no mínimo 6 caracteres.", 400);
  }

  try {
    const hash   = await bcrypt.hash(password, 10);
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
        sendSuccess(res, {
          mensagem: "Conta criada com sucesso! Você já pode fazer login.",
          userId,
        }, 201);
      }
    );
  } catch {
    sendError(res, "Erro interno no servidor.");
  }
}

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
function handlerLogout(req, res) {
  removerSessao(req.token);
  sendSuccess(res, { mensagem: "Logout realizado com sucesso." });
}

// ── Registro das rotas ────────────────────────────────────────────────────────
router.post("/login",    handlerLogin);
router.post("/register", handlerRegister);
router.post("/logout",   requireAuth, handlerLogout);

export default router;
