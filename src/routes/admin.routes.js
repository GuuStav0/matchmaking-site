// src/routes/admin.routes.js
// Rotas do painel Admin (Murilo).
//
//   GET    /api/admin/stats
//   GET    /api/admin/users          DELETE /api/admin/users/:id
//   GET    /api/admin/profiles       DELETE /api/admin/profiles/:id
//   GET    /api/admin/games          POST/PUT/DELETE /api/admin/games/:id
//   GET    /api/admin/groups         DELETE /api/admin/groups/:id
//   GET    /api/admin/group-members  DELETE /api/admin/group-members/:gid/:pid

import { Router }      from "express";
import { db }          from "../database.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { sendSuccess, sendError } from "../helpers/response.js";

const router = Router();

// ── Middleware: verifica se o usuário autenticado é administrador ──────────────
// Se ainda não existir nenhum admin no banco, libera acesso para facilitar o
// setup inicial (primeiro usuário que acessar pode agir como admin).
function requireAdmin(req, res, next) {
  db.get("SELECT COUNT(*) AS total FROM admins", [], (err, countRow) => {
    if (err) return sendError(res, "Erro interno.");

    if (countRow.total === 0) return next();

    db.get(
      "SELECT id FROM admins WHERE user_id = ?",
      [req.userId],
      (err2, adminRow) => {
        if (err2) return sendError(res, "Erro interno.");
        if (!adminRow) return sendError(res, "Acesso negado. Apenas administradores.", 403);
        next();
      }
    );
  });
}

// ── GET /api/admin/stats ──────────────────────────────────────────────────────
router.get("/stats", requireAuth, requireAdmin, (req, res) => {
  const queries = [
    { key: "users",         sql: "SELECT COUNT(*) AS n FROM users" },
    { key: "profiles",      sql: "SELECT COUNT(*) AS n FROM profiles" },
    { key: "games",         sql: "SELECT COUNT(*) AS n FROM games" },
    { key: "groups",        sql: "SELECT COUNT(*) AS n FROM game_groups" },
    { key: "group_members", sql: "SELECT COUNT(*) AS n FROM group_members" },
  ];

  const stats = {};
  let done = 0;

  queries.forEach(({ key, sql }) => {
    db.get(sql, [], (err, row) => {
      stats[key] = err ? 0 : (row?.n ?? 0);
      if (++done === queries.length) {
        sendSuccess(res, { dados: stats });
      }
    });
  });
});

// ── USUÁRIOS ──────────────────────────────────────────────────────────────────
router.get("/users", requireAuth, requireAdmin, (req, res) => {
  db.all(
    "SELECT id, email, nickname, created_at FROM users ORDER BY created_at DESC",
    [],
    (err, rows) => {
      if (err) return sendError(res, "Erro interno.");
      sendSuccess(res, { dados: rows });
    }
  );
});

router.delete("/users/:id", requireAuth, requireAdmin, (req, res) => {
  db.run("DELETE FROM users WHERE id = ?", [req.params.id], function (err) {
    if (err) return sendError(res, "Erro interno.");
    if (this.changes === 0) return sendError(res, "Usuário não encontrado.", 404);
    sendSuccess(res, { mensagem: "Usuário excluído com sucesso." });
  });
});

// ── PERFIS ────────────────────────────────────────────────────────────────────
router.get("/profiles", requireAuth, requireAdmin, (req, res) => {
  db.all(
    `SELECT id, nickname, bio, avatar_url, schedule_availability, created_at
     FROM profiles ORDER BY created_at DESC`,
    [],
    (err, rows) => {
      if (err) return sendError(res, "Erro interno.");
      sendSuccess(res, { dados: rows });
    }
  );
});

router.delete("/profiles/:id", requireAuth, requireAdmin, (req, res) => {
  db.run("DELETE FROM profiles WHERE id = ?", [req.params.id], function (err) {
    if (err) return sendError(res, "Erro interno.");
    if (this.changes === 0) return sendError(res, "Perfil não encontrado.", 404);
    sendSuccess(res, { mensagem: "Perfil excluído com sucesso." });
  });
});

// ── JOGOS ─────────────────────────────────────────────────────────────────────
router.get("/games", requireAuth, requireAdmin, (req, res) => {
  db.all(
    "SELECT id, name, genre, cover_url, rooms_count, created_at FROM games ORDER BY rooms_count DESC",
    [],
    (err, rows) => {
      if (err) return sendError(res, "Erro interno.");
      sendSuccess(res, { dados: rows });
    }
  );
});

