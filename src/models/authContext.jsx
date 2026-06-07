import { createContext, useState, useEffect, useContext } from "react";

if (!window.__AuthContextShared) {
  window.__AuthContextShared = createContext({});
}
const AuthContext = window.__AuthContextShared;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storagedUser = localStorage.getItem("@Matchup:user");
    if (storagedUser) {
      setUser(JSON.parse(storagedUser));
    }
    setLoading(false);
  }, []);

  const loginSessao = (dadosUsuario) => {
    setUser(dadosUsuario);
    localStorage.setItem("@Matchup:user", JSON.stringify(dadosUsuario));
  };

  const logoutSessao = () => {
    setUser(null);
    localStorage.removeItem("@Matchup:user");
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