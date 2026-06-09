// src/constants/index.js
// Constantes globais do projeto Matchup.

// URL base da API — usa proxy do Vite em dev (/api → http://localhost:3000/api)
export const API_BASE_URL = "/api";

export const ROUTES = {
  HOME:          "/",
  AUTH:          "/auth",
  GAMES:         "/games",
  ROOMS:         (gameId)           => `/rooms/${gameId}`,
  CREATE_ROOM:   (gameId)           => `/rooms/${gameId}/create`,
  ROOM_DETAIL:   (gameId, roomId)   => `/rooms/${gameId}/${roomId}`,
  PLAYERS:       "/players",
  DASHBOARD:     "/dashboard",
  PROFILE:       "/perfil",
  ADMIN:         "/admin",
  RESET_PASSWORD:"/reset-password",
};
