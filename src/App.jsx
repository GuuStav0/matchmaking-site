// App.jsx - Limpo e sem duplicatas
import Dashboard from "./views/dashboard.jsx";
import Players from "./views/players.jsx";
import GameSetup from "./views/gameSetup.jsx";
import ProfileSetup from "./views/profile.jsx";
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AboutUs from "./views/about";
import AuthScreen from "./views/auth";
import GamesDirectory from "./views/games";
import { AuthProvider, useAuth } from "./models/authContext.jsx";
import RoomsPage from "./views/rooms.jsx";
import CreateRoom from "./views/createRoom.jsx";
// ── Sprint 3 ─────────────────────────────────────────────────────────────────
import ResetPassword from "./views/resetPassword.jsx";

function RotaPrivada({ children }) {
  const { logado, loading } = useAuth();
  if (loading) return <div className="loading-tela">Carregando sessão...</div>;
  if (!logado) return <Navigate to="/auth" replace />;
  return children;
}

function RotaPublica({ children }) {
  const { logado, loading } = useAuth();
  if (loading) return null;
  if (logado) return <Navigate to="/games" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AboutUs />} />
          <Route path="/games" element={<GamesDirectory />} />
          <Route path="/auth" element={<RotaPublica><AuthScreen /></RotaPublica>} />
          <Route path="/rooms/:gameId" element={<RotaPrivada><RoomsPage /></RotaPrivada>} />
          <Route path="/rooms/:gameId/create"element={<RotaPrivada><CreateRoom /></RotaPrivada>}/>          
          <Route path="/perfil" element={<RotaPrivada><ProfileSetup /></RotaPrivada>} />
          <Route path="/meus-jogos" element={<RotaPrivada><GameSetup /></RotaPrivada>} />
          <Route path="/players" element={<RotaPrivada><Players /></RotaPrivada>} />
          <Route path="/dashboard" element={<RotaPrivada><Dashboard /></RotaPrivada>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
