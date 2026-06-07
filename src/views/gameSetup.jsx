import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../models/authContext.jsx";
import Header from "../assets/actions/header.jsx";
import Footer from "../assets/actions/footer.jsx";
import "../assets/css/gameSetup.css";

const RANKS = {
  valorant: ["Ferro", "Bronze", "Prata", "Ouro", "Platina", "Diamante", "Ascendente", "Imortal", "Radiante"],
  lol:      ["Ferro", "Bronze", "Prata", "Ouro", "Platina", "Esmeralda", "Diamante", "Mestre", "Grão-Mestre", "Desafiante"],
  cs2:      ["Prata", "Ouro Nova", "Mestre Guardião", "Águia", "Supremo", "Global Elite"],
  default:  ["Iniciante", "Bronze", "Prata", "Ouro", "Platina", "Diamante", "Elite"],
};

function getRanks(gameName) {
  if (!gameName) return RANKS.default;
  const lower = gameName.toLowerCase();
  if (lower.includes("valorant")) return RANKS.valorant;
  if (lower.includes("league") || lower.includes("legends") || lower.includes("lol")) return RANKS.lol;
  if (lower.includes("cs") || lower.includes("counter")) return RANKS.cs2;
  return RANKS.default;
}

export default function GameSetup() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [games, setGames] = useState([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [erroApi, setErroApi] = useState(null);

  const [selectedGame, setSelectedGame] = useState(null);
  const [gameStyle, setGameStyle] = useState("");
  const [gameRank, setGameRank] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [linkedGames, setLinkedGames] = useState([]);

  useEffect(() => {
    async function fetchGames() {
      try {
        const res = await fetch("http://localhost:3000/api/games");
        if (!res.ok) throw new Error("Não foi possível carregar os jogos.");
        const data = await res.json();
        setGames(data);
      } catch (err) {
        setErroApi(err.message);
      } finally {
        setLoadingGames(false);
      }
    }
    fetchGames();
  }, []);

  function handleSelectGame(game) {
    setSelectedGame(game);
    setGameStyle("");
    setGameRank("");
    setErrors({});
  }

  function validate() {
    const e = {};
    if (!selectedGame) e.game = "Selecione um jogo";
    if (!gameStyle) e.style = "Selecione seu estilo de jogo";
    if (!gameRank) e.rank = "Selecione seu rank";
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      const response = await fetch("http://localhost:3000/api/user-games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile_id: user?.id,
          game_id: selectedGame.id,
          game_style: gameStyle,
          game_rank: gameRank,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.status === "erro") {
        throw new Error(result.mensagem || "Erro ao vincular jogo.");
      }

      setLinkedGames((prev) => [...prev, { ...selectedGame, gameStyle, gameRank }]);
      setSelectedGame(null);
      setGameStyle("");
      setGameRank("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setLoading(false);
    }
  }

  const ranks = getRanks(selectedGame?.name);

  return (
    <div className="gs-page">
      <Header />

      <main className="gs-main">
        <div className="gs-card">

          {/* Header */}
          <div className="gs-card__header">
            <div className="gs-logo">
              <div className="gs-badge">🎮</div>
              <span className="gs-logo-text">
                Match<span className="gs-logo-accent">up</span>
              </span>
            </div>
            <h1 className="gs-title">Seus jogos</h1>
            <p className="gs-subtitle">
              Adicione os jogos que você joga, seu estilo e rank atual.
            </p>
          </div>

          {/* Jogos já vinculados */}
          {linkedGames.length > 0 && (
            <div className="gs-linked">
              <p className="gs-linked__label">Jogos adicionados nesta sessão</p>
              <div className="gs-linked__list">
                {linkedGames.map((g, i) => (
                  <div key={i} className="gs-linked__item">
                    <span className="gs-linked__name">{g.name}</span>
                    <span className={`gs-style-badge gs-style-badge--${g.gameStyle}`}>
                      {g.gameStyle === "competitive" ? "Competitivo" : "Casual"}
                    </span>
                    <span className="gs-rank-badge">{g.gameRank}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <form className="gs-form" onSubmit={handleSubmit}>

            {/* SELEÇÃO DE JOGO */}
            <div className="field-block">
              <label className="gs-label">Escolha o jogo</label>
              {loadingGames ? (
                <div className="gs-loading">Carregando jogos...</div>
              ) : erroApi ? (
                <div className="gs-api-error">⚠️ {erroApi}</div>
              ) : (
                <div className="gs-games-grid">
                  {games.map((game) => (
                    <button
                      key={game.id}
                      type="button"
                      className={`gs-game-btn ${selectedGame?.id === game.id ? "gs-game-btn--active" : ""}`}
                      onClick={() => handleSelectGame(game)}
                    >
                      {game.image_url ? (
                        <img src={game.image_url} alt={game.name} className="gs-game-img" />
                      ) : (
                        <div className="gs-game-img-placeholder">🎮</div>
                      )}
                      <span className="gs-game-name">{game.name}</span>
                    </button>
                  ))}
                </div>
              )}
              {errors.game && <span className="gs-error">{errors.game}</span>}
            </div>

            {/* ESTILO DE JOGO */}
            {selectedGame && (
              <div className="field-block">
                <label className="gs-label">Estilo de jogo</label>
                <div className="gs-style-row">
                  <button
                    type="button"
                    className={`gs-style-btn ${gameStyle === "casual" ? "gs-style-btn--casual" : ""}`}
                    onClick={() => setGameStyle("casual")}
                  >
                    <span className="gs-style-icon">🎲</span>
                    <div>
                      <div className="gs-style-name">Casual</div>
                      <div className="gs-style-desc">Jogo por diversão, sem pressão</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    className={`gs-style-btn ${gameStyle === "competitive" ? "gs-style-btn--competitive" : ""}`}
                    onClick={() => setGameStyle("competitive")}
                  >
                    <span className="gs-style-icon">🏆</span>
                    <div>
                      <div className="gs-style-name">Competitivo</div>
                      <div className="gs-style-desc">Foco em ranking e evolução</div>
                    </div>
                  </button>
                </div>
                {errors.style && <span className="gs-error">{errors.style}</span>}
              </div>
            )}

            {/* RANK */}
            {selectedGame && gameStyle && (
              <div className="field-block">
                <label className="gs-label">Rank atual em {selectedGame.name}</label>
                <div className="gs-ranks-grid">
                  {ranks.map((rank) => (
                    <button
                      key={rank}
                      type="button"
                      className={`gs-rank-btn ${gameRank === rank ? "gs-rank-btn--active" : ""}`}
                      onClick={() => setGameRank(rank)}
                    >
                      {rank}
                    </button>
                  ))}
                </div>
                {errors.rank && <span className="gs-error">{errors.rank}</span>}
              </div>
            )}

            {errors.submit && (
              <div className="gs-submit-error">{errors.submit}</div>
            )}

            {success && (
              <div className="gs-success-msg">✅ Jogo vinculado com sucesso!</div>
            )}

            <div className="gs-actions">
              <button
                type="submit"
                className="gs-submit-btn"
                disabled={loading || !selectedGame}
              >
                {loading ? (
                  <><span className="gs-spinner" /> Salvando...</>
                ) : (
                  "Adicionar jogo"
                )}
              </button>
              <button
                type="button"
                className="gs-skip-btn"
                onClick={() => navigate("/games")}
              >
                {linkedGames.length > 0 ? "Concluir" : "Pular por agora →"}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}