// src/models/authService.js
const API_BASE_URL = "http://localhost:3000/api";

export const authService = {
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
          mensagem: result.mensagem || "E-mail ou senha incorretos.",
        };
      }

      return {
        sucesso: true,
        mensagem: "Login realizado com sucesso!",
        usuario: {
          id:        result.dados.id,
          profileId: result.dados.profile_id,
          nickname:  result.dados.nickname,
          email:     result.dados.email,
          avatarUrl: result.dados.avatar_url,
        },
      };
    } catch {
      return {
        sucesso: false,
        mensagem: "Não foi possível conectar ao servidor backend.",
      };
    }
  },

  register: async (email, password, nickname) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, nickname }),
      });

      const result = await response.json();

      if (response.ok && result.status === "sucesso") {
        return { sucesso: true, mensagem: result.mensagem };
      } else {
        return { sucesso: false, mensagem: result.mensagem || "Erro ao registrar." };
      }
    } catch {
      return { sucesso: false, mensagem: "Erro de conexão com o servidor." };
    }
  },

  recoverPassword: async (email) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/recover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      return { sucesso: response.ok, mensagem: data.mensagem };
    } catch {
      return { sucesso: false, mensagem: "Erro de conexão com o servidor." };
    }
  },

  resetPassword: async (token, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json();
      return { sucesso: response.ok, mensagem: data.mensagem };
    } catch {
      return { sucesso: false, mensagem: "Erro de conexão com o servidor." };
    }
  },
};
