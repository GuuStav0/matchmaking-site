// src/views/players.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../models/authContext.jsx";
import Header from "../assets/actions/header.jsx";
import Footer from "../assets/actions/footer.jsx";
import { Popup } from "../assets/actions/PopUp.jsx";
import PlayerCard from "../components/PlayerCard.jsx";
import "../assets/css/players.css";
import "../assets/css/compatibility.css";

const API = "http://localhost:3000/api";

// ─── Schedule overlap helper ──────────────────────────────────────────────────
function toMin(str) {
  if (!str || !/^\d{2}:\d{2}$/.test(str)) return null;
  const [h, m] = str.split(":").map(Number);
  return h * 60 + m;
}

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
  return a.start < b.end && b.start < a.end;
}

// ─── Compatibility score ──────────────────────────────────────────────────────
function calcularCompatibilidade(userProfile, player) {
  if (!userProfile) return { score: 0, razoes: [] };
  let score = 0;
  const razoes = [];

  const userGames = (userProfile.jogos || []).map((j) => (j.game_name || "").toLowerCase());
  const playerGame = (player.game_name || "").toLowerCase();
  if (playerGame && userGames.includes(playerGame)) {
    score += 50;
    razoes.push(`Joga ${player.game_name}`);
  }

  const userStyles = (userProfile.jogos || []).map((j) => j.game_style);
  if (player.game_style && userStyles.includes(player.game_style)) {
    score += 30;
    razoes.push(player.game_style === "competitive" ? "Estilo competitivo" : "Estilo casual");
  }

  if (horariosCoincide(userProfile.schedule_availability, player.schedule_availability)) {
    score += 20;
    razoes.push("Disponibilidade compatível");
  }

  return { score, razoes };
}

// ─── Compat badge ─────────────────────────────────────────────────────────────
function CompatBadge({ score, razoes }) {
  const cor =
    score >= 80 ? "compat-badge--high"
    : score >= 50 ? "compat-badge--mid"
    : "compat-badge--low";
  return (
    <div className={`compat-badge ${cor}`} title={razoes.join(" · ")}>
      <span className="compat-badge__icon">⚡</span>
      <span className="compat-badge__score">{score}%</span>
      {razoes.length > 0 && <span className="compat-badge__tip">{razoes[0]}</span>}
    </div>
  );
}

// ─── Resolve the tags shown on a card based on active game filter ──────────────
// When a specific game is filtered, we try to find that game in player.jogos
// and show the rank + style from that registration. Fallback to top-level fields.
function resolvePlayerDisplayData(player, filterGame) {
  // player.jogos may exist if the backend returns it (array of user_games rows)
  const jogos = Array.isArray(player.jogos) ? player.jogos : [];

  if (filterGame && jogos.length > 0) {
    const match = jogos.find(
      (j) => (j.game_name || "").toLowerCase() === filterGame.toLowerCase()
    );
    if (match) {
      return {
        ...player,
        game_name: match.game_name ?? player.game_name,
        game_rank: match.game_rank ?? player.game_rank ?? null,
        game_style: match.game_style ?? player.game_style ?? null,
      };
    }
  }

  // No match or no filter — use the top-level fields the API already returns
  return player;
}

