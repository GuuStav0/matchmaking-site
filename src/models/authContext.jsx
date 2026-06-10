import { createContext, useState, useEffect, useContext } from "react";

if (!window.__AuthContextShared) {
  window.__AuthContextShared = createContext({});
}
const AuthContext = window.__AuthContextShared;

// 🌟 Função auxiliar para ler um cookie específico pelo nome
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
    // 🌟 CORRIGIDO: Agora busca dos Cookies em vez do LocalStorage
    const storagedUser = getCookie("@Matchup:user");
    
    if (storagedUser && storagedUser !== "undefined") {
      try {
        setUser(JSON.parse(storagedUser));
      } catch (error) {
        console.error("Erro ao fazer parse do usuário guardado nos cookies:", error);
      }
    }
    setLoading(false);
  }, []);

  const loginSessao = (dadosUsuario) => {
    if (!dadosUsuario || Object.keys(dadosUsuario).length === 0 || !dadosUsuario.nickname) {
      console.error("Tentativa de login com dados vazios ou inválidos abortada.");
      return;
    }

    setUser(dadosUsuario);
    
    // 🌟 CORRIGIDO: Salva nos Cookies (expira em 7 dias como exemplo)
    const d = new Date();
    d.setTime(d.getTime() + (7 * 24 * 60 * 60 * 1000));
    document.cookie = `@Matchup:user=${encodeURIComponent(JSON.stringify(dadosUsuario))}; expires=${d.toUTCString()}; path=/; SameSite=Lax`;
  };

  const logoutSessao = () => {
    setUser(null);
    // 🌟 CORRIGIDO: Deleta o Cookie limpando a data de expiração
    document.cookie = "@Matchup:user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
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