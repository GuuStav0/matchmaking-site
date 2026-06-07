import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../assets/actions/header.jsx";
import Footer from "../assets/actions/footer.jsx";
import "../assets/css/games.css";

const GENRES = [
  "Todos",
  "FPS",
  "MOBA",
  "Battle Royale",
  "RPG",
  "Esporte",
  "MMORPG",
  "Survival",
  "Sandbox",
  "Luta",
  "Auto Chess",
];

// ─── GAME CARD ────────────────────────────────────────────────────────────────
function GameCard({ game, index }) {
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60 + index * 45);
    return () => clearTimeout(t);
  }, [index]);

  const handleCardClick = () => {
    navigate(`/rooms/${game.id}`);
  };

  const totalSalas =
    game.rooms_count !== undefined ? game.rooms_count : game.rooms || 0;

  const imagemCapa = game.cover_url || game.image_url || game.cover;

  return (
    <div
      className={`game-card ${visible ? "game-card--visible" : ""} ${hovered ? "game-card--hovered" : ""}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleCardClick}
      style={{ cursor: "pointer" }}
    >
      <div className="game-card__cover-wrap">
        <img
          src={imagemCapa}
          alt={game.name}
          className="game-card__cover"
          loading="lazy"
        />
        <div className="game-card__overlay">
          <button className="game-card__cta" onClick={handleCardClick}>
            Ver salas
          </button>
        </div>
        <span className="game-card__genre-badge">
          {game.genre || game.genre_name || "Gênero"}
        </span>
      </div>

      <div className="game-card__info">
        <h3 className="game-card__name">{game.name}</h3>
        <div className="game-card__rooms">
          <span className="game-card__rooms-dot" />
          <span className="game-card__rooms-count">
            {totalSalas.toLocaleString("pt-BR")}
          </span>
          <span className="game-card__rooms-label">
            {totalSalas === 1 ? "sala aberta" : "salas abertas"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function GamesDirectory() {
  const [games, setGames] = useState([]); // Estado para armazenar os jogos vindos da API
  const [search, setSearch] = useState("");
  const [activeGenre, setActiveGenre] = useState("Todos");
  const [sortBy, setSortBy] = useState("rooms"); // "rooms" | "name"
  const [loadingReal, setLoadingReal] = useState(true); // Estado de carregamento da requisição
  const [erroApi, setErroApi] = useState(null);

  // EFFECT PARA COLETAR OS JOGOS DA API ASSIM QUE ENTRAR NA TELA
  useEffect(() => {
    async function carregarJogos() {
      try {
        setLoadingReal(true);
        // Altere a URL abaixo caso o servidor use outra porta ou rota
        // Dentro do seu games.jsx (Frontend)
        const resposta = await fetch("http://localhost:3000/api/games");

        if (!resposta.ok) {
          throw new Error("Não foi possível carregar a lista de jogos.");
        }

        const dados = await resposta.json();
        setGames(dados);
      } catch (error) {
        console.error("Erro ao buscar jogos da API:", error);
        setErroApi(error.message);
      } finally {
        setLoadingReal(false);
      }
    }

    carregarJogos();
  }, []);

  // Filtros aplicados sobre a lista dinâmica que veio da API
  const filtered = games
    .filter((g) => {
      const matchSearch = g.name.toLowerCase().includes(search.toLowerCase());
      const matchGenre = activeGenre === "Todos" || g.genre === activeGenre;
      return matchSearch && matchGenre;
    })
    .sort((a, b) => {
      // Garante a ordenação por 'rooms_count'
      const salasA = a.rooms_count !== undefined ? a.rooms_count : a.rooms || 0;
      const salasB = b.rooms_count !== undefined ? b.rooms_count : b.rooms || 0;
      return sortBy === "rooms"
        ? salasB - salasA
        : a.name.localeCompare(b.name);
    });

  const totalRooms = filtered.reduce(
    (acc, g) =>
      acc + (g.rooms_count !== undefined ? g.rooms_count : g.rooms || 0),
    0,
  );
  const totalSalasGerais = games.reduce(
    (acc, g) =>
      acc + (g.rooms_count !== undefined ? g.rooms_count : g.rooms || 0),
    0,
  );

  return (
    <div className="dir-page">
      <Header />

      <main className="dir-main">
        {/* ── Hero strip ── */}
        <section className="dir-hero">
          <div className="dir-hero__inner">
            <div className="dir-hero__text">
              <h1 className="dir-hero__title">
                Escolha seu <span className="dir-hero__title-accent">jogo</span>
              </h1>
              <p className="dir-hero__sub">
                {games.length}{" "}
                {games.length === 1 ? "jogo disponível" : "jogos disponíveis"} ·{" "}
                <strong>{totalSalasGerais.toLocaleString("pt-BR")}</strong>{" "}
                salas abertas agora
              </p>
            </div>
          </div>
          <div className="dir-hero__glow" />
        </section>

        {/* ── Controls ── */}
        <section className="dir-controls">
          <div className="dir-controls__inner">
            {/* Search */}
            <div className="dir-search">
              <svg
                className="dir-search__icon"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="dir-search__input"
                placeholder="Buscar jogo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  className="dir-search__clear"
                  onClick={() => setSearch("")}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sort */}
            <div className="dir-sort">
              <span className="dir-sort__label">Ordenar:</span>
              <button
                className={`dir-sort__btn ${sortBy === "rooms" ? "dir-sort__btn--active" : ""}`}
                onClick={() => setSortBy("rooms")}
              >
                Mais salas
              </button>
              <button
                className={`dir-sort__btn ${sortBy === "name" ? "dir-sort__btn--active" : ""}`}
                onClick={() => setSortBy("name")}
              >
                A–Z
              </button>
            </div>
          </div>

          {/* Genre pills */}
          <div className="dir-genres">
            {GENRES.map((g) => (
              <button
                key={g}
                className={`dir-genre-pill ${activeGenre === g ? "dir-genre-pill--active" : ""}`}
                onClick={() => setActiveGenre(g)}
              >
                {g}
              </button>
            ))}
          </div>
        </section>

        {/* ── Results meta ── */}
        <div className="dir-meta">
          <span className="dir-meta__count">
            {filtered.length} {filtered.length === 1 ? "jogo" : "jogos"}
            {activeGenre !== "Todos" && (
              <>
                {" "}
                em <strong>{activeGenre}</strong>
              </>
            )}
            {search && (
              <>
                {" "}
                para "<strong>{search}</strong>"
              </>
            )}
          </span>
          <span className="dir-meta__rooms">
            {totalRooms.toLocaleString("pt-BR")} salas no total
          </span>
        </div>

        {/* ── Grid / Loading States ── */}
        {loadingReal ? (
          <div className="dir-empty">
            <div className="loading-spinner-jogos">⏳</div>
            <p className="dir-empty__title">Carregando diretório...</p>
            <p className="dir-empty__sub">
              Buscando a lista de jogos atualizada no servidor.
            </p>
          </div>
        ) : erroApi ? (
          <div className="dir-empty">
            <div className="dir-empty__icon">⚠️</div>
            <p className="dir-empty__title">Erro de conexão</p>
            <p className="dir-empty__sub">{erroApi}</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="dir-grid">
            {filtered.map((game, i) => (
              <GameCard key={game.id} game={game} index={i} />
            ))}
          </div>
        ) : (
          <div className="dir-empty">
            <div className="dir-empty__icon">🎮</div>
            <p className="dir-empty__title">Nenhum jogo encontrado</p>
            <p className="dir-empty__sub">
              Tente um termo diferente ou limpe os filtros.
            </p>
            <button
              className="dir-empty__btn"
              onClick={() => {
                setSearch("");
                setActiveGenre("Todos");
              }}
            >
              Limpar filtros
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