// ─── Player card with compat ──────────────────────────────────────────────────
function PlayerCardCompat({ player, compatData, ordenandoPorCompat, onClick, filterGame }) {
  const display = resolvePlayerDisplayData(player, filterGame);

  const borderClass = display.avatar_url
    ? display.game_style === "competitive"
      ? "avatar-border--competitive"
      : display.game_style === "casual"
        ? "avatar-border--casual"
        : ""
    : "";

  return (
    <div className="pc-compat-wrapper" onClick={onClick}>
      {ordenandoPorCompat && compatData && (
        <CompatBadge score={compatData.score} razoes={compatData.razoes} />
      )}
      <PlayerCard player={display} avatarBorderClass={borderClass} />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Players() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Filters
  const [games,          setGames]          = useState([]);
  const [filterGame,     setFilterGame]     = useState("");
  const [filterStyle,    setFilterStyle]    = useState("");
  const [filterRank,     setFilterRank]     = useState("");
  const [filterHour,     setFilterHour]     = useState("");
  const [availableRanks, setAvailableRanks] = useState([]);

  // Popup
  const [popupConfig, setPopupConfig] = useState({ isOpen: false, message: "", type: "info" });

  // Players data
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  // Pagination
  const [page,  setPage]  = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 12;

  // Compatibility
  const [ordenandoPorCompat, setOrdenandoPorCompat] = useState(false);
  const [userProfile,        setUserProfile]         = useState(null);
  const [loadingProfile,     setLoadingProfile]      = useState(false);

  // ── Load games for the select ──────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API}/games`)
      .then((r) => r.json())
      .then((data) => setGames(Array.isArray(data) ? data : (data.dados ?? [])))
      .catch(() => {});
  }, []);

  // ── Load logged-in user profile for compatibility scoring ──────────────────
  useEffect(() => {
    if (!user?.id) return;
    setLoadingProfile(true);

    fetch(`${API}/players/${user.id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (data.status === "sucesso") setUserProfile(data.dados);
      })
      .catch(() => setUserProfile(null))
      .finally(() => setLoadingProfile(false));
  }, [user?.id]);

  // ── Fetch players ──────────────────────────────────────────────────────────
  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filterGame)  params.set("game",  filterGame);
      if (filterStyle) params.set("style", filterStyle);
      if (filterRank)  params.set("rank",  filterRank);
      if (filterHour)  params.set("hour",  filterHour);
      params.set("page",  page);
      params.set("limit", LIMIT);

      const res = await fetch(`${API}/players?${params.toString()}`).catch(() => null);

      if (!res || !res.ok) {
        setPlayers([]);
        setTotal(0);
        setError("Servidor offline ou inacessível.");
        return;
      }

      const data = await res.json();

      if (data.status === "sucesso") {
        setPlayers(data.dados ?? []);
        setTotal(data.total ?? 0);
        setError(null);
      } else {
        setPlayers([]);
        setError("Não foi possível carregar os jogadores.");
      }
    } catch (err) {
      console.error("Erro no fetchPlayers:", err);
      setPlayers([]);
      setError("Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  }, [filterGame, filterStyle, filterRank, filterHour, page]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  // ── Compatibility ordering ─────────────────────────────────────────────────
  const playersOrdenados = useMemo(() => {
    if (!ordenandoPorCompat || !userProfile) return players;
    return [...players]
      .map((p) => ({ ...p, _compat: calcularCompatibilidade(userProfile, p) }))
      .sort((a, b) => b._compat.score - a._compat.score);
  }, [players, ordenandoPorCompat, userProfile]);

  const compatMap = useMemo(() => {
    if (!ordenandoPorCompat || !userProfile) return {};
    return Object.fromEntries(
      players.map((p) => [p.id, calcularCompatibilidade(userProfile, p)])
    );
  }, [players, ordenandoPorCompat, userProfile]);

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
      {/* Atmospheric grid overlay */}
      <div className="players-grid-bg" aria-hidden="true" />

      <Header />

      <main className="players-main">
        {/* Hero */}
        <div className="players-hero">
          <h1 className="players-title">
            Encontre seu <span className="players-title-accent">duo perfeito</span>
          </h1>
          <p className="players-subtitle">
            {total > 0
              ? `${total} jogador${total !== 1 ? "es" : ""} encontrado${total !== 1 ? "s" : ""}`
              : "Explore os jogadores disponíveis na plataforma"}
          </p>
        </div>

        {/* Filters panel */}
        <div className="players-filters">
          {/* Game */}
          <div className="filter-group">
            <span className="filter-label">Jogo</span>
            <select
              className="filter-select"
              value={filterGame}
              onChange={(e) => {
                const selectedGameName = e.target.value;
                setFilterGame(selectedGameName);
                setFilterStyle("");
                setFilterRank("");
                setPage(1);

                const gameObj = games.find((g) => g.name === selectedGameName);
                if (gameObj?.ranks_tags) {
                  setAvailableRanks(gameObj.ranks_tags.split(",").map((t) => t.trim()));
                } else {
                  setAvailableRanks([]);
                }
              }}
            >
              <option value="">Todos os jogos</option>
              {games.map((g) => (
                <option key={g.id} value={g.name}>{g.name}</option>
              ))}
            </select>
          </div>

          {/* Style */}
          <div className="filter-group">
            <span className="filter-label">Estilo</span>
            <div className="filter-style-btns">
              {["", "casual", "competitive"].map((s) => (
                <button
                  key={s}
                  className={[
                    "filter-style-btn",
                    s === "casual"       ? "filter-style-btn--casual"       : "",
                    s === "competitive"  ? "filter-style-btn--competitive"  : "",
                    filterStyle === s    ? "filter-style-btn--active"       : "",
                    !filterGame          ? "filter-style-btn--disabled"     : "",
                  ].filter(Boolean).join(" ")}
                  onClick={() => {
                    if (!filterGame) {
                      setPopupConfig({ isOpen: true, message: "Selecione um jogo primeiro para poder filtrar por Estilo!", type: "info" });
                      return;
                    }
                    setFilterStyle(s);
                    setPage(1);
                  }}
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
              className={`filter-select ${!filterGame ? "filter-select--disabled" : ""}`}
              value={filterRank}
              onChange={(e) => {
                if (!filterGame) { setFilterRank(""); return; }
                setFilterRank(e.target.value);
                setPage(1);
              }}
              onClick={() => {
                if (!filterGame) {
                  setPopupConfig({ isOpen: true, message: "Selecione um jogo primeiro para liberar as faixas de Rank!", type: "info" });
                }
              }}
            >
              <option value="">{filterGame ? "Qualquer rank" : "Selecione um jogo primeiro"}</option>
              {availableRanks.map((rankTag) => (
                <option key={rankTag} value={rankTag}>{rankTag}</option>
              ))}
            </select>
          </div>

          {/* Schedule / Hour */}
          <div className="filter-group">
            <span className="filter-label">Disponível às</span>
            <input
              type="time"
              className="filter-time"
              value={filterHour}
              onChange={(e) => { setFilterHour(e.target.value); setPage(1); }}
            />
          </div>

          {/* Compatibility */}
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
                <button className="compat-sort-hint__link" onClick={() => navigate("/perfil")}>
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

        {/* Active compatibility bar */}
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

        {/* Main content */}
        {loading ? (
          <div className="players-loading">
            <div className="players-spinner" />
            <p>Buscando jogadores…</p>
          </div>
        ) : error ? (
          <div className="players-error">
            <p>{error}</p>
            <button className="players-retry-btn" onClick={fetchPlayers}>Tentar novamente</button>
          </div>
        ) : playersOrdenados.length === 0 ? (
          <div className="players-empty">
            <div className="players-empty-icon">🎮</div>
            <p className="players-empty-title">Nenhum jogador encontrado</p>
            <p className="players-empty-sub">
              Tente ajustar os filtros ou{" "}
              <button className="players-empty-link" onClick={limparFiltros}>limpar a busca</button>
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
                filterGame={filterGame}
                onClick={() => navigate(`/players/${player.id}`)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && !loading && (
          <div className="players-pagination">
            <button className="pagination-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
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
            <button className="pagination-btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Próxima →
            </button>
          </div>
        )}
      </main>

      <Footer />
      <Popup
        isOpen={popupConfig.isOpen}
        message={popupConfig.message}
        type={popupConfig.type}
        onClose={() => setPopupConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}