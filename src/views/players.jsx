import { useState, useEffect } from "react";
import PlayerCard from "../components/PlayerCard.jsx";
import Header from "../assets/actions/header.jsx";
import Footer from "../assets/actions/footer.jsx";
import "../assets/css/players.css";

const API_BASE = "http://localhost:3000/api";

export default function Players() {
  const [players, setPlayers] = useState([]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  const [gameFilter, setGameFilter] = useState("");
  const [styleFilter, setStyleFilter] = useState("");

  const POR_PAGINA = 8;
  const [pagina, setPagina] = useState(1);

  useEffect(() => {
    fetch(`${API_BASE}/games`)
      .then((r) => r.json())
      .then((data) => setGames(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setPagina(1);
    setLoading(true);
    setErro(null);

    const params = new URLSearchParams();
    if (gameFilter) params.set("game", gameFilter);
    if (styleFilter) params.set("style", styleFilter);

    fetch(`${API_BASE}/players?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.status === "erro") throw new Error(data.mensagem);
        setPlayers(data.dados || []);
      })
      .catch((err) => setErro(err.message))
      .finally(() => setLoading(false));
  }, [gameFilter, styleFilter]);

  const totalPaginas = Math.ceil(players.length / POR_PAGINA);
  const playersPagina = players.slice(
    (pagina - 1) * POR_PAGINA,
    pagina * POR_PAGINA
  );

  function limparFiltros() {
    setGameFilter("");
    setStyleFilter("");
  }

  return (
    <div className="players-page">
      <Header />
      <main className="players-main">

        <div className="players-hero">
          <h1 className="players-title">
            Encontre seu <span className="players-title-accent">parceiro</span>
          </h1>
          <p className="players-subtitle">
            {loading
              ? "Buscando jogadores..."
              : `${players.length} jogador${players.length !== 1 ? "es" : ""} disponível${players.length !== 1 ? "is" : ""}`}
          </p>
        </div>

        <div className="players-filters">
          <select
            className="players-filter-select"
            value={gameFilter}
            onChange={(e) => setGameFilter(e.target.value)}
          >
            <option value="">🎮 Todos os jogos</option>
            {games.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>

          <select
            className="players-filter-select"
            value={styleFilter}
            onChange={(e) => setStyleFilter(e.target.value)}
          >
            <option value="">⚔️ Todos os estilos</option>
            <option value="competitive">Competitivo</option>
            <option value="casual">Casual</option>
          </select>

          {(gameFilter || styleFilter) && (
            <button className="players-filter-clear" onClick={limparFiltros}>
              ✕ Limpar filtros
            </button>
          )}
        </div>

        {loading && (
          <div className="players-loading">
            <span className="players-loading-spinner" />
            Buscando jogadores...
          </div>
        )}

        {!loading && erro && (
          <div className="players-error">
            ⚠️ {erro}
          </div>
        )}

        {!loading && !erro && players.length === 0 && (
          <div className="players-empty">
            <span className="players-empty-icon">🔍</span>
            <p className="players-empty-title">Nenhum jogador encontrado</p>
            <p className="players-empty-sub">Tente ajustar os filtros ou volte mais tarde.</p>
            <button className="players-empty-btn" onClick={limparFiltros}>Limpar filtros</button>
          </div>
        )}

        {!loading && !erro && playersPagina.length > 0 && (
          <>
            <div className="players-grid">
              {playersPagina.map((player) => (
                <PlayerCard
                  key={`${player.id}-${player.game_name}`}
                  player={player}
                />
              ))}
            </div>

            {totalPaginas > 1 && (
              <div className="players-pagination">
                <button
                  className="players-page-btn"
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  disabled={pagina === 1}
                >
                  ← Anterior
                </button>
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    className={`players-page-btn ${n === pagina ? "players-page-btn--active" : ""}`}
                    onClick={() => setPagina(n)}
                  >
                    {n}
                  </button>
                ))}
                <button
                  className="players-page-btn"
                  onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                  disabled={pagina === totalPaginas}
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