// src/models/authService.js
// Serviço de autenticação — chamadas à API de auth.

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
          sucesso: false,
          mensagem: result.mensagem || "E-mail ou senha incorretos. Verifique as credenciais.",
        };
      }

      // A API retorna os dados do usuário em result.dados (sem token)
      return { sucesso: true, mensagem: result.mensagem, user: result.dados };
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
        sucesso: true,
        mensagem: "Conta criada com sucesso! Você já pode fazer login.",
        userId: result.userId,
      };
    } catch (error) {
      return { sucesso: false, mensagem: error.message };
    }
  },

  // ─── Recuperação de senha (não disponível nesta versão da API) ───────────────
  recoverPassword: async () => {
    return {
      sucesso: false,
      mensagem: "Recuperação de senha não está disponível no momento.",
    };
  },

  verifyResetToken: async () => {
    return { sucesso: false, mensagem: "Funcionalidade não disponível." };
  },

  resetPassword: async () => {
    return { sucesso: false, mensagem: "Funcionalidade não disponível." };
  },
};
