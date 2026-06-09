// src/routes/games.routes.js
// Sprint 1 – RF01 · Listagem de jogos disponíveis na plataforma
//
//  GET /api/games          → array de jogos (consumido por games.jsx)
//  GET /api/games/:id      → detalhes de um jogo

import { Router } from "express";
import { db }     from "../database.js";

const router = Router();

// ── GET /api/games ────────────────────────────────────────────────────────────
// Suporta filtros opcionais: ?genre=FPS  e  ?search=val
router.get("/", (req, res) => {
  const { genre, search } = req.query;
  const conditions = [];
  const params     = [];

  if (genre && genre !== "Todos") {
    conditions.push("genre = ?");
    params.push(genre);
  }
  if (search) {
    conditions.push("name LIKE ?");
    params.push(`%${search}%`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const sql   = `SELECT id, name, genre, cover_url, rooms_count
                 FROM games ${where}
                 ORDER BY rooms_count DESC`;

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error("Erro ao listar jogos:", err.message);
      return res.status(500).json({ status: "erro", mensagem: "Erro ao buscar jogos." });
    }
    // Devolve array direto → compatível com games.jsx (setGames(dados))
    res.json(rows);
  });
});

// ── GET /api/games/:id ────────────────────────────────────────────────────────
router.get("/:id", (req, res) => {
  db.get(
    "SELECT id, name, genre, cover_url, rooms_count FROM games WHERE id = ?",
    [req.params.id],
    (err, row) => {
      if (err) {
        console.error("Erro ao buscar jogo:", err.message);
        return res.status(500).json({ status: "erro", mensagem: "Erro interno." });
      }
      if (!row) return res.status(404).json({ status: "erro", mensagem: "Jogo não encontrado." });
      res.json({ status: "sucesso", dados: row });
    }
  );
});

export default router;
