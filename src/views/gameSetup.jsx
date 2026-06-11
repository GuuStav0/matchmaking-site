import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../models/authContext.jsx";
import Header from "../assets/actions/header.jsx";
import Footer from "../assets/actions/footer.jsx";
import "../assets/css/gameSetup.css";

// Extrai o array de ranks a partir do campo ranks_tags do banco ("Bronze,Prata,Ouro")
function getRanks(game) {
  if (!game?.ranks_tags) return [];
  return game.ranks_tags
    .split(",")
    .map((r) => r.trim())
    .filter(Boolean);
}

export default function GameSetup() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Catálogo de jogos da API
  const [games, setGames] = useState([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [erroApi, setErroApi] = useState(null);

  // Jogos já vinculados ao perfil do usuário
  const [userGames, setUserGames] = useState([]);
  const [loadingUserGames, setLoadingUserGames] = useState(true);

  // Formulário
  const [selectedGame, setSelectedGame] = useState(null);
  const [gameStyle, setGameStyle] = useState("");
  const [gameRank, setGameRank] = useState("");
  const [isEditing, setIsEditing] = useState(false); // true = modo edição, false = novo
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState(null); // { type: 'success'|'error', text }

  // ── Carrega catálogo de jogos ─────────────────────────────────────────────
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

  // ── Carrega jogos já vinculados ao perfil ─────────────────────────────────
  const fetchUserGames = useCallback(async () => {
    if (!user?.id) return;
    setLoadingUserGames(true);
    try {
      const res = await fetch(`http://localhost:3000/api/players/${user.id}`);
      const result = await res.json();
      if (res.ok && result.status === "sucesso") {
        setUserGames(result.dados?.games || []);
      }
    } catch (err) {
      console.error("Erro ao carregar jogos do usuário:", err);
    } finally {
      setLoadingUserGames(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchUserGames();
  }, [fetchUserGames]);

  // ── Exibe feedback temporário ─────────────────────────────────────────────
  function showFeedback(type, text) {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 3500);
  }

  // ── Seleciona um jogo do catálogo ─────────────────────────────────────────
  // Se já estiver vinculado, entra em modo edição pré-preenchido
  function handleSelectGame(game) {
    const vinculado = userGames.find((ug) => ug.game_name === game.name);

    if (vinculado) {
      setIsEditing(true);
      setGameStyle(vinculado.game_style || "");
      setGameRank(vinculado.game_rank || "");
    } else {
      setIsEditing(false);
      setGameStyle("");
      setGameRank("");
    }

    setSelectedGame(game);
    setErrors({});
  }

  function validate() {
    const e = {};
    if (!selectedGame) e.game = "Selecione um jogo";
    if (!gameStyle) e.style = "Selecione seu estilo de jogo";
    const gameRanks = getRanks(selectedGame);
    if (gameRanks.length > 0 && !gameRank) e.rank = "Selecione seu rank";
    return e;
  }

  // ── Salva: se for edição faz DELETE + POST (upsert), senão só POST ────────
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
      // Se estiver editando, remove o vínculo antigo primeiro
      if (isEditing) {
        const delRes = await fetch("http://localhost:3000/api/user-games", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profile_id: user?.id,
            game_id: selectedGame.id,
          }),
        });
        const delResult = await delRes.json();
        if (!delRes.ok || delResult.status === "erro") {
          throw new Error(delResult.mensagem || "Erro ao atualizar jogo.");
        }
      }

      // Cria o novo vínculo
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

      showFeedback(
        "success",
        isEditing
          ? `✅ ${selectedGame.name} atualizado com sucesso!`
          : `✅ ${selectedGame.name} adicionado com sucesso!`,
      );

      // Recarrega a lista e limpa o formulário
      await fetchUserGames();
      setSelectedGame(null);
      setGameStyle("");
      setGameRank("");
      setIsEditing(false);
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setLoading(false);
    }
  }

  // ── Deleta vínculo diretamente da lista ───────────────────────────────────
  async function handleDelete(gameName, gameId) {
    if (!window.confirm(`Remover ${gameName} do seu perfil?`)) return;
    setDeletingId(gameId);

    try {
      const res = await fetch("http://localhost:3000/api/user-games", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_id: user?.id, game_id: gameId }),
      });
      const result = await res.json();
      if (!res.ok || result.status === "erro") {
        throw new Error(result.mensagem || "Erro ao remover jogo.");
      }

      showFeedback("success", `🗑️ ${gameName} removido do perfil.`);

      // Se o jogo removido estava selecionado, limpa o formulário
      if (selectedGame?.name === gameName) {
        setSelectedGame(null);
        setGameStyle("");
        setGameRank("");
        setIsEditing(false);
      }

      await fetchUserGames();
    } catch (err) {
      showFeedback("error", err.message);
    } finally {
      setDeletingId(null);
    }
  }

  const ranks = getRanks(selectedGame);

  // Verifica se um jogo do catálogo já está vinculado
  function isLinked(game) {
    return userGames.some((ug) => ug.game_name === game.name);
  }

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

          {/* Feedback global */}
          {feedbackMsg && (
            <div className={`gs-feedback gs-feedback--${feedbackMsg.type}`}>
              {feedbackMsg.text}
            </div>
          )}

          {/* ── Jogos já vinculados ao perfil ── */}
          {!loadingUserGames && userGames.length > 0 && (
            <div className="gs-linked">
              <p className="gs-linked__label">Seus jogos cadastrados</p>
              <div className="gs-linked__list">
                {userGames.map((ug, i) => {
                  // Busca o objeto do jogo no catálogo para ter o ID
                  const catalogGame = games.find((g) => g.name === ug.game_name);
                  const isBeingDeleted = deletingId === catalogGame?.id;
                  const isSelected = selectedGame?.name === ug.game_name;

                  return (
                    <div
                      key={i}
                      className={`gs-linked__item ${isSelected ? "gs-linked__item--selected" : ""}`}
                    >
                      {catalogGame?.image_url && (
                        <img
                          src={catalogGame.image_url}
                          alt={ug.game_name}
                          className="gs-linked__img"
                        />
                      )}
                      <span className="gs-linked__name">{ug.game_name}</span>
                      <span className={`gs-style-badge gs-style-badge--${ug.game_style}`}>
                        {ug.game_style === "competitive" ? "Competitivo" : "Casual"}
                      </span>
                      <span className="gs-rank-badge">{ug.game_rank}</span>

                      <div className="gs-linked__actions">
                        {/* Botão editar */}
                        {catalogGame && (
                          <button
                            type="button"
                            className="gs-linked__edit-btn"
                            title="Editar"
                            onClick={() => handleSelectGame(catalogGame)}
                            disabled={isBeingDeleted}
                          >
                            ✏️
                          </button>
                        )}
                        {/* Botão deletar — só aparece se o jogo existir no catálogo */}
                        {catalogGame && (
                          <button
                            type="button"
                            className="gs-linked__delete-btn"
                            title="Remover jogo"
                            onClick={() => handleDelete(ug.game_name, catalogGame.id)}
                            disabled={isBeingDeleted}
                          >
                            {isBeingDeleted ? "..." : "🗑️"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <form className="gs-form" onSubmit={handleSubmit}>

            {/* ── Seleção de jogo ── */}
            <div className="field-block">
              <label className="gs-label">
                {isEditing ? `Editando: ${selectedGame?.name}` : "Escolha o jogo"}
              </label>
              {loadingGames ? (
                <div className="gs-loading">Carregando jogos...</div>
              ) : erroApi ? (
                <div className="gs-api-error">⚠️ {erroApi}</div>
              ) : (
                <div className="gs-games-grid">
                  {games.map((game) => {
                    const linked = isLinked(game);
                    const isSelected = selectedGame?.id === game.id;
                    return (
                      <button
                        key={game.id}
                        type="button"
                        className={[
                          "gs-game-btn",
                          isSelected ? "gs-game-btn--active" : "",
                          linked ? "gs-game-btn--linked" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        onClick={() => handleSelectGame(game)}
                        title={linked ? `${game.name} (já cadastrado — clique para editar)` : game.name}
                      >
                        {game.image_url ? (
                          <img src={game.image_url} alt={game.name} className="gs-game-img" />
                        ) : (
                          <div className="gs-game-img-placeholder">🎮</div>
                        )}
                        <span className="gs-game-name">{game.name}</span>
                        {linked && <span className="gs-game-linked-badge">✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}
              {errors.game && <span className="gs-error">{errors.game}</span>}
            </div>

            {/* ── Estilo de jogo ── */}
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

            {/* ── Rank ── */}
            {selectedGame && gameStyle && (
              <div className="field-block">
                <label className="gs-label">Rank atual em {selectedGame.name}</label>
                {ranks.length === 0 ? (
                  <p className="gs-no-ranks">
                    ⚠️ Este jogo não tem ranks cadastrados no sistema.
                  </p>
                ) : (
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
                )}
                {errors.rank && <span className="gs-error">{errors.rank}</span>}
              </div>
            )}

            {errors.submit && (
              <div className="gs-submit-error">{errors.submit}</div>
            )}

            <div className="gs-actions">
              {selectedGame && (
                <button
                  type="button"
                  className="gs-cancel-btn"
                  onClick={() => {
                    setSelectedGame(null);
                    setGameStyle("");
                    setGameRank("");
                    setIsEditing(false);
                    setErrors({});
                  }}
                >
                  Cancelar
                </button>
              )}

              <button
                type="submit"
                className="gs-submit-btn"
                disabled={loading || !selectedGame}
              >
                {loading ? (
                  <><span className="gs-spinner" /> Salvando...</>
                ) : isEditing ? (
                  "Salvar edição"
                ) : (
                  "Adicionar jogo"
                )}
              </button>

              <button
                type="button"
                className="gs-skip-btn"
                onClick={() => navigate("/games")}
              >
                {userGames.length > 0 ? "Concluir" : "Pular por agora →"}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}