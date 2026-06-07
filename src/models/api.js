// src/models/api.js
// Ponto de entrada da API Matchmaking.
// Inicia o banco e registra todas as rotas.

import express from "express";
import cors    from "cors";
import { initDatabase, db } from "./database.js";
import gamesRouter           from "./routes/games.routes.js";
import usersRouter           from "./routes/users.routes.js";
import authRouter, { handlerLogin } from "./routes/auth.routes.js";
// ── Sprint 2 ─────────────────────────────────────────────────────────────────
import profilesRouter        from "./routes/profiles.routes.js";
import playersRouter         from "./routes/players.routes.js";

const app  = express();
const PORT = process.env.PORT ?? 3000;

// ── Middlewares globais ───────────────────────────────────────────────────────
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());

// ── Rotas da Sprint 1 ─────────────────────────────────────────────────────────
//  RF01/RF02  – Jogos
app.use("/api/games",  gamesRouter);

//  RF03       – Usuários (CRUD)
app.use("/api/users",  usersRouter);

//  RF04       – Autenticação (/api/auth/login, /register, /logout)
app.use("/api/auth",   authRouter);

//  Alias de compatibilidade → authService.js chama POST /api/login
app.post("/api/login", handlerLogin);

//  Alias de compatibilidade → authService.recoverPassword chama GET /api/listagem/users
app.get("/api/listagem/users", (_req, res) => {
  db.all("SELECT id, email, nickname FROM users", [], (err, rows) => {
    if (err) return res.status(500).json({ status: "erro", mensagem: "Erro interno." });
    res.json({ status: "sucesso", dados: rows });
  });
});

// ── Rotas da Sprint 2 ─────────────────────────────────────────────────────────
//  RF01       – Edição de perfil (PUT /api/profiles/:id)
//  GET        – Consulta perfil público
app.use("/api/profiles", profilesRouter);

//  RF05–RF10  – Listagem e filtros de jogadores (GET /api/players)
app.use("/api/players",  playersRouter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) =>
  res.json({ status: "ok", timestamp: new Date().toISOString() })
);

// ── 404 fallback ──────────────────────────────────────────────────────────────
app.use((req, res) =>
  res.status(404).json({
    status: "erro",
    mensagem: `Rota não encontrada: ${req.method} ${req.path}`,
  })
);

// ── Boot: banco primeiro, servidor depois ─────────────────────────────────────
initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`\n🚀  API Matchmaking → http://localhost:${PORT}`);
      console.log("─".repeat(52));
      // Sprint 1
      console.log("  GET    /api/health");
      console.log("  GET    /api/games");
      console.log("  POST   /api/users        (cadastro)");
      console.log("  GET    /api/users/:id    [auth]");
      console.log("  PUT    /api/users/:id    [auth, owner]");
      console.log("  DELETE /api/users/:id    [auth, owner]");
      console.log("  POST   /api/login        (alias)");
      console.log("  POST   /api/auth/login");
      console.log("  POST   /api/auth/register");
      console.log("  POST   /api/auth/logout  [auth]");
      // Sprint 2
      console.log("─".repeat(52));
      console.log("  GET    /api/profiles/:id");
      console.log("  PUT    /api/profiles/:id [auth, owner]");
      console.log("  GET    /api/players      ?game=&style=&rank=&hour=&page=&limit=");
      console.log("  GET    /api/players/:id");
      console.log("─".repeat(52) + "\n");
    });
  })
  .catch((err) => {
    console.error("❌  Falha crítica no boot:", err);
    process.exit(1);
  });
