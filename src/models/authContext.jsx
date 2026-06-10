import { createContext, useState, useEffect, useContext } from "react";

if (!window.__AuthContextShared) {
  window.__AuthContextShared = createContext({});
}
const AuthContext = window.__AuthContextShared;
const API_PATH = "https://localhost:3000/api"

// Função auxiliar para ler um cookie específico pelo nome
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    try {
      return decodeURIComponent(parts.pop().split(";").shift());
    } catch (e) {
      return null;
    }
  }
  return null;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verificarSessaoValida = async () => {
      const storagedUser = getCookie("@Matchup:user");

      if (storagedUser && storagedUser !== "undefined") {
        try {
          const parsedUser = JSON.parse(storagedUser);

          // Valida na API se o utilizador ainda existe na DB
          // Isso impede que utilizadores excluídos (ou após reset da DB) continuem logados
          const response = await fetch(
            `${API_PATH}/players/${parsedUser.id}`,
          ).catch(() => null);

          if (response && response.ok) {
            const data = await response.json();
            if (data.status === "sucesso" && data.dados) {
              setUser(parsedUser); // Utilizador existe, mantém logado
            } else {
              // Se a API respondeu mas o utilizador não existe mais, mata o cookie
              limparCookiesEfetivo();
            }
          } else if (response && response.status === 404) {
            // Se der 404 (Não encontrado), limpa a sessão fantasma imediatamente
            limparCookiesEfetivo();
          } else {
            // Se o servidor estiver offline, mantém o estado local por precaução
            setUser(parsedUser);
          }
        } catch (error) {
          console.error("Erro ao processar sessão guardada:", error);
          limparCookiesEfetivo();
        }
      }
      setLoading(false);
    };

    verificarSessaoValida();
  }, []);

  // Função interna isolada para garantir a eliminação real dos cookies
  const limparCookiesEfetivo = () => {
    setUser(null);

    // Define a data de expiração para o passado em todos os caminhos possíveis
    document.cookie =
      "@Matchup:user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax";
    document.cookie =
      "@Matchup:token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax";
    document.cookie =
      "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax";

    // Limpa também qualquer resquício do LocalStorage para evitar conflitos antigos
    localStorage.removeItem("@Matchup:user");
    localStorage.removeItem("@Matchup:token");
  };

  const loginSessao = (dadosUsuario) => {
    if (
      !dadosUsuario ||
      Object.keys(dadosUsuario).length === 0 ||
      !dadosUsuario.nickname
    ) {
      console.error(
        "Tentativa de login com dados vazios ou inválidos abortada.",
      );
      return;
    }

    setUser(dadosUsuario);

    // Grava o cookie definindo o caminho '/' para que fique acessível globalmente
    const d = new Date();
    d.setTime(d.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 dias
    document.cookie = `@Matchup:user=${encodeURIComponent(JSON.stringify(dadosUsuario))}; expires=${d.toUTCString()}; path=/; SameSite=Lax`;
  };

  // Executado quando o utilizador clica em Sair no Header
  const logoutSessao = () => {
    limparCookiesEfetivo();
  };

  return (
    <AuthContext.Provider
      value={{
        logado: !!user,
        user,
        loginSessao,
        logoutSessao,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
