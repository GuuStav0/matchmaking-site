// src/views/players.jsx
// Sprint 3 — Ordenação por compatibilidade de perfil (Matchmaking/Busca)
//
// Lógica de compatibilidade:
//   O perfil do usuário logado (jogos vinculados, estilo e disponibilidade)
//   é comparado com cada jogador retornado pela API.
//   Pontuação máxima: 100 pontos distribuídos em 3 critérios:
//     • Mesmo jogo vinculado        → 50 pts
//     • Mesmo estilo (casual/comp.) → 30 pts
//     • Sobreposição de horário     → 20 pts
//   Quando o usuário ativa "Ordenar por compatibilidade", os cards são
//   reordenados localmente (sem nova requisição) e exibem um badge com %.

import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../models/authContext.jsx";
import Header from "../assets/actions/header.jsx";
import Footer from "../assets/actions/footer.jsx";
import PlayerCard from "../components/PlayerCard.jsx";
import "../assets/css/players.css";
import "../assets/css/compatibility.css";

const API = "http://localhost:3000/api";

// ─── helpers de compatibilidade ───────────────────────────────────────────────

/**
 * Converte "HH:MM" → minutos desde meia-noite.
 * Retorna null se inválido.
 */
function toMin(str) {
  if (!str || !/^\d{2}:\d{2}$/.test(str)) return null;
  const [h, m] = str.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Verifica se dois intervalos de horário se sobrepõem.
 * Ambos no formato "HH:MM-HH:MM".
 */
function horariosCoincide(schedA, schedB) {
  if (!schedA || !schedB) return false;
  const extractRange = (s) => {
    const match = s.match(/(\d{2}:\d{2})-(\d{2}:\d{2})/);
    if (!match) return null;
    return { start: toMin(match[1]), end: toMin(match[2]) };
  };
  const a = extractRange(schedA);
  const b = extractRange(schedB);
  if (!a || !b) return false;
  // Sobreposição simples (não considera virada de meia-noite)
  return a.start < b.end && b.start < a.end;
}

/**
 * Calcula pontuação de compatibilidade (0–100) entre o perfil do
 * usuário logado e um jogador da listagem.
 *
 * @param {Object} userProfile  – perfil do usuário logado
 * @param {Object} player       – dados do jogador (da API)
 * @returns {{ score: number, razoes: string[] }}
 */
function calcularCompatibilidade(userProfile, player) {
  if (!userProfile) return { score: 0, razoes: [] };

  let score = 0;
  const razoes = [];

  // 1. Mesmo jogo (50 pts)
  const userGames = (userProfile.jogos || []).map((j) =>
    (j.game_name || "").toLowerCase()
  );
  const playerGame = (player.game_name || "").toLowerCase();

  if (playerGame && userGames.includes(playerGame)) {
    score += 50;
    razoes.push(`Joga ${player.game_name}`);
  }

  // 2. Mesmo estilo (30 pts)
  const userStyles = (userProfile.jogos || []).map((j) => j.game_style);
  if (
    player.game_style &&
    userStyles.includes(player.game_style)
  ) {
    score += 30;
    razoes.push(
      player.game_style === "competitive" ? "Estilo competitivo" : "Estilo casual"
    );
  }

  // 3. Sobreposição de horário (20 pts)
  if (horariosCoincide(userProfile.schedule_availability, player.schedule_availability)) {
    score += 20;
    razoes.push("Disponibilidade compatível");
  }

  return { score, razoes };
}

// ─── Badge de compatibilidade ─────────────────────────────────────────────────

function CompatBadge({ score, razoes }) {
  const cor =
    score >= 80
      ? "compat-badge--high"
      : score >= 50
      ? "compat-badge--mid"
      : "compat-badge--low";

  return (
    <div className={`compat-badge ${cor}`} title={razoes.join(" · ")}>
      <span className="compat-badge__icon">⚡</span>
      <span className="compat-badge__score">{score}%</span>
      {razoes.length > 0 && (
        <span className="compat-badge__tip">{razoes[0]}</span>
      )}
    </div>
  );
}

// ─── Card com badge ───────────────────────────────────────────────────────────

function PlayerCardCompat({ player, compatData, ordenandoPorCompat, onClick }) {
  return (
    <div className="pc-compat-wrapper">
      {ordenandoPorCompat && compatData && (
        <CompatBadge score={compatData.score} razoes={compatData.razoes} />
      )}
      <PlayerCard player={player} onClick={onClick} />
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Players() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Filtros
  const [games, setGames] = useState([]);
  const [filterGame, setFilterGame] = useState("");
  const [filterStyle, setFilterStyle] = useState("");
  const [filterRank, setFilterRank] = useState("");
  const [filterHour, setFilterHour] = useState("");

  // Dados
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Paginação
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 12;

  // Sprint 3 — ordenação por compatibilidade
  const [ordenandoPorCompat, setOrdenandoPorCompat] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // ── Carrega jogos para o select ──────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API}/games`)
      .then((r) => r.json())
      .then((data) => setGames(Array.isArray(data) ? data : (data.dados ?? [])))
      .catch(() => {});
  }, []);

  // ── Carrega perfil do usuário logado para calcular compatibilidade ────────────
  useEffect(() => {
    if (!user?.id) return;
    setLoadingProfile(true);
    fetch(`${API}/players/${user.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.status === "sucesso") setUserProfile(data.dados);
      })
      .catch(() => {})
      .finally(() => setLoadingProfile(false));
  }, [user?.id]);

  // ── Busca jogadores na API ───────────────────────────────────────────────────
  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterGame) params.set("game", filterGame);
      if (filterStyle) params.set("style", filterStyle);
      if (filterRank) params.set("rank", filterRank);
      if (filterHour) params.set("hour", filterHour);
      params.set("page", page);
      params.set("limit", LIMIT);

      const token = localStorage.getItem("@Matchup:token") ||
        JSON.parse(localStorage.getItem("@Matchup:user") || "{}").token || "";

      const res = await fetch(`${API}/players?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();

      if (data.status === "sucesso") {
        setPlayers(data.dados ?? []);
        setTotal(data.total ?? 0);
      } else {
        setError("Não foi possível carregar os jogadores.");
      }
    } catch {
      setError("Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  }, [filterGame, filterStyle, filterRank, filterHour, page]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  // ── Ordenação por compatibilidade (local, sem nova requisição) ───────────────
  const playersOrdenados = useMemo(() => {
    if (!ordenandoPorCompat || !userProfile) return players;

    return [...players]
      .map((p) => ({
        ...p,
        _compat: calcularCompatibilidade(userProfile, p),
      }))
      .sort((a, b) => b._compat.score - a._compat.score);
  }, [players, ordenandoPorCompat, userProfile]);

  // ── compatMap para acesso rápido por id ──────────────────────────────────────
  const compatMap = useMemo(() => {
    if (!ordenandoPorCompat || !userProfile) return {};
    return Object.fromEntries(
      players.map((p) => [p.id, calcularCompatibilidade(userProfile, p)])
    );
  }, [players, ordenandoPorCompat, userProfile]);

  // ── Paginação ────────────────────────────────────────────────────────────────
  const totalPages = Math.ceil(total / LIMIT);

  function limparFiltros() {
    setFilterGame("");
    setFilterStyle("");
    setFilterRank("");
    setFilterHour("");
    setPage(1);
  }

  const temFiltroAtivo = filterGame || filterStyle || filterRank || filterHour;

  return (
    <div className="players-page">
      <Header />

      <main className="players-main">
        {/* Hero */}
        <div className="players-hero">
          <h1 className="players-title">
            Encontre seu{" "}
            <span className="players-title-accent">duo perfeito</span>
          </h1>
          <p className="players-subtitle">
            {total > 0
              ? `${total} jogador${total !== 1 ? "es" : ""} encontrado${total !== 1 ? "s" : ""}`
              : "Explore os jogadores disponíveis na plataforma"}
          </p>
        </div>

        {/* Painel de filtros */}
        <div className="players-filters">
          {/* Jogo */}
          <div className="filter-group">
            <span className="filter-label">Jogo</span>
            <select
              className="filter-select"
              value={filterGame}
              onChange={(e) => { setFilterGame(e.target.value); setPage(1); }}
            >
              <option value="">Todos os jogos</option>
              {games.map((g) => (
                <option key={g.id} value={g.name}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Estilo */}
          <div className="filter-group">
            <span className="filter-label">Estilo</span>
            <div className="filter-style-btns">
              {["", "casual", "competitive"].map((s) => (
                <button
                  key={s}
                  className={[
                    "filter-style-btn",
                    s === "casual" ? "filter-style-btn--casual" : "",
                    s === "competitive" ? "filter-style-btn--competitive" : "",
                    filterStyle === s ? "filter-style-btn--active" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => { setFilterStyle(s); setPage(1); }}
                >
                  {s === "" ? "Todos" : s === "casual" ? "Casual" : "Competitivo"}
                </button>
              ))}
            </div>
          </div>

          {/* Rank */}
          <div className="filter-group">
            <span className="filter-label">Faixa de rank</span>
            <select
              className="filter-select"
              value={filterRank}
              onChange={(e) => { setFilterRank(e.target.value); setPage(1); }}
            >
              <option value="">Qualquer rank</option>
              <option value="iniciante">Iniciante</option>
              <option value="bronze">Bronze / Prata</option>
              <option value="gold">Ouro / Platina</option>
              <option value="diamond">Diamante</option>
              <option value="elite">Elite / Mestre</option>
              <option value="top">Top (Global / Radiante)</option>
            </select>
          </div>

          {/* Horário */}
          <div className="filter-group">
            <span className="filter-label">Disponível às</span>
            <input
              type="time"
              className="filter-time"
              value={filterHour}
              onChange={(e) => { setFilterHour(e.target.value); setPage(1); }}
            />
          </div>

          {/* ── Sprint 3: Botão de compatibilidade ── */}
          <div className="filter-group filter-group--compat">
            <span className="filter-label">Compatibilidade</span>
            <button
              className={`compat-sort-btn ${ordenandoPorCompat ? "compat-sort-btn--active" : ""}`}
              onClick={() => setOrdenandoPorCompat((v) => !v)}
              disabled={loadingProfile || !userProfile}
              title={
                !userProfile
                  ? "Configure seu perfil primeiro para usar a compatibilidade"
                  : ordenandoPorCompat
                  ? "Desativar ordenação por compatibilidade"
                  : "Ordenar por compatibilidade com seu perfil"
              }
            >
              <span className="compat-sort-btn__icon">⚡</span>
              {ordenandoPorCompat ? "Compatibilidade ativa" : "Por compatibilidade"}
            </button>
            {!userProfile && !loadingProfile && (
              <span className="compat-sort-hint">
                <button
                  className="compat-sort-hint__link"
                  onClick={() => navigate("/perfil")}
                >
                  Configure seu perfil
                </button>{" "}
                para usar
              </span>
            )}
          </div>

          {temFiltroAtivo && (
            <button className="filter-clear-btn" onClick={limparFiltros}>
              Limpar filtros
            </button>
          )}
        </div>

        {/* Indicador de ordenação ativa */}
        {ordenandoPorCompat && userProfile && (
          <div className="compat-active-bar">
            <span className="compat-active-bar__icon">⚡</span>
            <span>
              Ordenado por compatibilidade com seu perfil —{" "}
              <strong>
                {playersOrdenados.filter((p) => (compatMap[p.id]?.score ?? 0) >= 50).length}
              </strong>{" "}
              jogador(es) com alta compatibilidade
            </span>
          </div>
        )}

        {/* Conteúdo principal */}
        {loading ? (
          <div className="players-loading">
            <div className="players-spinner" />
            <p>Buscando jogadores...</p>
          </div>
        ) : error ? (
          <div className="players-error">
            <p>{error}</p>
            <button className="players-retry-btn" onClick={fetchPlayers}>
              Tentar novamente
            </button>
          </div>
        ) : playersOrdenados.length === 0 ? (
          <div className="players-empty">
            <div className="players-empty-icon">🎮</div>
            <p className="players-empty-title">Nenhum jogador encontrado</p>
            <p className="players-empty-sub">
              Tente ajustar os filtros ou{" "}
              <button className="players-empty-link" onClick={limparFiltros}>
                limpar a busca
              </button>
            </p>
          </div>
        ) : (
          <div className="players-grid">
            {playersOrdenados.map((player) => (
              <PlayerCardCompat
                key={player.id}
                player={player}
                compatData={compatMap[player.id]}
                ordenandoPorCompat={ordenandoPorCompat}
                onClick={() => navigate(`/players/${player.id}`)}
              />
            ))}
          </div>
        )}

        {/* Paginação */}
        {totalPages > 1 && !loading && (
          <div className="players-pagination">
            <button
              className="pagination-btn"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ← Anterior
            </button>

            <div className="pagination-pages">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    className={`pagination-page ${page === p ? "pagination-page--active" : ""}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                );
              })}
            </div>

            <button
              className="pagination-btn"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima →
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
