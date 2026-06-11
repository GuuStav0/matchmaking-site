import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../assets/actions/header.jsx";
import Footer from "../assets/actions/footer.jsx";
import { useAuth } from "../models/authContext.jsx";
import "../assets/css/createRoom.css";

export default function CreateRoom() {
  const navigate = useNavigate();
  const { gameId } = useParams();
  const { user } = useAuth();

  // Estados de controle da API
  const [jogo, setJogo] = useState(null);
  const [availableRanks, setAvailableRanks] = useState([]);
  const [loadingJogo, setLoadingJogo] = useState(true);
  const [sending, setSending] = useState(false);
  const [erro, setErro] = useState("");

  // Estado para o input temporário de tags textuais
  const [tagInput, setTagInput] = useState("");
  const [tagsArray, setTagsArray] = useState([]);

  // Estado do Formulário
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    max_slots: 4,
    game_style: "Casual",
    rank_min: "Livre",
    rank_max: "Livre",
    raw_time: "19:00",
    language: "Português",
    mic_required: 1,
  });

  // 1. Carrega o jogo e sincroniza os elos utilizando a rota específica por ID
  useEffect(() => {
    if (!gameId) return;

    setLoadingJogo(true);
    fetch(`http://localhost:3000/api/games`) // Puxa a lista
      .then((res) => res.json())
      .then((listaJogos) => {
        console.log("Jogos carregados no client:", listaJogos);

        // Localiza o jogo atual comparando com o ID da URL
        const jogoAtual = listaJogos.find((g) => g.id === parseInt(gameId));

        if (jogoAtual) {
          console.log("Jogo atual localizado com sucesso:", jogoAtual);
          setJogo(jogoAtual);

          if (jogoAtual.ranks_tags && jogoAtual.ranks_tags.trim() !== "") {
            // Divide a string separada por vírgulas em um array limpo
            const elos = jogoAtual.ranks_tags
              .split(",")
              .map((r) => r.trim())
              .filter(Boolean);

            setAvailableRanks(elos);

            // Pré-seleciona os valores iniciais
            setFormData((prev) => ({
              ...prev,
              rank_min: elos[0] || "Livre",
              rank_max: elos[elos.length - 1] || "Livre",
            }));
          } else {
            console.log(
              "Atenção: 'ranks_tags' veio vazio ou nulo para este jogo no Banco.",
            );
            setAvailableRanks([]);
          }
        } else {
          setErro("O jogo com o ID especificado na URL não foi encontrado.");
        }
        setLoadingJogo(false);
      })
      .catch((err) => {
        console.error("Erro ao puxar elos do jogo:", err);
        setErro("Não foi possível carregar as informações e elos deste jogo.");
        setLoadingJogo(false);
      });
  }, [gameId]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseInt(value) : value,
    }));
  };

  // 2. Lógica de Tags interativas (Espaço, Vírgula ou Enter)
  const handleTagKeyDown = (e) => {
    if (e.key === " " || e.key === "," || e.key === "Enter") {
      e.preventDefault();
      const limpaTag = tagInput.replace(",", "").trim();

      if (limpaTag && !tagsArray.includes(limpaTag)) {
        setTagsArray([...tagsArray, limpaTag]);
      }
      setTagInput("");
    }
  };

  const removeTag = (indexToRemove) => {
    setTagsArray(tagsArray.filter((_, index) => index !== indexToRemove));
  };

  // 3. Lógica do Horário semântico com ícone
  const formatarHorarioComPeriodo = (horaStr) => {
    if (!horaStr) return "-";
    const [horas] = horaStr.split(":").map(Number);

    let periodo = "Diurno";
    if (horas >= 5 && horas < 12) {
      periodo = "Matutino";
    } else if (horas >= 12 && horas < 18) {
      periodo = "Diurno";
    } else {
      periodo = "Noturno";
    }

    return `🕒 ${periodo} (${horaStr})`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setErro("");

    const tagsPayloadString = tagsArray.join(", ");
    const scheduleFormatted = formatarHorarioComPeriodo(formData.raw_time);

    const payload = {
      game_id: parseInt(gameId),
      creator_id: user?.id || 1,
      name: formData.name,
      bio: formData.bio,
      max_slots: formData.max_slots,
      game_style: formData.game_style,
      rank_min: formData.rank_min,
      rank_max: formData.rank_max,
      schedule: scheduleFormatted,
      language: formData.language,
      mic_required: formData.mic_required,
      tags: tagsPayloadString,
    };

    try {
      const response = await fetch("http://localhost:3000/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.mensagem || "Erro ao publicar dados da sala.");
      }

      navigate(`/rooms/${gameId}`);
    } catch (err) {
      setErro(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="create-room-page">
      <Header />
      <div className="bg-fx-layer">
        <div className="bg-blur-top" />
        <div className="bg-blur-bottom" />
        <svg className="bg-grid-svg" width="100%" height="100%">
          <defs>
            <pattern
              id="gr"
              width="48"
              height="48"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 48 0 L 0 0 0 48"
                fill="none"
                stroke="white"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#gr)" />
        </svg>

        {/* Ícones Decorativos Flutuantes */}
        {[
          { top: "15%", left: "6%", size: 40, delay: "0s", icon: "🎮" },
          { top: "70%", left: "4%", size: 32, delay: "1.2s", icon: "⚔️" },
          { top: "25%", right: "5%", size: 36, delay: "0.6s", icon: "🏆" },
          { top: "75%", right: "7%", size: 30, delay: "1.8s", icon: "🎯" },
        ].map((d, i) => (
          <div
            key={i}
            className="floating-icon"
            style={{
              top: d.top,
              left: d.left,
              right: d.right,
              fontSize: d.size,
              animation: `float 4s ease-in-out ${d.delay} infinite`,
            }}
          >
            {d.icon}
          </div>
        ))}
      </div>
      <main className="create-room-main">
        <div className="form-container-box">
          {loadingJogo ? (
            <div className="form-loading-state">
              Carregando catálogo de elos do jogo...
            </div>
          ) : (
            <>
              <h1 className="form-title">
                Criar Sala:{" "}
              </h1>
              <h2 className="form-title title-accent">{jogo?.name || "Jogo"}</h2>
              <p className="form-subtitle">
                Configure as tags de entrada e restrições de elo do seu grupo.
              </p>

              {erro && <div className="form-error-alert">⚠️ {erro}</div>}

              <form onSubmit={handleSubmit} className="room-form-element">
                {/* Título */}
                <div className="form-group-full">
                  <label>Título Chamativo da Sala *</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Ex: Duo Rumo ao Imortal / Squad Completo"
                    value={formData.name}
                    onChange={handleChange}
                    maxLength={80}
                    required
                  />
                </div>

                {/* Descrição / Bio */}
                <div className="form-group-full">
                  <label>Descrição do Grupo (Bio) *</label>
                  <textarea
                    name="bio"
                    placeholder="Quais os objetivos da sala? Deixe claro o nível técnico ou os horários fixos..."
                    value={formData.bio}
                    onChange={handleChange}
                    rows={3}
                    required
                  />
                </div>

                {/* Slots e Estilo */}
                <div className="form-row-grid">
                  <div>
                    <label>Vagas Máximas (Slots)</label>
                    <input
                      type="number"
                      name="max_slots"
                      min={1}
                      max={20}
                      value={formData.max_slots}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <label>Estilo de Jogo</label>
                    <select
                      name="game_style"
                      value={formData.game_style}
                      onChange={handleChange}
                    >
                      <option value="Casual">Casual</option>
                      <option value="Competitivo">Competitivo</option>
                    </select>
                  </div>
                </div>

                {/* Elos Mínimo e Máximo Corrigidos */}
                <div className="form-row-grid">
                  <div>
                    <label>Elo Mínimo Requerido</label>
                    <select
                      name="rank_min"
                      value={formData.rank_min}
                      onChange={handleChange}
                    >
                      <option value="Livre">Livre</option>
                      {availableRanks.map((rank) => (
                        <option key={rank} value={rank}>
                          {rank}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label>Elo Máximo Limite</label>
                    <select
                      name="rank_max"
                      value={formData.rank_max}
                      onChange={handleChange}
                    >
                      <option value="Livre">Livre</option>
                      {availableRanks.map((rank) => (
                        <option key={rank} value={rank}>
                          {rank}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Horário (Time Input) e Idioma */}
                <div className="form-row-grid">
                  <div>
                    <label>Horário de Início das Partidas</label>
                    <input
                      type="time"
                      name="raw_time"
                      value={formData.raw_time}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <label>Idioma da Comunicação</label>
                    <input
                      type="text"
                      name="language"
                      value={formData.language}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Microfone */}
                <div className="form-row-grid">
                  <div>
                    <label>Exigir Microfone / Call?</label>
                    <select
                      name="mic_required"
                      value={formData.mic_required}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          mic_required: parseInt(e.target.value),
                        })
                      }
                    >
                      <option value={1}>Sim, obrigatório fone/mic</option>
                      <option value={0}>
                        Não, aceito comunicação via chat
                      </option>
                    </select>
                  </div>
                </div>

                {/* Campo Avançado de Tags interativas */}
                <div className="form-group-full">
                  <label>
                    Tags da sala (Aperte Espaço ou Vírgula para adicionar)
                  </label>
                  <div className="tags-input-container">
                    {tagsArray.map((tag, index) => (
                      <span key={index} className="interactive-tag-badge">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(index)}
                          className="tag-remove-btn"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      placeholder={
                        tagsArray.length === 0
                          ? "Ex: Discord Tryhard SemToxidade"
                          : ""
                      }
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      className="tag-sub-input"
                    />
                  </div>
                </div>

                {/* Ações */}
                <div className="form-actions-wrapper">
                  <button
                    type="button"
                    className="btn-cancel-room"
                    onClick={() => navigate(`/rooms/${gameId}`)}
                    disabled={sending}
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="btn-submit-room"
                    disabled={sending}
                  >
                    {sending ? "Publicando..." : "Criar Sala ⚡"}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
