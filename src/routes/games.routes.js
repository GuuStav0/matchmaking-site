// src/routes/games.routes.js
// RF01 · Listagem de jogos
//
//  GET /api/games      → array de jogos (retorna array direto — compatível com games.jsx)
//  GET /api/games/:id  → detalhes de um jogo

import { Router } from "express";
import { db }     from "../database.js";
import { sendError } from "../helpers/response.js";

const router = Router();

// ── GET /api/games ────────────────────────────────────────────────────────────
// Retorna array direto (sem wrapper status/dados) para compatibilidade com games.jsx.
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
    if (err) return sendError(res, "Erro ao buscar jogos.");
    res.json(rows);
  });
});

// ── GET /api/games/:id ────────────────────────────────────────────────────────
router.get("/:id", (req, res) => {
  db.get(
    "SELECT id, name, genre, cover_url, rooms_count FROM games WHERE id = ?",
    [req.params.id],
    (err, row) => {
      if (err) return sendError(res, "Erro interno.");
      if (!row) return sendError(res, "Jogo não encontrado.", 404);
      res.json({ status: "sucesso", dados: row });
    }
  );
});

export default router;
