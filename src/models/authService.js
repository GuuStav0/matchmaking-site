// src/models/authService.js
// Sprint 3 — Recuperação de senha por e-mail
//
// Alterações em relação à Sprint 2:
//   • recoverPassword agora chama POST /api/password-resets corretamente,
//     gerando o token no frontend e persistindo-o no backend.
//   • resetPassword (novo) recebe token + nova senha e chama
//     POST /api/password-resets/reset para efetivar a troca.
//   • verifyResetToken (novo) valida o token antes de exibir o formulário
//     de nova senha (usado na view reset-password).

const API_BASE_URL = "http://localhost:3000/api";

export const authService = {
  // ─────────────────────────────────────────────────────────────────────────
  // 1. Login
  // ─────────────────────────────────────────────────────────────────────────
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
          mensagem:
            result.mensagem ||
            "E-mail ou senha incorretos. Verifique as credenciais.",
        };
      }

      return {
        sucesso:  true,
        mensagem: result.mensagem,
        user:     result.user,
        token:    result.token,
      };
    } catch (error) {
      console.error("Erro no serviço de Login:", error.message);
      return { sucesso: false, mensagem: `Erro de conexão: ${error.message}` };
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Cadastro
  // ─────────────────────────────────────────────────────────────────────────
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
      console.error("Erro no serviço de Cadastro:", error.message);
      return { sucesso: false, mensagem: error.message };
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 3. Recuperação de senha — Sprint 3
  //    Fluxo:
  //      1. Busca o user_id pelo e-mail informado
  //      2. Gera token aleatório + data de expiração (15 min)
  //      3. Envia ao backend → POST /api/password-resets
  //      4. Backend persiste o token e simula o envio do e-mail
  // ─────────────────────────────────────────────────────────────────────────
  recoverPassword: async (email) => {
    try {
      // Passo 1: localiza o usuário pelo e-mail
      const userRes  = await fetch(`${API_BASE_URL}/listagem/users`);
      const userData = await userRes.json();
      const user     = userData.dados?.find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      );

      // Resposta genérica para não revelar se o e-mail existe
      if (!user) {
        return {
          sucesso:  true,
          mensagem:
            "Se o e-mail informado existir no sistema, as instruções foram enviadas.",
        };
      }

      // Passo 2: gera token e expiração
      const generatedToken =
        Math.random().toString(36).substring(2, 10) +
        Math.random().toString(36).substring(2, 10) +
        Date.now().toString(36);

      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      // Passo 3: persiste no backend
      const response = await fetch(`${API_BASE_URL}/password-resets`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          user_id:    user.id,
          token:      generatedToken,
          expires_at: expiresAt,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.status === "erro") {
        throw new Error(
          result.mensagem || "Erro ao registrar pedido de recuperação."
        );
      }

      // Em ambiente de dev o backend devolve _debug_token para facilitar testes
      return {
        sucesso:      true,
        mensagem:     "Instruções de redefinição de senha enviadas com sucesso!",
        _debugToken:  result._debug_token, // apenas dev — não exibir em produção
      };
    } catch (error) {
      console.error("Erro no serviço de Recuperação:", error.message);
      return {
        sucesso:  false,
        mensagem: `Não foi possível processar: ${error.message}`,
      };
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 4. Verificação de token — Sprint 3
  //    Chamado na view /reset-password antes de exibir o form de nova senha.
  // ─────────────────────────────────────────────────────────────────────────
  verifyResetToken: async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/password-resets/verify`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ token }),
      });
      const result = await response.json();

      return {
        sucesso: result.status === "sucesso",
        mensagem: result.mensagem,
        userId:   result.user_id,
      };
    } catch (error) {
      console.error("Erro ao verificar token:", error.message);
      return { sucesso: false, mensagem: `Erro de conexão: ${error.message}` };
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 5. Redefinição de senha com token — Sprint 3
  //    Chamado após o usuário preencher a nova senha no formulário.
  // ─────────────────────────────────────────────────────────────────────────
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

      return {
        sucesso:  true,
        mensagem: result.mensagem,
      };
    } catch (error) {
      console.error("Erro ao redefinir senha:", error.message);
      return { sucesso: false, mensagem: `Erro de conexão: ${error.message}` };
    }
  },
};
