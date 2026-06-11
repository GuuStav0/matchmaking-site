import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../models/authContext.jsx";
import { Popup } from "../assets/actions/PopUp.jsx";
import Header from "../assets/actions/header.jsx";
import Footer from "../assets/actions/footer.jsx";
import "../assets/css/rooms.css";

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
// Substituir por: GET /api/games/:gameId/groups
// Cada grupo retorna os campos abaixo (mapeados da tabela groups + group_members)

const STYLE_FILTERS = ["Todos", "Competitivo", "Casual"];
const SLOT_FILTERS = ["Todos", "Com vaga", "Quase cheio"];

// ─── SLOT BAR ─────────────────────────────────────────────────────────────────
function SlotBar({ members, slots }) {
  const pct = (members / slots) * 100;
  const full = members === slots;
  const color = full ? "#ef4444" : pct >= 80 ? "#f59e0b" : "#22c55e";
  return (
    <div className="slot-bar-wrap">
      <div className="slot-bar-track">
        <div
          className="slot-bar-fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="slot-text" style={{ color }}>
        {members}
        <span className="slot-sep">/</span>
        {slots}
      </span>
    </div>
  );
}

// ─── ROOM CARD ────────────────────────────────────────────────────────────────
function RoomCard({ room, onClick, active, isUserRoom }) {
  const full = room.members === room.slots;
  return (
    <div
      className={`room-card ${active ? "room-card--active" : ""} ${full ? "room-card--full" : ""}`}
      onClick={() => !full && onClick(room)}
    >
      <div className="room-card__top">
        <div className="room-card__left">
          <div className="room-card__owner-row">
            <div className="room-card__avatar">
              {room.owner &&
              typeof room.owner === "string" &&
              room.owner.length > 0
                ? room.owner[0].toUpperCase()
                : "?"}
            </div>
            <div>
              <div className="room-card__owner">{room.owner}</div>
              <div className="room-card__time">{room.created_at}</div>
            </div>
          </div>
          <h3 className="room-card__name">
            {room.name}
            {isUserRoom && (
              <span className="room-card__yours-badge">📍 Sua sala</span>
            )}
          </h3>
          <div className="room-card__tags">
            <span
              className={`room-card__style-badge room-card__style-badge--${room.style === "Competitivo" ? "comp" : "casual"}`}
            >
              {room.style === "Competitivo" ? "⚔️" : "🎮"} {room.style}
            </span>
            {room.mic_required && (
              <span className="room-card__mic-badge">🎙️ Mic</span>
            )}
            {full && <span className="room-card__full-badge">Sala cheia</span>}
          </div>
        </div>

        <div className="room-card__right">
          <SlotBar members={room.members} slots={room.slots} />
          <div className="room-card__schedule">🕐 {room.schedule}</div>
          {!full && (
            <button
              className="room-card__btn"
              onClick={(e) => {
                e.stopPropagation();
                onClick(room);
              }}
            >
              Ver detalhes
            </button>
          )}
        </div>
      </div>

      <p className="room-card__desc">{room.description.slice(0, 100)}…</p>
    </div>
  );
}

