// src/views/players.jsx
// Sprint 2 – Matchmaking (Busca)
//
//  RF05 – Listagem de jogadores com paginação
//  RF06 – Filtro por jogo
//  RF07 – Filtro por estilo (casual / competitive)
//  RF08 – Filtro por rank / faixa de MMR
//  RF09 – Filtro por disponibilidade de horário
//  RF10 – Rota GET /players?game=&style= (integração com API)

import { useState, useEffect, useCallback } from "react";
import PlayerCard from "../components/PlayerCard.jsx";
import Header from "../assets/actions/header.jsx";
import Footer from "../assets/actions/footer.jsx";
import "../assets/css/players.css";

const PAGE_SIZE = 12;

const RANK_OPTIONS = [
  { label: "Todos os ranks", value: "" },
  { label: "Iniciante / Ferro / Prata I", value: "iniciante" },
  { label: "Bronze / Prata / Ouro Nova", value: "bronze" },
  { label: "Ouro / Platina / Mestre Guardião", value: "gold" },
  { label: "Diamante / Águia / Esmeralda", value: "diamond" },
  { label: "Elite / Supremo / Ascendente / Mestre", value: "elite" },
  { label: "Top / Global Elite / Imortal / Radiante", value: "top" },
];

// Mapeia o valor interno para termos de busca parcial
const RANK_TERMS = {
  iniciante: ["iniciante", "ferro", "prata i"],
  bronze: ["bronze", "prata", "ouro nova"],
  gold: ["ouro", "platina", "mestre guardião"],
  diamond: ["diamante", "águia", "esmeralda"],
  elite: ["elite", "supremo", "ascendente", "mestre", "grão-mestre"],
  top: ["global elite", "imortal", "radiante", "desafiante"],
};

export default function Players() {
  // ── Jogos disponíveis (seed da API) ──────────────────────────────────────
  const [games, setGames] = useState([]);

  // ── Filtros ───────────────────────────────────────────────────────────────
  const [filterGame, setFilterGame] = useState("");
  const [filterStyle, setFilterStyle] = useState("");
  const [filterRank, setFilterRank] = useState("");
  const [filterHour, setFilterHour] = useState(""); // "HH:MM" — hora que o usuário está disponível

  // ── Resultados ────────────────────────────────────────────────────────────
  const [players, setPlayers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── Busca jogos para popular o select ────────────────────────────────────
  useEffect(() => {
    fetch("http://localhost:3000/api/games")
      .then((r) => r.json())
      .then((data) => setGames(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  // ── Busca jogadores sempre que filtros ou página mudam ────────────────────
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
      params.set("limit", PAGE_SIZE);

      const res = await fetch(`http://localhost:3000/api/players?${params}`);
      if (!res.ok) throw new Error("Erro ao buscar jogadores.");
      const data = await res.json();
      setPlayers(data.dados ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filterGame, filterStyle, filterRank, filterHour, page]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  // ── Ao mudar qualquer filtro, volta p/ página 1 ───────────────────────────
  function applyFilter(setter) {
    return (val) => {
      setter(val);
      setPage(1);
    };
  }

  function clearFilters() {
    setFilterGame("");
    setFilterStyle("");
    setFilterRank("");
    setFilterHour("");
    setPage(1);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasActiveFilters = filterGame || filterStyle || filterRank || filterHour;

  return (
    <div className="players-page">
      <Header />

      <main className="players-main">
        {/* ── Hero ── */}
        <div className="players-hero">
          <h1 className="players-title">
            Encontre seu <span className="players-title-accent">parceiro</span>
          </h1>
          <p className="players-subtitle">
            {loading ? "Buscando jogadores..." : `${total} jogador${total !== 1 ? "es" : ""} encontrado${total !== 1 ? "s" : ""}`}
          </p>
        </div>

        {/* ── Painel de Filtros ── */}
        <div className="players-filters">
          {/* Filtro por jogo */}
          <div className="filter-group">
            <label className="filter-label">🎮 Jogo</label>
            <select
              className="filter-select"
              value={filterGame}
              onChange={(e) => applyFilter(setFilterGame)(e.target.value)}
            >
              <option value="">Todos os jogos</option>
              {games.map((g) => (
                <option key={g.id} value={g.name}>{g.name}</option>
              ))}
            </select>
          </div>

          {/* Filtro por estilo */}
          <div className="filter-group">
            <label className="filter-label">⚔️ Estilo</label>
            <div className="filter-style-btns">
              <button
                className={`filter-style-btn ${filterStyle === "" ? "filter-style-btn--active" : ""}`}
                onClick={() => applyFilter(setFilterStyle)("")}
              >
                Todos
              </button>
              <button
                className={`filter-style-btn filter-style-btn--casual ${filterStyle === "casual" ? "filter-style-btn--active" : ""}`}
                onClick={() => applyFilter(setFilterStyle)("casual")}
              >
                Casual
              </button>
              <button
                className={`filter-style-btn filter-style-btn--competitive ${filterStyle === "competitive" ? "filter-style-btn--active" : ""}`}
                onClick={() => applyFilter(setFilterStyle)("competitive")}
              >
                Competitivo
              </button>
            </div>
          </div>

          {/* Filtro por rank */}
          <div className="filter-group">
            <label className="filter-label">🏆 Rank / Faixa</label>
            <select
              className="filter-select"
              value={filterRank}
              onChange={(e) => applyFilter(setFilterRank)(e.target.value)}
            >
              {RANK_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Filtro por horário */}
          <div className="filter-group">
            <label className="filter-label">🕐 Disponível às</label>
            <input
              type="time"
              className="filter-time"
              value={filterHour}
              onChange={(e) => applyFilter(setFilterHour)(e.target.value)}
              title="Filtra jogadores disponíveis neste horário"
            />
          </div>

          {/* Limpar filtros */}
          {hasActiveFilters && (
            <button className="filter-clear-btn" onClick={clearFilters}>
              ✕ Limpar filtros
            </button>
          )}
        </div>

        {/* ── Conteúdo principal ── */}
        {error && (
          <div className="players-error">
            <span>⚠️ {error}</span>
            <button onClick={fetchPlayers} className="players-retry-btn">Tentar novamente</button>
          </div>
        )}

        {loading && (
          <div className="players-loading">
            <div className="players-spinner" />
            <span>Buscando jogadores...</span>
          </div>
        )}

        {!loading && !error && players.length === 0 && (
          <div className="players-empty">
            <div className="players-empty-icon">🔍</div>
            <p className="players-empty-title">Nenhum jogador encontrado</p>
            <p className="players-empty-sub">
              Tente ajustar os filtros ou{" "}
              <button className="players-empty-link" onClick={clearFilters}>
                limpar todos
              </button>
              .
            </p>
          </div>
        )}

        {!loading && !error && players.length > 0 && (
          <>
            <div className="players-grid">
              {players.map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  onClick={() => {}}
                />
              ))}
            </div>

            {/* ── Paginação ── */}
            {totalPages > 1 && (
              <div className="players-pagination">
                <button
                  className="pagination-btn"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  ← Anterior
                </button>

                <div className="pagination-pages">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      className={`pagination-page ${p === page ? "pagination-page--active" : ""}`}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <button
                  className="pagination-btn"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Próxima →
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
