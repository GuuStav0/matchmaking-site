const API_BASE_URL = "http://localhost:3000/api";

export const authService = {
  /**
   * 1. Formulário de Login (Verificação/Autenticação)
   */
  login: async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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

      // Se o backend aceitou, retorna o sucesso para a tela auth.jsx
      return {
        sucesso: true,
        mensagem: result.mensagem,
        user: result.user,
      };
    } catch (error) {
      console.error("Erro no serviço de Login:", error.message);
      return { sucesso: false, message: `Erro de conexão: ${error.message}` };
    }
  },

  /**
   * 2. Formulário de Cadastro (Criação de Usuário + Perfil)
   */
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

      if (!response.ok || result.status === "erro") {
        throw new Error(result.mensagem || "Erro ao processar o cadastro.");
      }

      return {
        sucesso: true,
        mensagem: "Conta criada com sucesso! Você já pode fazer login.",
        userId: result.userId,
      };
    } catch (error) {
      console.error("Erro no serviço de Cadastro:", error.message);
      return { sucesso: false, mensagem: error.message };
    }
  },

  /**
   * 3. Formulário de Recuperação de Senha (Password Reset)
   */
  recoverPassword: async (email) => {
    try {
      const userRes = await fetch(`${API_BASE_URL}/listagem/users`);
      const userData = await userRes.json();
      const user = userData.dados.find((u) => u.email === email);

      if (!user) {
        return {
          sucesso: true,
          mensagem:
            "Se o e-mail informado existir no sistema, as instruções foram enviadas.",
        };
      }

      const generatedToken =
        Math.random().toString(36).substring(2) +
        Math.random().toString(36).substring(2);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      const response = await fetch(`${API_BASE_URL}/password-resets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
          token: generatedToken,
          expires_at: expiresAt,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.status === "erro") {
        throw new Error(
          result.mensagem || "Erro ao registrar pedido de recuperação.",
        );
      }

      return {
        sucesso: true,
        mensagem: "Instruções de redefinição de senha enviadas com sucesso!",
      };
    } catch (error) {
      console.error("Erro no serviço de Recuperação:", error.message);
      return {
        sucesso: false,
        mensagem: `Não foi possível processar: ${error.message}`,
      };
    }
  },
};