// ─── SLIDE PANEL ──────────────────────────────────────────────────────────────
function SlidePanel({ room, onClose }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { gameId } = useParams();
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef(null);

  const [popupOpen, setPopupOpen] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("info");

  if (!room) return null;

  const handleJoinRoom = async () => {
    const profileId = user?.id || user?.profile_id;

    if (!profileId) {
      setPopupType("error");
      setPopupMessage("Sessão inválida. Por favor, faça login novamente.");
      setPopupOpen(true);
      return;
    }

    if (!gameId || !room.id) {
      setPopupType("error");
      setPopupMessage("Dados de identificação do jogo ou da sala inválidos.");
      setPopupOpen(true);
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/api/group-members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          group_id: parseInt(room.id),
          profile_id: parseInt(profileId), // Usa a variável declarada acima
        }),
      });

      const data = await response.json();

      if (response.ok || data.status === "sucesso") {
        setPopupType("success");
        setPopupMessage("Acesso autorizado! Entrando no lobby tático...");
        setPopupOpen(true);

        // Aguarda 1.5 segundos para exibir o feedback visual do PopUp antes de redirecionar
        setTimeout(() => {
          setPopupOpen(false);
          navigate(`/rooms/${gameId}/${room.id}`); // Redirecionamento seguro para RoomDetail
        }, 1500);
      } else {
        setPopupType("error");
        setPopupMessage(data.mensagem || "Erro ao tentar ingressar na sala.");
        setPopupOpen(true);
      }
    } catch (error) {
      console.error("Erro crítico na conexão:", error);
      setPopupType("error");
      setPopupMessage("Não foi possível conectar-se ao lobby do jogo.");
      setPopupOpen(true);
    }
  };

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const full = room.members === room.slots;
  const pct = (room.members / room.slots) * 100;
  const barColor = full ? "#ef4444" : pct >= 80 ? "#f59e0b" : "#22c55e";
  const isComp = room.style === "Competitivo";

  const slots = Array.from({ length: room.slots }, (_, i) => i < room.members);

  return (
    <>
      <div
        className={`panel-overlay ${mounted ? "panel-overlay--visible" : ""}`}
        onClick={onClose}
      />
      <aside
        ref={panelRef}
        className={`slide-panel ${mounted ? "slide-panel--open" : ""}`}
        role="dialog"
        aria-label={`Detalhes: ${room.name}`}
      >
        {/* ── Header ── */}
        <div className="sp-header">
          <div className="sp-header__top">
            <div>
              <span
                className={`sp-style-badge sp-style-badge--${isComp ? "comp" : "casual"}`}
              >
                {isComp ? "⚔️ Competitivo" : "🎮 Casual"}
              </span>
            </div>
            <button className="sp-close" onClick={onClose} aria-label="Fechar">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <h2 className="sp-title">{room.name}</h2>
          <div className="sp-owner-row">
            <div className="sp-avatar">
              {room.owner &&
              typeof room.owner === "string" &&
              room.owner.length > 0
                ? room.owner[0].toUpperCase()
                : "?"}
            </div>
            <div>
              <div className="sp-owner-name">{room.owner}</div>
              <div className="sp-created">{room.created_at}</div>
            </div>
          </div>
        </div>

        {/* ── Slots visual ── */}
        <div className="sp-section">
          <div className="sp-section-label">Vagas</div>
          <div className="sp-slots">
            {slots.map((filled, i) => (
              <div
                key={i}
                className={`sp-slot ${filled ? "sp-slot--filled" : "sp-slot--empty"}`}
              >
                {filled ? (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                ) : (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                )}
              </div>
            ))}
          </div>
          <div className="sp-slots-label" style={{ color: barColor }}>
            {room.members} de {room.slots} jogadores ·{" "}
            {room.slots - room.members} vaga
            {room.slots - room.members !== 1 ? "s" : ""} restante
            {room.slots - room.members !== 1 ? "s" : ""}
          </div>
        </div>

        {/* ── Info grid ── */}
        <div className="sp-section">
          <div className="sp-section-label">Informações</div>
          <div className="sp-info-grid">
            {[
              { icon: "🎯", label: "Estilo", value: room.style },
              { icon: "🕐", label: "Horário", value: room.schedule },
              { icon: "🏅", label: "Rank mín.", value: room.rank_min },
              { icon: "🏆", label: "Rank máx.", value: room.rank_max },
              { icon: "🌐", label: "Idioma", value: room.language },
              {
                icon: "🎙️",
                label: "Microfone",
                value: room.mic_required ? "Obrigatório" : "Opcional",
              },
            ].map((item) => (
              <div key={item.label} className="sp-info-item">
                <span className="sp-info-icon">{item.icon}</span>
                <div>
                  <div className="sp-info-label">{item.label}</div>
                  <div className="sp-info-value">{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Description ── */}
        <div className="sp-section">
          <div className="sp-section-label">Descrição</div>
          <p className="sp-desc">{room.description}</p>
        </div>

        {/* ── Tags ── */}
        <div className="sp-section">
          <div className="sp-section-label">Tags</div>
          <div className="sp-tags">
            {room.tags.map((t) => (
              <span key={t} className="sp-tag">
                #{t}
              </span>
            ))}
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="sp-footer">
          {full ? (
            <div className="sp-full-notice">
              Esta sala está cheia no momento.
            </div>
          ) : (
            <button className="sp-join-btn" onClick={handleJoinRoom}>
              Entrar na sala
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          )}
        </div>
      </aside>
      <Popup
        isOpen={popupOpen}
        message={popupMessage}
        type={popupType}
        onClose={() => setPopupOpen(false)}
      />
    </>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function RoomsPage() {
  const { gameId } = useParams(); // /games/:gameId/rooms
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelected] = useState(null);
  const [styleFilter, setStyle] = useState("Todos");
  const [slotFilter, setSlot] = useState("Todos");
  const [search, setSearch] = useState("");
  const [sortBy, setSort] = useState("recent"); // "recent" | "slots"

  useEffect(() => {
    async function loadData() {
      try {
        const [gameResponse, roomsResponse] = await Promise.all([
          fetch(`http://localhost:3000/api/games/${gameId}`),
          fetch(`http://localhost:3000/api/games/${gameId}/rooms`),
        ]);

        const gameData = await gameResponse.json();
        const roomsData = await roomsResponse.json();

        console.log("GAME:", gameData);
        console.log("ROOMS:", roomsData);

        setGame(gameData);
        setRooms(roomsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [gameId]);

  const filtered = rooms
    .filter((r) => {
      const matchSearch =
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.owner.toLowerCase().includes(search.toLowerCase());
      const matchStyle = styleFilter === "Todos" || r.style === styleFilter;
      const matchSlot =
        slotFilter === "Todos" ||
        (slotFilter === "Com vaga" && r.members < r.slots) ||
        (slotFilter === "Quase cheio" &&
          r.slots - r.members <= 1 &&
          r.members < r.slots);
      return matchSearch && matchStyle && matchSlot;
    })
    .sort((a, b) => {
      if (sortBy === "slots")
        return a.slots - a.members - (b.slots - b.members);
      return a.id - b.id; // recentes primeiro (mock usa id)
    });

  const openCount = rooms.filter((r) => r.members < r.slots).length;

  if (loading) {
    return <div>Carregando salas...</div>;
  }

  return (
    <div className="rooms-page">
      <Header />

      <main className="rooms-main">
        {/* ── Breadcrumb ── */}
        <div className="rooms-breadcrumb">
          <button
            className="rooms-breadcrumb__back"
            onClick={() => navigate("/games")}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Jogos
          </button>
          <span className="rooms-breadcrumb__sep">/</span>
          <span className="rooms-breadcrumb__current">{game?.name}</span>
        </div>

        {/* ── Game hero ── */}
        <section className="rooms-hero">
          <div
            className="rooms-hero__cover"
            style={{
              background: `linear-gradient(135deg, ${game?.cover_color}, #0f0f1a)`,
            }}
          >
            <span
              className="rooms-hero__cover-initial"
              style={{ color: game?.cover_accent }}
            >
              {game?.name.slice(0, 4).toUpperCase()}
            </span>
          </div>
          <div className="rooms-hero__info">
            <span className="rooms-hero__genre">{game?.genre}</span>
            <h1 className="rooms-hero__title">{game?.name}</h1>
            <div className="rooms-hero__stats">
              <div className="rooms-hero__stat">
                <span className="rooms-hero__stat-num">{rooms.length}</span>
                <span className="rooms-hero__stat-lbl">salas criadas</span>
              </div>
              <div className="rooms-hero__stat-div" />
              <div className="rooms-hero__stat">
                <span
                  className="rooms-hero__stat-num"
                  style={{ color: "#22c55e" }}
                >
                  {openCount}
                </span>
                <span className="rooms-hero__stat-lbl">com vaga</span>
              </div>
              <div className="rooms-hero__stat-div" />
              <div className="rooms-hero__stat">
                <span className="rooms-hero__stat-num">
                  {rooms.reduce((a, r) => a + r.members, 0)}
                </span>
                <span className="rooms-hero__stat-lbl">jogadores ativos</span>
              </div>
            </div>
          </div>
          <button
            className="rooms-hero__create-btn"
            onClick={() => navigate(`/rooms/${gameId}/create`)}
          >
            + Criar sala
          </button>
        </section>

        {/* ── Controls ── */}
        <section className="rooms-controls">
          <div className="rooms-controls__row">
            {/* Search */}
            <div className="rooms-search">
              <svg
                className="rooms-search__icon"
                width="15"
                height="15"
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
                className="rooms-search__input"
                type="text"
                placeholder="Buscar sala ou dono..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  className="rooms-search__clear"
                  onClick={() => setSearch("")}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sort */}
            <div className="rooms-sort">
              <span className="rooms-sort__lbl">Ordenar:</span>
              {[
                ["recent", "Recentes"],
                ["slots", "Mais vagas"],
              ].map(([v, l]) => (
                <button
                  key={v}
                  className={`rooms-sort__btn ${sortBy === v ? "rooms-sort__btn--on" : ""}`}
                  onClick={() => setSort(v)}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Filter pills */}
          <div className="rooms-filters">
            <div className="rooms-filter-group">
              <span className="rooms-filter-label">Estilo</span>
              <div className="rooms-pills">
                {STYLE_FILTERS.map((f) => (
                  <button
                    key={f}
                    className={`rooms-pill ${styleFilter === f ? "rooms-pill--on" : ""}`}
                    onClick={() => setStyle(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="rooms-filter-group">
              <span className="rooms-filter-label">Vagas</span>
              <div className="rooms-pills">
                {SLOT_FILTERS.map((f) => (
                  <button
                    key={f}
                    className={`rooms-pill ${slotFilter === f ? "rooms-pill--on" : ""}`}
                    onClick={() => setSlot(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Meta ── */}
        <div className="rooms-meta">
          <span>
            {filtered.length} sala{filtered.length !== 1 ? "s" : ""} encontrada
            {filtered.length !== 1 ? "s" : ""}
          </span>
          <span>
            {filtered.filter((r) => r.members < r.slots).length} com vagas
            disponíveis
          </span>
        </div>

        {/* ── List ── */}
        {filtered.length > 0 ? (
          <div className="rooms-list">
            {filtered.map((room, i) => (
              <div
                key={room.id}
                className="rooms-list__item"
                style={{ animationDelay: `${i * 55}ms` }}
              >
                <RoomCard
                  room={room}
                  onClick={setSelected}
                  active={selectedRoom?.id === room.id}
                  isUserRoom={room.owner === user?.nickname}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="rooms-empty">
            <div className="rooms-empty__icon">🔍</div>
            <p className="rooms-empty__title">Nenhuma sala encontrada</p>
            <p className="rooms-empty__sub">
              Tente limpar os filtros ou seja o primeiro a criar uma sala!
            </p>
            <button
              className="rooms-empty__btn"
              onClick={() => {
                setSearch("");
                setStyle("Todos");
                setSlot("Todos");
              }}
            >
              Limpar filtros
            </button>
          </div>
        )}
      </main>

      {/* ── Slide panel ── */}
      {selectedRoom && (
        <SlidePanel room={selectedRoom} onClose={() => setSelected(null)} />
      )}

      <Footer />
    </div>
  );
}