router.post("/games", requireAuth, requireAdmin, (req, res) => {
  const { name, genre, cover_url } = req.body ?? {};

  if (!name?.trim() || !genre?.trim()) {
    return sendError(res, "Campos obrigatórios: name e genre.", 400);
  }

  const now = new Date().toISOString();
  db.run(
    "INSERT INTO games (name, genre, cover_url, rooms_count, created_at) VALUES (?,?,?,0,?)",
    [name.trim(), genre.trim(), cover_url?.trim() || null, now],
    function (err) {
      if (err) {
        if (err.message.includes("UNIQUE")) {
          return sendError(res, "Já existe um jogo com esse nome.", 409);
        }
        return sendError(res, "Erro interno.");
      }
      sendSuccess(res, { mensagem: "Jogo cadastrado com sucesso!", id: this.lastID }, 201);
    }
  );
});

router.put("/games/:id", requireAuth, requireAdmin, (req, res) => {
  const { name, genre, cover_url } = req.body ?? {};

  if (!name && !genre && cover_url === undefined) {
    return sendError(res, "Informe ao menos um campo: name, genre ou cover_url.", 400);
  }

  const sets = [];
  const vals = [];

  if (name)                    { sets.push("name = ?");      vals.push(name.trim()); }
  if (genre)                   { sets.push("genre = ?");     vals.push(genre.trim()); }
  if (cover_url !== undefined) { sets.push("cover_url = ?"); vals.push(cover_url?.trim() || null); }

  vals.push(req.params.id);

  db.run(`UPDATE games SET ${sets.join(", ")} WHERE id = ?`, vals, function (err) {
    if (err) {
      if (err.message.includes("UNIQUE")) {
        return sendError(res, "Já existe um jogo com esse nome.", 409);
      }
      return sendError(res, "Erro interno.");
    }
    if (this.changes === 0) return sendError(res, "Jogo não encontrado.", 404);
    sendSuccess(res, { mensagem: "Jogo atualizado com sucesso!" });
  });
});

router.delete("/games/:id", requireAuth, requireAdmin, (req, res) => {
  db.run("DELETE FROM games WHERE id = ?", [req.params.id], function (err) {
    if (err) return sendError(res, "Erro interno.");
    if (this.changes === 0) return sendError(res, "Jogo não encontrado.", 404);
    sendSuccess(res, { mensagem: "Jogo excluído com sucesso." });
  });
});

// ── SALAS ─────────────────────────────────────────────────────────────────────
router.get("/groups", requireAuth, requireAdmin, (req, res) => {
  db.all(
    `SELECT gg.id, gg.name, gg.max_slots, gg.created_at,
            g.name  AS game_name,
            g.id    AS game_id,
            gg.creator_id,
            COUNT(gm.profile_id) AS members_count
     FROM game_groups gg
     LEFT JOIN games          g  ON g.id = gg.game_id
     LEFT JOIN group_members gm ON gm.group_id = gg.id
     GROUP BY gg.id
     ORDER BY gg.created_at DESC`,
    [],
    (err, rows) => {
      if (err) return sendError(res, "Erro interno.");
      sendSuccess(res, { dados: rows });
    }
  );
});

router.delete("/groups/:id", requireAuth, requireAdmin, (req, res) => {
  db.run("DELETE FROM game_groups WHERE id = ?", [req.params.id], function (err) {
    if (err) return sendError(res, "Erro interno.");
    if (this.changes === 0) return sendError(res, "Sala não encontrada.", 404);
    sendSuccess(res, { mensagem: "Sala excluída com sucesso." });
  });
});

// ── MEMBROS DAS SALAS ─────────────────────────────────────────────────────────
router.get("/group-members", requireAuth, requireAdmin, (req, res) => {
  db.all(
    `SELECT gm.group_id, gm.profile_id, gm.role, gm.joined_at,
            p.nickname,
            gg.name AS group_name
     FROM group_members gm
     LEFT JOIN profiles    p  ON p.id  = gm.profile_id
     LEFT JOIN game_groups gg ON gg.id = gm.group_id
     ORDER BY gm.joined_at DESC`,
    [],
    (err, rows) => {
      if (err) return sendError(res, "Erro interno.");
      sendSuccess(res, { dados: rows });
    }
  );
});

router.delete("/group-members/:groupId/:profileId", requireAuth, requireAdmin, (req, res) => {
  const { groupId, profileId } = req.params;
  db.run(
    "DELETE FROM group_members WHERE group_id = ? AND profile_id = ?",
    [groupId, profileId],
    function (err) {
      if (err) return sendError(res, "Erro interno.");
      if (this.changes === 0) return sendError(res, "Membro não encontrado.", 404);
      sendSuccess(res, { mensagem: "Membro removido com sucesso." });
    }
  );
});

export default router;
