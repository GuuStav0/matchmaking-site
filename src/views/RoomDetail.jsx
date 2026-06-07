import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../models/authContext.jsx";
import Header from "../assets/actions/header.jsx";
import Footer from "../assets/actions/footer.jsx";
import "../assets/css/roomDetail.css";

const API = "http://localhost:3000/api";

function getIniciais(nick) {
  if (!nick) return "?";
  const p = nick.trim().split(" ");
  return p.length > 1
    ? (p[0][0] + p[1][0]).toUpperCase()
    : nick.substring(0, 2).toUpperCase();
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ url, nick, size = 36 }) {
  if (url) {
    return (
      <img
        src={url}
        alt={nick}
        className="rd-avatar-img"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rd-avatar-placeholder"
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {getIniciais(nick)}
    </div>
  );
}

// ── Slot bar ──────────────────────────────────────────────────────────────────
function SlotBar({ members, slots }) {
  const pct = Math.min((members / slots) * 100, 100);
  const color =
    members >= slots ? "#ef4444" : pct >= 80 ? "#f59e0b" : "#22c55e";
  return (
    <div className="rd-slotbar">
      <div className="rd-slotbar__track">
        <div
          className="rd-slotbar__fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="rd-slotbar__label" style={{ color }}>
        {members}/{slots}
      </span>
    </div>
  );
}

// ── Modal de edição ───────────────────────────────────────────────────────────
function EditModal({ room, onClose, onSave }) {
  const [form, setForm] = useState({
    name: room.name || "",
    bio: room.description || "",
    max_slots: room.slots || 4,
    game_style: room.style || "Casual",
    rank_min: room.rank_min || "Livre",
    rank_max: room.rank_max || "Livre",
    language: room.language || "Português",
    mic_required: room.mic_required ? 1 : 0,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="rd-modal-overlay" onClick={onClose}>
      <div className="rd-modal" onClick={(e) => e.stopPropagation()}>
        <div className="rd-modal__header">
          <h3 className="rd-modal__title">Editar sala</h3>
          <button className="rd-modal__close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="rd-modal__body">
          <label className="rd-modal__label">Título</label>
          <input
            className="rd-modal__input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <label className="rd-modal__label">Descrição</label>
          <textarea
            className="rd-modal__textarea"
            rows={3}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />

          <div className="rd-modal__row">
            <div>
              <label className="rd-modal__label">Vagas</label>
              <input
                type="number"
                className="rd-modal__input"
                min={1}
                max={20}
                value={form.max_slots}
                onChange={(e) =>
                  setForm({ ...form, max_slots: parseInt(e.target.value) })
                }
              />
            </div>
            <div>
              <label className="rd-modal__label">Estilo</label>
              <select
                className="rd-modal__select"
                value={form.game_style}
                onChange={(e) =>
                  setForm({ ...form, game_style: e.target.value })
                }
              >
                <option value="Casual">Casual</option>
                <option value="Competitivo">Competitivo</option>
              </select>
            </div>
          </div>

          <div className="rd-modal__row">
            <div>
              <label className="rd-modal__label">Rank mín.</label>
              <input
                className="rd-modal__input"
                value={form.rank_min}
                onChange={(e) => setForm({ ...form, rank_min: e.target.value })}
              />
            </div>
            <div>
              <label className="rd-modal__label">Rank máx.</label>
              <input
                className="rd-modal__input"
                value={form.rank_max}
                onChange={(e) => setForm({ ...form, rank_max: e.target.value })}
              />
            </div>
          </div>

          <label className="rd-modal__label">Microfone</label>
          <select
            className="rd-modal__select"
            value={form.mic_required}
            onChange={(e) =>
              setForm({ ...form, mic_required: parseInt(e.target.value) })
            }
          >
            <option value={1}>Obrigatório</option>
            <option value={0}>Opcional</option>
          </select>
        </div>

        <div className="rd-modal__footer">
          <button className="rd-modal__btn-cancel" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="rd-modal__btn-save"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function RoomDetail() {
  const { gameId, roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [room, setRoom] = useState(null);
  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [msgText, setMsgText] = useState("");
  const [sending, setSending] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const chatEndRef = useRef(null);
  const pollRef = useRef(null);

  const isOwner = room && user && String(room.creator_id) === String(user.id);
  const isMember = members.some(
    (m) => String(m.profile_id) === String(user?.id),
  );

  // ── Carrega dados da sala ──────────────────────────────────────────────────
  const loadRoom = useCallback(async () => {
    try {
      const res = await fetch(`${API}/rooms/detail/${roomId}`);
      const data = await res.json();
      if (data.status === "erro") throw new Error(data.mensagem);
      setRoom(data.dados);
      setMembers(data.dados.membros || []);
    } catch (err) {
      setErro(err.message);
    }
  }, [roomId]);

  // ── Carrega mensagens ──────────────────────────────────────────────────────
  const loadMessages = useCallback(async () => {
    try {
      const res = await fetch(`${API}/rooms/${roomId}/messages`);
      const data = await res.json();
      if (data.status === "sucesso") setMessages(data.dados || []);
    } catch {}
  }, [roomId]);

  // ── Boot ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([loadRoom(), loadMessages()]).finally(() => setLoading(false));

    // Polling: sala a cada 10s, mensagens a cada 3s
    const roomInterval = setInterval(loadRoom, 10000);
    const msgInterval = setInterval(loadMessages, 3000);
    pollRef.current = { roomInterval, msgInterval };

    return () => {
      clearInterval(roomInterval);
      clearInterval(msgInterval);
    };
  }, [loadRoom, loadMessages]);

  // ── Enviar mensagem ────────────────────────────────────────────────────────
  const sendMessage = async () => {
    if (!msgText.trim() || sending) return;
    setSending(true);
    try {
      await fetch(`${API}/rooms/${roomId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_id: user?.id, content: msgText.trim() }),
      });
      setMsgText("");
      await loadMessages();
    } catch {}
    setSending(false);
  };

  // ── Sair da sala ───────────────────────────────────────────────────────────
  const handleSair = async () => {
    await fetch(`${API}/group-members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ group_id: roomId, profile_id: user?.id }),
    });
    navigate(`/rooms/${gameId}`);
  };

  // ── Entrar na sala ─────────────────────────────────────────────────────────
  const handleEntrar = async () => {
    await fetch(`${API}/group-members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        group_id: parseInt(roomId),
        profile_id: user?.id,
      }),
    });
    await loadRoom();
  };

  // ── Expulsar membro ────────────────────────────────────────────────────────
  const handleKick = async (profileId) => {
    await fetch(`${API}/rooms/${roomId}/members/${profileId}`, {
      method: "DELETE",
    });
    await loadRoom();
  };

  // ── Deletar sala ───────────────────────────────────────────────────────────
  const handleDelete = async () => {
    await fetch(`${API}/game-groups/${roomId}`, { method: "DELETE" });
    navigate(`/rooms/${gameId}`);
  };

  // ── Salvar edição ──────────────────────────────────────────────────────────
  const handleSave = async (form) => {
    await fetch(`${API}/game-groups/${roomId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setShowEdit(false);
    await loadRoom();
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="rd-page">
        <Header />
        <div className="rd-loading">
          <span className="rd-spinner" />
          Carregando sala...
        </div>
      </div>
    );
  }

  if (erro || !room) {
    return (
      <div className="rd-page">
        <Header />
        <div className="rd-error">
          <p>⚠️ {erro || "Sala não encontrada."}</p>
          <button onClick={() => navigate(`/rooms/${gameId}`)}>← Voltar</button>
        </div>
      </div>
    );
  }

  const vagas = room.slots - members.length;

  return (
    <div className="rd-page">
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
      <main className="rd-main">
        {/* ── Breadcrumb ── */}
        <button
          className="rd-back"
          onClick={() => navigate(`/rooms/${gameId}`)}
        >
          ← Voltar para salas
        </button>

        {/* ── Layout principal ── */}
        <div className="rd-layout">
          {/* ══ COLUNA ESQUERDA ══════════════════════════════════════════════ */}
          <div className="rd-col-left">
            {/* Info da sala */}
            <div className="rd-card rd-info-card">
              <div className="rd-info-card__top">
                <div>
                  <span
                    className={`rd-style-badge rd-style-badge--${room.style === "Competitivo" ? "comp" : "casual"}`}
                  >
                    {room.style === "Competitivo"
                      ? "⚔️ Competitivo"
                      : "🎮 Casual"}
                  </span>
                  <h1 className="rd-room-name">{room.name}</h1>
                  <p className="rd-room-owner">por {room.owner}</p>
                </div>

                {/* Botões do dono */}
                {isOwner && (
                  <div className="rd-owner-actions">
                    <button
                      className="rd-btn-edit"
                      onClick={() => setShowEdit(true)}
                    >
                      ✏️ Editar
                    </button>
                    <button
                      className="rd-btn-delete"
                      onClick={() => setConfirmDelete(true)}
                    >
                      🗑️ Excluir
                    </button>
                  </div>
                )}
              </div>

              <p className="rd-room-bio">{room.description}</p>

              <SlotBar members={members.length} slots={room.slots} />
              <p className="rd-vagas-label">
                {vagas > 0
                  ? `${vagas} vaga${vagas !== 1 ? "s" : ""} disponível${vagas !== 1 ? "is" : ""}`
                  : "Sala cheia"}
              </p>

              <div className="rd-info-grid">
                {[
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
                  <div key={item.label} className="rd-info-item">
                    <span className="rd-info-icon">{item.icon}</span>
                    <div>
                      <div className="rd-info-label">{item.label}</div>
                      <div className="rd-info-value">{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {room.tags && room.tags.length > 0 && (
                <div className="rd-tags">
                  {(Array.isArray(room.tags)
                    ? room.tags
                    : room.tags.split(",")
                  ).map((t, i) => (
                    <span key={i} className="rd-tag">
                      #{t.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Lista de membros */}
            <div className="rd-card rd-members-card">
              <h2 className="rd-card__title">
                👥 Membros ({members.length}/{room.slots})
              </h2>
              <div className="rd-members-list">
                {members.map((m) => (
                  <div key={m.profile_id} className="rd-member-item">
                    <Avatar url={m.avatar_url} nick={m.nickname} size={36} />
                    <div className="rd-member-info">
                      <span className="rd-member-nick">{m.nickname}</span>
                      {String(m.profile_id) === String(room.creator_id) && (
                        <span className="rd-member-owner-badge">👑 Dono</span>
                      )}
                    </div>
                    {/* Botão de expulsar — só o dono vê, e não pode expulsar a si mesmo */}
                    {isOwner && String(m.profile_id) !== String(user?.id) && (
                      <button
                        className="rd-kick-btn"
                        title="Expulsar membro"
                        onClick={() => handleKick(m.profile_id)}
                      >
                        🚪
                      </button>
                    )}
                  </div>
                ))}

                {/* Vagas vazias */}
                {Array.from({ length: vagas }).map((_, i) => (
                  <div
                    key={`vaga-${i}`}
                    className="rd-member-item rd-member-item--empty"
                  >
                    <div
                      className="rd-avatar-empty"
                      style={{ width: 36, height: 36 }}
                    >
                      +
                    </div>
                    <span className="rd-member-vaga">Vaga disponível</span>
                  </div>
                ))}
              </div>

              {/* Ação de entrar/sair */}
              <div className="rd-member-action">
                {isMember ? (
                  <button className="rd-btn-sair" onClick={handleSair}>
                    🚪 Sair da sala
                  </button>
                ) : vagas > 0 ? (
                  <button className="rd-btn-entrar" onClick={handleEntrar}>
                    ⚡ Entrar na sala
                  </button>
                ) : (
                  <p className="rd-sala-cheia">Sala cheia</p>
                )}
              </div>
            </div>
          </div>

          {/* ══ COLUNA DIREITA — CHAT ════════════════════════════════════════ */}
          <div className="rd-col-right">
            <div className="rd-card rd-chat-card">
              <h2 className="rd-card__title">💬 Chat da sala</h2>

              <div className="rd-chat-messages">
                {messages.length === 0 && (
                  <div className="rd-chat-empty">
                    <p>Nenhuma mensagem ainda.</p>
                    <p>Seja o primeiro a dizer algo! 👋</p>
                  </div>
                )}
                {messages.map((msg) => {
                  const isMe = String(msg.profile_id) === String(user?.id);
                  return (
                    <div
                      key={msg.id}
                      className={`rd-msg ${isMe ? "rd-msg--me" : ""}`}
                    >
                      {!isMe && (
                        <Avatar
                          url={msg.avatar_url}
                          nick={msg.nickname}
                          size={28}
                        />
                      )}
                      <div className="rd-msg__bubble-wrap">
                        {!isMe && (
                          <span className="rd-msg__nick">{msg.nickname}</span>
                        )}
                        <div className="rd-msg__bubble">{msg.content}</div>
                        <span className="rd-msg__time">
                          {new Date(msg.created_at).toLocaleTimeString(
                            "pt-BR",
                            { hour: "2-digit", minute: "2-digit" },
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Input do chat */}
              {isMember ? (
                <div className="rd-chat-input-row">
                  <input
                    className="rd-chat-input"
                    placeholder="Digite uma mensagem..."
                    value={msgText}
                    onChange={(e) => setMsgText(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && !e.shiftKey && sendMessage()
                    }
                    maxLength={500}
                  />
                  <button
                    className="rd-chat-send"
                    onClick={sendMessage}
                    disabled={sending || !msgText.trim()}
                  >
                    {sending ? "..." : "→"}
                  </button>
                </div>
              ) : (
                <div className="rd-chat-locked">
                  🔒 Entre na sala para participar do chat
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ── Modal de edição ── */}
      {showEdit && (
        <EditModal
          room={room}
          onClose={() => setShowEdit(false)}
          onSave={handleSave}
        />
      )}

      {/* ── Confirmação de exclusão ── */}
      {confirmDelete && (
        <div
          className="rd-modal-overlay"
          onClick={() => setConfirmDelete(false)}
        >
          <div
            className="rd-modal rd-modal--sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="rd-modal__title">Excluir sala?</h3>
            <p className="rd-modal__desc">
              Esta ação é irreversível. Todos os membros serão removidos.
            </p>
            <div className="rd-modal__footer">
              <button
                className="rd-modal__btn-cancel"
                onClick={() => setConfirmDelete(false)}
              >
                Cancelar
              </button>
              <button className="rd-modal__btn-delete" onClick={handleDelete}>
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
