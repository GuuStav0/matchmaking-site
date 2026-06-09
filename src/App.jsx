// src/App.jsx
import { AuthProvider, useAuth } from "./models/authContext.jsx";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import NotFound      from "./views/NotFound.jsx";
import PlayerProfile from "./views/PlayerProfile.jsx";
import Dashboard     from "./views/Dashboard.jsx";
import Players       from "./views/Players.jsx";
import GameSetup     from "./views/GameSetup.jsx";
import ProfileSetup  from "./views/Profile.jsx";
import AboutUs       from "./views/About.jsx";
import AuthScreen    from "./views/Auth.jsx";
import GamesDirectory from "./views/Games.jsx";
import RoomsPage     from "./views/Rooms.jsx";
import CreateRoom    from "./views/CreateRoom.jsx";
import RoomDetail    from "./views/RoomDetail.jsx";
import AdminDashboard from "./views/AdminDashboard.jsx";
import ResetPassword from "./views/ResetPassword.jsx";

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
          <Route path="/"                      element={<AboutUs />} />
          <Route path="/games"                 element={<GamesDirectory />} />
          <Route path="/auth"                  element={<RotaPublica><AuthScreen /></RotaPublica>} />
          <Route path="/rooms/:gameId"         element={<RotaPrivada><RoomsPage /></RotaPrivada>} />
          <Route path="/rooms/:gameId/create"  element={<RotaPrivada><CreateRoom /></RotaPrivada>} />
          <Route path="/rooms/:gameId/:roomId" element={<RotaPrivada><RoomDetail /></RotaPrivada>} />
          <Route path="/perfil"                element={<RotaPrivada><ProfileSetup /></RotaPrivada>} />
          <Route path="/meus-jogos"            element={<RotaPrivada><GameSetup /></RotaPrivada>} />
          <Route path="/players"               element={<RotaPrivada><Players /></RotaPrivada>} />
          <Route path="/dashboard"             element={<RotaPrivada><Dashboard /></RotaPrivada>} />
          <Route path="/players/:id"           element={<RotaPrivada><PlayerProfile /></RotaPrivada>} />
          <Route path="/admin"                 element={<RotaPrivada><AdminDashboard /></RotaPrivada>} />
          <Route path="*"                      element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
