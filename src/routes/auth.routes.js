// src/routes/auth.routes.js
// Sprint 1 – RF04 · Rotas de Autenticação
//
//  POST /api/auth/login     → autenticar usuário
//  POST /api/auth/register  → criar conta (alias de /api/users)
//  POST /api/auth/logout    → encerrar sessão  [auth]
//
//  Alias mantido para compatibilidade com authService.js do frontend:
//  POST /api/login          → mesmo handler de /api/auth/login

import { Router }  from "express";
import bcrypt      from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { db }      from "../database.js";
import { criarSessao, removerSessao, requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

// ── Handler de Login (reutilizado no alias /api/login) ─────────────────────────
export async function handlerLogin(req, res) {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({ status: "erro", mensagem: "Informe email e senha." });
  }

  db.get(
    "SELECT * FROM users WHERE email = ?",
    [email.toLowerCase().trim()],
    async (err, user) => {
      if (err) {
        console.error("Erro no login:", err.message);
        return res.status(500).json({ status: "erro", mensagem: "Erro interno no servidor." });
      }

      // Mesma mensagem para e-mail e senha inválidos (não revelar qual campo errou)
      if (!user) {
        return res.status(401).json({
          status: "erro",
          mensagem: "E-mail ou senha incorretos. Verifique as credenciais.",
        });
      }

      const senhaCorreta = await bcrypt.compare(password, user.password);
      if (!senhaCorreta) {
        return res.status(401).json({
          status: "erro",
          mensagem: "E-mail ou senha incorretos. Verifique as credenciais.",
        });
      }

      const token = criarSessao(user.id);

      res.json({
        status: "sucesso",
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
            return res.status(409).json({
              status: "erro",
              mensagem: `${campo} já está em uso. Tente outro.`,
            });
          }
          console.error("Erro ao registrar:", err.message);
          return res.status(500).json({ status: "erro", mensagem: "Erro interno." });
        }
        res.status(201).json({
          status: "sucesso",
          mensagem: "Conta criada com sucesso! Você já pode fazer login.",
          userId,
        });
      }
    );
  } catch (err) {
    console.error("Erro no register:", err.message);
    res.status(500).json({ status: "erro", mensagem: "Erro interno no servidor." });
  }
}

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
function handlerLogout(req, res) {
  removerSessao(req.token);
  res.json({ status: "sucesso", mensagem: "Logout realizado com sucesso." });
}

// ── Registro das rotas ────────────────────────────────────────────────────────
router.post("/login",    handlerLogin);
router.post("/register", handlerRegister);
router.post("/logout",   requireAuth, handlerLogout);

export default router;
