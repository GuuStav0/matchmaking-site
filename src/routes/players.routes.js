// src/routes/players.routes.js
// RF05–RF10 · Listagem e filtros de jogadores
//
//  GET  /api/players             → lista jogadores com filtros e paginação
//  GET  /api/players/:id         → perfil detalhado de um jogador
//
// Query params de /api/players:
//   game    – nome (parcial, case-insensitive) do jogo vinculado
//   style   – "casual" | "competitive"
//   rank    – chave de faixa (ver RANK_TERMS abaixo)
//   hour    – "HH:MM" – filtra jogadores disponíveis nesse horário
//   page    – número da página (padrão 1)
//   limit   – itens por página (padrão 12, máx 50)

import { Router } from "express";
import { db }     from "../database.js";
import { sendSuccess, sendError } from "../helpers/response.js";

const router = Router();

const RANK_TERMS = {
  iniciante: ["iniciante", "ferro", "prata i"],
  bronze:    ["bronze", "prata", "ouro nova"],
  gold:      ["ouro", "platina", "mestre guard"],
  diamond:   ["diamante", "águia", "esmeralda"],
  elite:     ["elite", "supremo", "ascendente", "mestre", "grão-mestre"],
  top:       ["global elite", "imortal", "radiante", "desafiante"],
};

function toMinutes(timeStr) {
  if (!timeStr || !/^\d{2}:\d{2}$/.test(timeStr)) return null;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function horarioDentroDoSchedule(schedule, hourMinutes) {
  if (!schedule || hourMinutes === null) return true;
  const match = schedule.match(/(\d{2}:\d{2})-(\d{2}:\d{2})/);
  if (!match) return false;
  const start = toMinutes(match[1]);
  const end   = toMinutes(match[2]);
  if (start <= end) {
    return hourMinutes >= start && hourMinutes <= end;
  } else {
    return hourMinutes >= start || hourMinutes <= end;
  }
}

// ── GET /api/players ─────────────────────────────────────────────────────────
router.get("/", (req, res) => {
  const {
    game  = "",
    style = "",
    rank  = "",
    hour  = "",
    page  = "1",
    limit = "12",
  } = req.query;

  const pageNum  = Math.max(1, parseInt(page, 10)  || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
  const offset   = (pageNum - 1) * limitNum;
  const hourMin  = toMinutes(hour);

  const conditions = [];
  const params     = [];

  if (game) {
    conditions.push("LOWER(g.name) LIKE ?");
    params.push(`%${game.toLowerCase()}%`);
  }

  if (style === "casual" || style === "competitive") {
    conditions.push("ug.game_style = ?");
    params.push(style);
  }

  if (rank && RANK_TERMS[rank]) {
    const terms = RANK_TERMS[rank];
    const orClauses = terms.map(() => "LOWER(ug.game_rank) LIKE ?").join(" OR ");
    conditions.push(`(${orClauses})`);
    terms.forEach((t) => params.push(`%${t}%`));
  }

  const whereClause = conditions.length ? "WHERE " + conditions.join(" AND ") : "";
  const joinType    = (game || style || rank) ? "INNER" : "LEFT";

  const sql = `
    SELECT
      p.id,
      p.nickname,
      p.bio,
      p.avatar_url,
      p.schedule_availability,
      ug.game_style,
      ug.game_rank,
      g.name  AS game_name,
      g.id    AS game_id
    FROM profiles p
    ${joinType} JOIN user_games ug ON ug.profile_id = p.id
    ${joinType} JOIN games      g  ON g.id = ug.game_id
    ${whereClause}
    ORDER BY p.nickname ASC
  `;

  db.all(sql, params, (err, rows) => {
    if (err) return sendError(res, "Erro interno.");

    let filtered = rows;
    if (hourMin !== null) {
      filtered = rows.filter((r) =>
        horarioDentroDoSchedule(r.schedule_availability, hourMin)
      );
    }

    const total     = filtered.length;
    const paginated = filtered.slice(offset, offset + limitNum);

    sendSuccess(res, { total, page: pageNum, limit: limitNum, dados: paginated });
  });
});

// ── GET /api/players/:id ──────────────────────────────────────────────────────
router.get("/:id", (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT
      p.id,
      p.nickname,
      p.bio,
      p.avatar_url,
      p.schedule_availability,
      ug.game_style,
      ug.game_rank,
      g.name   AS game_name,
      g.id     AS game_id,
      g.genre  AS game_genre
    FROM profiles p
    LEFT JOIN user_games ug ON ug.profile_id = p.id
    LEFT JOIN games      g  ON g.id = ug.game_id
    WHERE p.id = ?
  `;

  db.all(sql, [id], (err, rows) => {
    if (err) return sendError(res, "Erro interno.");
    if (!rows.length) return sendError(res, "Jogador não encontrado.", 404);

    const { id: pid, nickname, bio, avatar_url, schedule_availability } = rows[0];
    const jogos = rows
      .filter((r) => r.game_id)
      .map((r) => ({
        game_id:    r.game_id,
        game_name:  r.game_name,
        game_genre: r.game_genre,
        game_style: r.game_style,
        game_rank:  r.game_rank,
      }));

    sendSuccess(res, {
      dados: { id: pid, nickname, bio, avatar_url, schedule_availability, jogos },
    });
  });
});

export default router;
