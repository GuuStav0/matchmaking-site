import { createContext, useState, useEffect, useContext } from "react";

if (!window.__AuthContextShared) {
  window.__AuthContextShared = createContext({});
}
const AuthContext = window.__AuthContextShared;

const API_PATH = "http://localhost:3000/api";

const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    try {
      return decodeURIComponent(parts.pop().split(";").shift());
    } catch {
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

          const response = await fetch(
            `${API_PATH}/players/${parsedUser.profileId}`,
          ).catch(() => null);

          if (response && response.ok) {
            const data = await response.json();
            if (data.status === "sucesso" && data.dados) {
              setUser(parsedUser);
            } else {
              limparCookiesEfetivo();
            }
          } else if (response && response.status === 404) {
            limparCookiesEfetivo();
          } else {
            setUser(parsedUser);
          }
        } catch {
          limparCookiesEfetivo();
        }
      }
      setLoading(false);
    };

    verificarSessaoValida();
  }, []);

  const limparCookiesEfetivo = () => {
    setUser(null);
    document.cookie = "@Matchup:user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax";
    document.cookie = "@Matchup:token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax";
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax";
    localStorage.removeItem("@Matchup:user");
    localStorage.removeItem("@Matchup:token");
  };

  const loginSessao = (dadosUsuario) => {
    if (!dadosUsuario || Object.keys(dadosUsuario).length === 0 || !dadosUsuario.nickname) {
      console.error("Tentativa de login com dados vazios ou inválidos abortada.");
      return;
    }
    setUser(dadosUsuario);
    const d = new Date();
    d.setTime(d.getTime() + 7 * 24 * 60 * 60 * 1000);
    document.cookie = `@Matchup:user=${encodeURIComponent(JSON.stringify(dadosUsuario))}; expires=${d.toUTCString()}; path=/; SameSite=Lax`;
  };

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
