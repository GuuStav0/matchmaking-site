import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../assets/actions/header.jsx";
import { Popup } from "../assets/actions/PopUp.jsx";
import { useAuth } from "../models/authContext.jsx";
import "../assets/css/roomDetail.css";

const API_BASE = "http://localhost:3000/api";

// ─── UTILS ────────────────────────────────────────────────────────────────────
const avatar = (nick, size = 32) => (
  <div
    className="av"
    style={{ width: size, height: size, fontSize: size * 0.42 }}
  >
    {nick?.[0]?.toUpperCase() ?? "?"}
  </div>
);

const now = () =>
  new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

// ─── ICONS ────────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {d.map((p, i) => (
      <path key={i} d={p} />
    ))}
  </svg>
);
const IExit = () => (
  <Icon
    d={[
      "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",
      "M16 17l5-5-5-5",
      "M21 12H9",
    ]}
  />
);
const ISettings = () => (
  <Icon
    d={["M12 20h9", "M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"]}
  />
);
const ISend = () => <Icon d={["M22 2L11 13", "M22 2L15 22l-4-9-9-4 20-7z"]} />;
const IKick = () => (
  <Icon
    d={[
      "M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2",
      "M23 21v-2a4 4 0 0 0-3-3.87",
      "M16 3.13a4 4 0 0 1 0 7.75",
      "M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    ]}
  />
);
const ICrown = () => (
  <Icon
    d={[
      "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    ]}
  />
);
const ITrash = () => (
  <Icon d={["M3 6h18", "M8 6V4h8v2", "M19 6l-1 14H6L5 6"]} />
);
const ISearch = () => (
  <Icon d={["M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z", "M21 21l-4.35-4.35"]} />
);
const IClose = () => <Icon d={["M18 6L6 18", "M6 6l12 12"]} />;
const ICheck = () => <Icon d={["M20 6L9 17l-5-5"]} />;
const IPlus = () => <Icon d={["M12 5v14", "M5 12h14"]} />;
const IEdit = () => (
  <Icon
    d={[
      "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7",
      "M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
    ]}
  />
);
const IChevron = () => <Icon d={["M6 9l6 6 6-6"]} />;

// ─── SLOT BAR ─────────────────────────────────────────────────────────────────
function SlotBar({ members, slots }) {
  const pct = (members / slots) * 100;
  const color =
    members === slots ? "#ef4444" : pct >= 80 ? "#f59e0b" : "#22c55e";
  return (
    <div className="slotbar">
      <div className="slotbar__track">
        <div
          className="slotbar__fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="slotbar__txt" style={{ color }}>
        {members}/{slots}
      </span>
    </div>
  );
}

// ─── MODAL BASE ───────────────────────────────────────────────────────────────
function Modal({ title, onClose, children, danger }) {
  useEffect(() => {
    const esc = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal ${danger ? "modal--danger" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal__header">
          <h3 className="modal__title">{title}</h3>
          <button className="modal__close" onClick={onClose}>
            <IClose />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── MODAL: EDIT ROOM ─────────────────────────────────────────────────────────
function EditModal({ room, onClose, onSave }) {
  const [form, setForm] = useState({
    name: room.name,
    description: room.description,
    style: room.style,
    rank_min: room.rank_min,
    rank_max: room.rank_max,
    schedule: room.schedule,
    slots: room.slots,
    mic_required: room.mic_required,
    status: room.status,
    tags: Array.isArray(room.tags) ? [...room.tags] : [],
  });
  const [tagInput, setTagInput] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t) && form.tags.length < 6) {
      set("tags", [...form.tags, t]);
      setTagInput("");
    }
  };

  const removeTag = (t) =>
    set(
      "tags",
      form.tags.filter((x) => x !== t),
    );

  const RANKS = [
    "Qualquer",
    "Ferro",
    "Bronze",
    "Prata",
    "Ouro",
    "Platina",
    "Diamante",
    "Imortal",
    "Radiante",
  ];
  const STYLES = ["Competitivo", "Casual"];

  return (
    <Modal title="Editar sala" onClose={onClose}>
      <div className="modal__body">
        <div className="form-grid">
          <div className="form-field form-field--full">
            <label className="form-label">Nome da sala</label>
            <input
              className="form-input"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              maxLength={60}
            />
          </div>
          <div className="form-field form-field--full">
            <label className="form-label">Descrição</label>
            <textarea
              className="form-textarea"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              maxLength={300}
            />
          </div>
          <div className="form-field">
            <label className="form-label">Estilo</label>
            <select
              className="form-select"
              value={form.style}
              onChange={(e) => set("style", e.target.value)}
            >
              {STYLES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Vagas (slots)</label>
            <select
              className="form-select"
              value={form.slots}
              onChange={(e) => set("slots", Number(e.target.value))}
            >
              {[2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} jogadores
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Rank mínimo</label>
            <select
              className="form-select"
              value={form.rank_min}
              onChange={(e) => set("rank_min", e.target.value)}
            >
              {RANKS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Rank máximo</label>
            <select
              className="form-select"
              value={form.rank_max}
              onChange={(e) => set("rank_max", e.target.value)}
            >
              {RANKS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Horário</label>
            <input
              className="form-input"
              value={form.schedule}
              onChange={(e) => set("schedule", e.target.value)}
              placeholder="ex: 21h–00h"
            />
          </div>
          <div className="form-field">
            <label className="form-label">Status</label>
            <select
              className="form-select"
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
            >
              <option value="open">Aberta</option>
              <option value="closed">Fechada</option>
            </select>
          </div>
          <div className="form-field form-field--row">
            <label className="form-label">Microfone obrigatório</label>
            <button
              className={`toggle ${form.mic_required ? "toggle--on" : ""}`}
              onClick={() => set("mic_required", !form.mic_required)}
            >
              <span className="toggle__knob" />
            </button>
          </div>
          <div className="form-field form-field--full">
            <label className="form-label">Tags (máx. 6)</label>
            <div className="tag-input-row">
              <input
                className="form-input"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addTag())
                }
                placeholder="Digite e pressione Enter"
                maxLength={20}
              />
              <button className="btn-icon" onClick={addTag}>
                <IPlus />
              </button>
            </div>
            <div className="tag-chips">
              {form.tags.map((t) => (
                <span key={t} className="tag-chip">
                  #{t}
                  <button
                    className="tag-chip__remove"
                    onClick={() => removeTag(t)}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="modal__footer">
        <button className="btn-secondary" onClick={onClose}>
          Cancelar
        </button>
        <button className="btn-primary" onClick={() => onSave(form)}>
          Salvar alterações
        </button>
      </div>
    </Modal>
  );
}

// ─── MODAL: DELETE ROOM ───────────────────────────────────────────────────────
function DeleteModal({ roomName, onClose, onConfirm }) {
  return (
    <Modal title="Excluir sala" onClose={onClose} danger>
      <div className="modal__body">
        <div className="danger-notice">
          <span className="danger-notice__icon">⚠️</span>
          <p style={{ textAlign: "justify" }}>
            Esta ação é <strong>permanente</strong> e encerrará o grupo para
            todos os membros. A sala <strong>"{roomName}"</strong> será removida
            e não poderá ser recuperada.
          </p>
        </div>
      </div>
      <div className="modal__footer">
        <button className="btn-secondary" onClick={onClose}>
          Cancelar
        </button>
        <button className="btn-danger" onClick={onConfirm}>
          Excluir sala
        </button>
      </div>
    </Modal>
  );
}

// ─── MODAL: KICK MEMBER ───────────────────────────────────────────────────────
function KickModal({ member, onClose, onConfirm }) {
  return (
    <Modal title="Expulsar jogador" onClose={onClose} danger>
      <div className="modal__body">
        <div className="danger-notice">
          <span className="danger-notice__icon">🚫</span>
          <p>
            Tem certeza que deseja expulsar <strong>{member.nickname}</strong>{" "}
            da sala?
          </p>
        </div>
      </div>
      <div className="modal__footer">
        <button className="btn-secondary" onClick={onClose}>
          Cancelar
        </button>
        <button className="btn-danger" onClick={() => onConfirm(member.id)}>
          Expulsar
        </button>
      </div>
    </Modal>
  );
}

// ─── MEMBER ITEM ──────────────────────────────────────────────────────────────
function MemberItem({
  member,
  isOwner,
  currentUserIsOwner,
  onKick,
  onPromote,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div
      className={`member-item ${member.online ? "" : "member-item--offline"}`}
      ref={ref}
    >
      <div className="member-item__av-wrap">
        {avatar(member.nickname, 32)}
        <span
          className={`member-item__dot ${member.online ? "member-item__dot--on" : ""}`}
        />
      </div>
      <div className="member-item__info">
        <span className="member-item__nick">{member.nickname}</span>
        {isOwner && <span className="member-item__crown">👑</span>}
      </div>
      <span className="member-item__status">
        {member.online ? "online" : "offline"}
      </span>

      {currentUserIsOwner && !isOwner && (
        <div className="member-item__actions">
          <button
            className="member-item__dots"
            onClick={() => setMenuOpen((v) => !v)}
          >
            ⋯
          </button>
          {menuOpen && (
            <div className="member-mini-menu">
              <button
                onClick={() => {
                  onPromote(member);
                  setMenuOpen(false);
                }}
              >
                <ICrown /> Promover a dono
              </button>
              <button
                className="member-mini-menu__danger"
                onClick={() => {
                  onKick(member);
                  setMenuOpen(false);
                }}
              >
                <IKick /> Expulsar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── CHAT MESSAGE ─────────────────────────────────────────────────────────────
function ChatMessage({ msg, currentProfileId }) {
  if (msg.type === "system") {
    return <div className="msg-system">{msg.content}</div>;
  }

  // Compara profile_id (campo retornado pela API em room_messages)
  const isOwn = msg.profile_id === currentProfileId;

  return (
    <div className={`msg ${isOwn ? "msg--own" : ""}`}>
      {!isOwn && <div className="msg__av-wrap">{avatar(msg.nickname, 28)}</div>}
      <div className="msg__body">
        {!isOwn && <span className="msg__nick">{msg.nickname}</span>}
        <div className={`msg__bubble ${isOwn ? "msg__bubble--own" : ""}`}>
          {msg.content}
        </div>
        <span className="msg__time">
          {msg.created_at
            ? new Date(msg.created_at).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : now()}
        </span>
      </div>
    </div>
  );
}

// ─── LOADING / ERROR STATES ────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="rp">
      <Header />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: 1,
          flexDirection: "column",
          gap: 12,
          color: "#64748b",
          fontSize: 14,
          padding: 40,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            border: "3px solid rgba(124,58,237,.3)",
            borderTopColor: "#7c3aed",
            borderRadius: "50%",
            animation: "spin 0.7s linear infinite",
          }}
        />
        Carregando sala...
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

function ErrorScreen({ message, onBack }) {
  return (
    <div className="rp">
      <Header />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: 1,
          flexDirection: "column",
          gap: 12,
          color: "#f87171",
          fontSize: 14,
          padding: 40,
        }}
      >
        <span style={{ fontSize: 32 }}>⚠️</span>
        {message}
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "1px solid rgba(255,255,255,.1)",
            color: "#94a3b8",
            padding: "8px 18px",
            borderRadius: 8,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          ← Voltar
        </button>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function RoomDetail() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  // ── Auth context: obtém o usuário logado real ──────────────────────────────
  const { user } = useAuth();
  // user = { id, profileId, nickname, email, avatarUrl }
  // profileId corresponde a profiles.id — usado para comparar com creator_id e group_members.profile_id

  // ── States ─────────────────────────────────────────────────────────────────
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [text, setText] = useState("");
  const [mobileTab, setMobileTab] = useState("chat");
  const [pageState, setPageState] = useState("loading"); // "loading" | "ready" | "error"
  const [errorMsg, setErrorMsg] = useState("");

  // Popup
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("info");

  // Modals / dropdowns
  const [modal, setModal] = useState(null);
  const [kickTarget, setKickTarget] = useState(null);
  const [ownerDrop, setOwnerDrop] = useState(false);
  const ownerDropRef = useRef(null);
  const chatEndRef = useRef(null);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const triggerPopup = useCallback((msg, type = "success") => {
    setPopupMessage(msg);
    setPopupType(type);
    setPopupOpen(true);
  }, []);

  // isOwner: compara o profileId do usuário logado com o creator_id da sala
  const isOwner = room
    ? Number(user?.profileId) === Number(room.creator_id)
    : false;
  const full = members.length >= (room?.max_slots ?? 0);

  // ── Fetch sala + membros ────────────────────────────────────────────────────
  // GET /api/rooms/detail/:roomId
  // Retorna: { status, dados: { ...room, members: [...] } }
  useEffect(() => {
    if (!roomId) return;

    const load = async () => {
      setPageState("loading");
      try {
        const res = await fetch(`${API_BASE}/rooms/detail/${roomId}`);
        const data = await res.json();

        // 🌟 ADICIONE ESSES DOIS LOGS AQUI PARA INVESTIGARMOS:
        console.log("STATUS DA RESPOSTA:", res.status);
        console.log("DADOS QUE VINDOS DO BACKEND:", data);

        if (!res.ok || data.status === "erro") {
          setErrorMsg(data.mensagem || "Sala não encontrada.");
          setPageState("error");
          return;
        }

        const roomData = data.dados;

        // tags: o back-end pode retornar string "Tag1,Tag2" ou já um array
        if (typeof roomData.tags === "string") {
          roomData.tags = roomData.tags
            ? roomData.tags.split(",").map((t) => t.trim())
            : [];
        }

        // mic_required: o SQLite armazena como 1/0, normaliza para boolean
        roomData.mic_required = Boolean(roomData.mic_required);

        // game_name vem como "game_name" no JOIN, mapeamos para "game"
        roomData.game = roomData.game_name ?? roomData.game ?? "";

        // slots: o campo no banco é max_slots
        roomData.slots = roomData.max_slots;

        // description: o campo no banco é bio
        roomData.description = roomData.bio ?? roomData.description ?? "";

        // Membros: API retorna array com { id, nickname, avatar_url }
        // online não é persistido no banco — definimos todos como true por padrão
        const rawMembers = (roomData.members ?? []).map((m) => ({
          ...m,
          online: true,
        }));

        setRoom(roomData);
        setMembers(rawMembers);
        setPageState("ready");
      } catch (err) {
        console.error("Erro ao carregar sala:", err);
        setErrorMsg("Não foi possível conectar ao servidor.");
        setPageState("error");
      }
    };

    load();
  }, [roomId]);

  // ── Fetch mensagens ─────────────────────────────────────────────────────────
  // GET /api/rooms/:roomId/messages
  // Retorna: { status, dados: [{ id, content, created_at, profile_id, nickname, avatar_url }] }
  useEffect(() => {
    if (!roomId) return;

    const fetchMessages = async () => {
      try {
        const res = await fetch(`${API_BASE}/rooms/${roomId}/messages`);
        const data = await res.json();
        if (data.status === "sucesso") {
          setMessages(data.dados ?? []);
        }
      } catch (err) {
        console.error("Erro ao carregar mensagens:", err);
      }
    };

    fetchMessages();
    // Polling simples a cada 5s enquanto WebSocket não estiver disponível
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [roomId]);

  // ── Auto-scroll chat ────────────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Close owner dropdown on outside click ───────────────────────────────────
  useEffect(() => {
    const h = (e) => {
      if (ownerDropRef.current && !ownerDropRef.current.contains(e.target))
        setOwnerDrop(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // ── Send message ─────────────────────────────────────────────────────────────
  // POST /api/rooms/:roomId/messages — não implementado no back ainda,
  // por isso fazemos o INSERT otimista localmente e alertamos no console
  const sendMessage = async () => {
    if (!text.trim() || !user) return;

    // Mensagem otimista (renderiza imediatamente)
    const optimistic = {
      id: Date.now(),
      profile_id: user.profileId,
      nickname: user.nickname,
      content: text.trim(),
      created_at: new Date().toISOString(),
    };
    setMessages((m) => [...m, optimistic]);
    setText("");

    try {
      // POST /api/rooms/:roomId/messages { profile_id, content }
      await fetch(`${API_BASE}/rooms/${roomId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile_id: user.profileId,
          content: optimistic.content,
        }),
      });
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── Leave room ────────────────────────────────────────────────────────────────
  // DELETE /api/group-members { group_id, profile_id }
  const leaveRoom = async () => {
    try {
      await fetch(`${API_BASE}/group-members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          group_id: Number(roomId),
          profile_id: user.profileId,
        }),
      });
    } catch (err) {
      console.error("Erro ao sair da sala:", err);
    }
    triggerPopup("Você saiu da sala.", "info");
    setTimeout(() => navigate(-1), 1200);
  };

  // ── Edit room ─────────────────────────────────────────────────────────────────
  // PUT /api/game-groups/:id
  const saveRoom = async (form) => {
    try {
      const res = await fetch(`${API_BASE}/game-groups/${roomId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          bio: form.description, // banco usa "bio"
          game_style: form.style,
          max_slots: form.slots,
          rank_min: form.rank_min,
          rank_max: form.rank_max,
          schedule: form.schedule,
          mic_required: form.mic_required ? 1 : 0,
          tags: form.tags.join(", "), // banco armazena como string
        }),
      });
      const data = await res.json();
      if (!res.ok || data.status === "erro") {
        triggerPopup(data.mensagem || "Erro ao salvar.", "error");
        return;
      }

      // Atualiza estado local com os dados salvos
      setRoom((r) => ({
        ...r,
        name: form.name,
        description: form.description,
        bio: form.description,
        style: form.style,
        game_style: form.style,
        slots: form.slots,
        max_slots: form.slots,
        rank_min: form.rank_min,
        rank_max: form.rank_max,
        schedule: form.schedule,
        mic_required: form.mic_required,
        tags: form.tags,
      }));
      setModal(null);
      triggerPopup("Sala atualizada com sucesso!", "success");
    } catch (err) {
      console.error("Erro ao editar sala:", err);
      triggerPopup("Erro de conexão ao salvar.", "error");
    }
  };

  // ── Delete room ────────────────────────────────────────────────────────────────
  const deleteRoom = async () => {
    try {
      const response = await fetch(`${API_BASE}/game-groups/${roomId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-profile-id": String(user?.profileId), // 🌟 Enviando de forma segura pelo cabeçalho
        },
      });

      const result = await response.json();

      if (response.ok && result.status === "sucesso") {
        triggerPopup(result.mensagem, "success");
        setTimeout(() => navigate("/games"), 1200);
      } else {
        triggerPopup(result.mensagem || "Erro ao excluir sala.", "error");
      }
    } catch (err) {
      console.error("Erro ao excluir sala:", err);
      triggerPopup("Não foi possível conectar ao servidor.", "error");
    }
  };

  // ── Kick member ────────────────────────────────────────────────────────────────
  const openKick = (member) => {
    setKickTarget(member);
    setModal("kick");
  };
  const confirmKick = async (memberProfileId) => {
    if (!kickTarget) return;
    try {
      const res = await fetch(
        `${API_BASE}/rooms/${roomId}/members/${memberProfileId}`,
        {
          method: "DELETE",
          headers: { "x-user-id": String(user.profileId) },
        },
      );
      const data = await res.json();
      if (!res.ok || data.status === "erro") {
        triggerPopup(data.mensagem || "Erro ao expulsar.", "error");
        return;
      }
    } catch (err) {
      console.error("Erro ao expulsar membro:", err);
    }

    setMembers((m) => m.filter((x) => x.id !== memberProfileId));
    setMessages((msgs) => [
      ...msgs,
      {
        id: Date.now(),
        type: "system",
        content: `${kickTarget.nickname} foi removido da sala.`,
        created_at: new Date().toISOString(),
      },
    ]);
    triggerPopup(`${kickTarget.nickname} foi expulso.`, "success");
    setModal(null);
    setKickTarget(null);
  };

  // ── Promote owner ──────────────────────────────────────────────────────────────
  // Não há endpoint direto no api.js atual — atualizamos só o estado local
  // e logamos para futura implementação
  const promoteOwner = (member) => {
    console.info(
      "[TODO] PUT /api/game-groups/:id/owner — Promover",
      member.nickname,
    );
    setRoom((r) => ({ ...r, creator_id: member.id }));
    setMessages((msgs) => [
      ...msgs,
      {
        id: Date.now(),
        type: "system",
        content: `${member.nickname} agora é o dono da sala.`,
        created_at: new Date().toISOString(),
      },
    ]);
    triggerPopup(`${member.nickname} promovido a dono.`, "success");
  };

  // ── Invite ────────────────────────────────────────────────────────────────────
  // POST /api/group-members { group_id, profile_id }
  const handleInvite = async (player) => {
    try {
      await fetch(`${API_BASE}/group-members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          group_id: Number(roomId),
          profile_id: player.id,
        }),
      });
    } catch (err) {
      console.error("Erro ao convidar jogador:", err);
    }
    triggerPopup(`Convite enviado para ${player.nickname}!`, "success");
  };

  // ── Early returns ───────────────────────────────────────────────────────────
  if (pageState === "loading") return <LoadingScreen />;
  if (pageState === "error")
    return <ErrorScreen message={errorMsg} onBack={() => navigate(-1)} />;
  if (!room) return null;

  return (
    <div className="rp">
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
      <Popup
        isOpen={popupOpen}
        message={popupMessage}
        type={popupType}
        onClose={() => setPopupOpen(false)}
      />

      {/* Modals */}
      {modal === "edit" && (
        <EditModal
          room={room}
          onClose={() => setModal(null)}
          onSave={saveRoom}
        />
      )}
      {modal === "delete" && (
        <DeleteModal
          roomName={room.name}
          onClose={() => setModal(null)}
          onConfirm={deleteRoom}
        />
      )}
      {modal === "kick" && kickTarget && (
        <KickModal
          member={kickTarget}
          onClose={() => setModal(null)}
          onConfirm={confirmKick}
        />
      )}

      <div className="rp__wrap">
        {/* Floating background */}
        <div className="rd-floating-background">
          <span>🎮</span>
          <span>🎧</span>
          <span>⚔️</span>
          <span>🎯</span>
          <span>🕹️</span>
          <span>🔥</span>
          <span>⚡</span>
          <span>👑</span>
        </div>

        {/* Room header */}
        <div className="rp__header">
          <div className="rp__header-left">
            <button className="rp__back" onClick={() => navigate(-1)}>
              ←
            </button>
            <div>
              <div className="rp__header-title">
                {room.name}
                <span className="rp__game-badge">{room.game}</span>
              </div>
              <div className="rp__header-meta">
                <span
                  className={`rp__style-badge rp__style-badge--${room.game_style === "Competitivo" ? "comp" : "casual"}`}
                >
                  {room.game_style === "Competitivo" ? "⚔️" : "🎮"}{" "}
                  {room.game_style ?? room.style}
                </span>
                <span
                  className={`rp__status ${full ? "rp__status--full" : "rp__status--open"}`}
                >
                  {full ? "● Cheia" : "● Aberta"}
                </span>
                <SlotBar
                  members={members.length}
                  slots={room.max_slots ?? room.slots}
                />
              </div>
            </div>
          </div>

          <div className="rp__header-actions">
            {isOwner && (
              <div className="owner-drop-wrap" ref={ownerDropRef}>
                <button
                  className="btn-manage"
                  onClick={() => setOwnerDrop((v) => !v)}
                >
                  <ISettings /> Gerenciar <IChevron />
                </button>
                {ownerDrop && (
                  <div className="owner-drop">
                    <button
                      onClick={() => {
                        setModal("edit");
                        setOwnerDrop(false);
                      }}
                    >
                      <IEdit /> Editar sala
                    </button>
                    <div className="owner-drop__div" />
                    <button
                      className="owner-drop__danger"
                      onClick={() => {
                        setModal("delete");
                        setOwnerDrop(false);
                      }}
                    >
                      <ITrash /> Excluir sala
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 🌟 ALTERAÇÃO AQUI: Botão dinâmico para Dono vs Membro comum */}
            {isOwner ? (
              <button
                className="btn-leave btn-leave--danger"
                onClick={() => setModal("delete")}
              >
                <ITrash /> Excluir sala
              </button>
            ) : (
              <button className="btn-leave" onClick={leaveRoom}>
                <IExit /> Sair da sala
              </button>
            )}
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="mobile-tabs">
          {[
            ["info", "ℹ️ Info"],
            ["chat", "💬 Chat"],
            ["members", "👥 Membros"],
          ].map(([id, label]) => (
            <button
              key={id}
              className={`mobile-tab ${mobileTab === id ? "mobile-tab--on" : ""}`}
              onClick={() => setMobileTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 3-column body */}
        <div className="rp__body">
          {/* LEFT: Info + Members */}
          <aside
            className={`rp__left ${mobileTab === "info" || mobileTab === "members" ? "rp__col--visible" : ""}`}
          >
            <div
              className={`rp__panel ${mobileTab === "members" ? "rp__panel--hidden-mobile" : ""}`}
            >
              <div className="rp__panel-title">Informações da sala</div>
              <div className="info-grid">
                {[
                  ["🎯", "Estilo", room.game_style ?? room.style],
                  ["🕐", "Horário", room.schedule],
                  ["🏅", "Rank mín.", room.rank_min],
                  ["🏆", "Rank máx.", room.rank_max],
                  ["🌐", "Idioma", room.language],
                  [
                    "🎙️",
                    "Microfone",
                    room.mic_required ? "Obrigatório" : "Opcional",
                  ],
                ].map(([ic, lb, vl]) => (
                  <div key={lb} className="info-item">
                    <span className="info-item__icon">{ic}</span>
                    <div>
                      <div className="info-item__label">{lb}</div>
                      <div className="info-item__value">{vl ?? "—"}</div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="info-desc">{room.bio ?? room.description}</p>
              <div className="info-tags">
                {(room.tags ?? []).map((t) => (
                  <span key={t} className="info-tag">
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            <div className="rp__panel">
              <div className="rp__panel-title">
                Membros
                <span className="rp__panel-count">
                  {members.length}/{room.max_slots ?? room.slots}
                </span>
              </div>
              <div className="members-list">
                {members.map((m) => (
                  <MemberItem
                    key={m.id}
                    member={m}
                    isOwner={Number(m.id) === Number(room.creator_id)}
                    currentUserIsOwner={isOwner}
                    onKick={openKick}
                    onPromote={promoteOwner}
                  />
                ))}
              </div>
            </div>
          </aside>

          {/* CENTER: Chat */}
          <main
            className={`rp__chat ${mobileTab === "chat" ? "rp__col--visible" : ""}`}
          >
            <div className="chat-messages">
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  msg={msg}
                  currentProfileId={user?.profileId}
                />
              ))}
              <div ref={chatEndRef} />
            </div>

            <div className="chat-input-wrap">
              <textarea
                className="chat-input"
                placeholder="Enviar mensagem... (Enter para enviar)"
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, 500))}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <div className="chat-input-footer">
                <span className="chat-char">{text.length}/500</span>
                <button
                  className="btn-send"
                  onClick={sendMessage}
                  disabled={!text.trim()}
                >
                  <ISend /> Enviar
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
