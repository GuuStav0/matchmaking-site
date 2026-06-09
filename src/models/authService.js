// src/models/authService.js
// Serviço de autenticação — chamadas à API de auth e recuperação de senha.

import { API_BASE_URL } from "../constants/index.js";

export const authService = {
  // ─── Login ───────────────────────────────────────────────────────────────────
  login: async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();

      if (!response.ok || result.status === "erro") {
        return {
          sucesso:  false,
          mensagem: result.mensagem || "E-mail ou senha incorretos. Verifique as credenciais.",
        };
      }

      return { sucesso: true, mensagem: result.mensagem, user: result.user, token: result.token };
    } catch (error) {
      return { sucesso: false, mensagem: `Erro de conexão: ${error.message}` };
    }
  },

  // ─── Cadastro ────────────────────────────────────────────────────────────────
  register: async (email, password, nickname) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, nickname }),
      });
      const result = await response.json();

      if (!response.ok || result.status === "erro") {
        throw new Error(result.mensagem || "Erro ao processar o cadastro.");
      }

      return {
        sucesso:  true,
        mensagem: "Conta criada com sucesso! Você já pode fazer login.",
        userId:   result.userId,
      };
    } catch (error) {
      return { sucesso: false, mensagem: error.message };
    }
  },

  // ─── Recuperação de senha ─────────────────────────────────────────────────────
  recoverPassword: async (email) => {
    try {
      const userRes  = await fetch(`${API_BASE_URL}/listagem/users`);
      const userData = await userRes.json();
      const user     = userData.dados?.find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      );

      if (!user) {
        return {
          sucesso:  true,
          mensagem: "Se o e-mail informado existir no sistema, as instruções foram enviadas.",
        };
      }

      const generatedToken =
        Math.random().toString(36).substring(2, 10) +
        Math.random().toString(36).substring(2, 10) +
        Date.now().toString(36);

      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      const response = await fetch(`${API_BASE_URL}/password-resets`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ user_id: user.id, token: generatedToken, expires_at: expiresAt }),
      });
      const result = await response.json();

      if (!response.ok || result.status === "erro") {
        throw new Error(result.mensagem || "Erro ao registrar pedido de recuperação.");
      }

      return {
        sucesso:     true,
        mensagem:    "Instruções de redefinição de senha enviadas com sucesso!",
        _debugToken: result._debug_token,
      };
    } catch (error) {
      return { sucesso: false, mensagem: `Não foi possível processar: ${error.message}` };
    }
  },

  // ─── Verificação de token ─────────────────────────────────────────────────────
  verifyResetToken: async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/password-resets/verify`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ token }),
      });
      const result = await response.json();

      return {
        sucesso:  result.status === "sucesso",
        mensagem: result.mensagem,
        userId:   result.user_id,
      };
    } catch (error) {
      return { sucesso: false, mensagem: `Erro de conexão: ${error.message}` };
    }
  },

  // ─── Redefinição de senha ─────────────────────────────────────────────────────
  resetPassword: async (token, newPassword) => {
    try {
      const response = await fetch(`${API_BASE_URL}/password-resets/reset`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ token, newPassword }),
      });
      const result = await response.json();

      if (!response.ok || result.status === "erro") {
        return { sucesso: false, mensagem: result.mensagem || "Erro ao redefinir senha." };
      }

      return { sucesso: true, mensagem: result.mensagem };
    } catch (error) {
      return { sucesso: false, mensagem: `Erro de conexão: ${error.message}` };
    }
  },
};
