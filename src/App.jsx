import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AboutUs from "./views/about";
import AuthScreen from "./views/auth";
import GamesDirectory from "./views/games";
import { AuthProvider, useAuth } from "./models/authContext.jsx";

// Protege a página de jogos. Se não estiver logado, chuta de volta para a tela de autenticação (/auth)
function RotaPrivada({ children }) {
  const { logado, loading } = useAuth();

  // Enquanto lê o localStorage no refresh, evita redirecionar erroneamente
  if (loading) {
    return <div className="loading-tela">Carregando sessão...</div>;
  }

  // Se não estiver logado, redireciona para a tela de auth
  if (!logado) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}

// Se o usuário já estiver logado e tentar acessar o login/cadastro, manda direto para os jogos
function RotaPublica({ children }) {
  const { logado, loading } = useAuth();

  if (loading) return null;

  if (logado) {
    return <Navigate to="/games" replace />;
  }

  return children;
}

// ─── COMPONENTE PRINCIPAL ───────────────────────────────────────────────────
export default function App() {
  return (
    // 1. O AuthProvider fica no topo absoluto de tudo
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rota Institucional / Landing Page: Livre para qualquer um acessar */}
          <Route path="/" element={<AboutUs />} />

          {/* Rota de Autenticação: Protegida para usuários já logados não entrarem de novo */}
          <Route
            path="/auth"
            element={
              <RotaPublica>
                <AuthScreen />
              </RotaPublica>
            }
          />
          <Route
            path="/games"
            element={
              <RotaPrivada>
                <GamesDirectory />
              </RotaPrivada>
            }
          />

          {/* Rota de segurança: digitar qualquer endereço inexistente, manda para a Home (Substituir por pagina 404 personalizada) */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
