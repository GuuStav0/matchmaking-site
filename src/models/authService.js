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
          mensagem: result.mensagem || "E-mail ou senha incorretos." 
        };
      }

      // Se o status for "sucesso", o backend injeta os dados direto no objeto ou na chave 'dados'
      return {
        sucesso: true,
        mensagem: "Login realizado com sucesso!",
        usuario: {
          id: result.dados.id,
          profileId: result.dados.profile_id,
          nickname: result.dados.nickname,
          email: result.dados.email,
          avatarUrl: result.dados.avatar_url
        }
      };
    } catch (error) {
      console.error("Erro no serviço de login:", error);
      return { sucesso: false, message: "Não foi possível conectar ao servidor backend." };
    }
  }
};