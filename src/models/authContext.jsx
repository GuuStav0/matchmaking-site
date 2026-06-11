// src/models/authContext.jsx
import { createContext, useState, useEffect, useContext } from "react";

if (!window.__AuthContextShared) {
  window.__AuthContextShared = createContext({});
}
const AuthContext = window.__AuthContextShared;

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Rehydrate from localStorage on mount ────────────────────────────────────
  useEffect(() => {
    const storagedUser = localStorage.getItem("@Matchup:user");
    if (storagedUser && storagedUser !== "undefined") {
      try {
        setUser(JSON.parse(storagedUser));
      } catch (error) {
        console.error("Erro ao fazer parse do usuário guardado:", error);
        localStorage.removeItem("@Matchup:user");
      }
    }
    setLoading(false);
  }, []);

  // ── Login ────────────────────────────────────────────────────────────────────
  const loginSessao = (dadosUsuario) => {
    if (
      !dadosUsuario ||
      Object.keys(dadosUsuario).length === 0 ||
      !dadosUsuario.nickname
    ) {
      console.error("Tentativa de login com dados vazios ou inválidos abortada.");
      return;
    }
    setUser(dadosUsuario);
    localStorage.setItem("@Matchup:user", JSON.stringify(dadosUsuario));
  };

  // ── Logout ───────────────────────────────────────────────────────────────────
  const logoutSessao = () => {
    setUser(null);
    localStorage.removeItem("@Matchup:user");
  };

  const atualizarDadosUsuario = (novosDados) => {
    if (!novosDados || typeof novosDados !== "object") return;

    setUser((prev) => {
      if (!prev) return prev;
      const atualizado = { ...prev, ...novosDados };
      localStorage.setItem("@Matchup:user", JSON.stringify(atualizado));
      return atualizado;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        logado: !!user,
        user,
        loginSessao,
        logoutSessao,
        atualizarDadosUsuario,   // ← exported so header.jsx and profile.jsx can use it
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