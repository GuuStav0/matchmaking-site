import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../assets/actions/header.jsx";
import { Popup } from "../assets/actions/PopUp.jsx";
import "../assets/css/roomDetail.css";

// ─── MOCK ─────────────────────────────────────────────────────────────────────
const CURRENT_USER = { id: 1, nickname: "GhostReaper", avatar: null };

const MOCK_ROOM = {
  id: 1,
  name: "Rank até Imortal",
  game: "Valorant",
  style: "Competitivo",
  status: "open",
  slots: 5,
  rank_min: "Diamante",
  rank_max: "Imortal",
  schedule: "21h–00h",
  language: "PT-BR",
  mic_required: true,
  description: "Grupo focado em subir no rank sem tiltar. Queremos jogadores que entendam de roles, calls no voice e que não abandonem em situação de desvantagem. Sem drama, sem flame.",
  tags: ["Sem tilt", "Com voz", "Focado em rank"],
  owner_id: 1,
  members: [
    { id: 1, nickname: "GhostReaper", avatar: null, online: true },
    { id: 2, nickname: "LunaStrike",  avatar: null, online: true },
    { id: 3, nickname: "SkyWarden",   avatar: null, online: false },
    { id: 4, nickname: "NovaPulse",   avatar: null, online: true },
  ],
};

const MOCK_MESSAGES = [
  { id: 1, type: "system",  content: "GhostReaper criou a sala.",           created_at: "20:10" },
  { id: 2, type: "system",  content: "LunaStrike entrou na sala.",          created_at: "20:12" },
  { id: 3, user_id: 2, nickname: "LunaStrike", content: "Oi pessoal! Prontos pra rankar?",  created_at: "20:13" },
  { id: 4, user_id: 1, nickname: "GhostReaper", content: "Sim! Hoje a gente chega em Imortal.", created_at: "20:14" },
  { id: 5, type: "system",  content: "SkyWarden entrou na sala.",           created_at: "20:15" },
  { id: 6, user_id: 3, nickname: "SkyWarden",  content: "Vamos nessa, já tô no cliente.",  created_at: "20:16" },
  { id: 7, user_id: 2, nickname: "LunaStrike", content: "Qual agente cada um vai de hoje?", created_at: "20:17" },
  { id: 8, user_id: 1, nickname: "GhostReaper", content: "Vou de Omen. Alguém vai de duelist?", created_at: "20:18" },
  { id: 9, type: "system",  content: "NovaPulse entrou na sala.",           created_at: "20:20" },
  { id:10, user_id: 4, nickname: "NovaPulse", content: "Oi! Posso ir de Jett se precisar.", created_at: "20:21" },
];

// ─── UTILS ────────────────────────────────────────────────────────────────────
const avatar = (nick, size = 32) => (
  <div className="av" style={{ width: size, height: size, fontSize: size * 0.42 }}>
    {nick[0].toUpperCase()}
  </div>
);

const now = () => new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

// ─── ICONS ───────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {d.map((p, i) => <path key={i} d={p} />)}
  </svg>
);
const IExit    = () => <Icon d={["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4","M16 17l5-5-5-5","M21 12H9"]} />;
const ISettings= () => <Icon d={["M12 20h9","M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"]} />;
const ISend    = () => <Icon d={["M22 2L11 13","M22 2L15 22l-4-9-9-4 20-7z"]} />;
const IKick    = () => <Icon d={["M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2","M23 21v-2a4 4 0 0 0-3-3.87","M16 3.13a4 4 0 0 1 0 7.75","M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"]} />;
const ICrown   = () => <Icon d={["M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"]} />;
const ITrash   = () => <Icon d={["M3 6h18","M8 6V4h8v2","M19 6l-1 14H6L5 6"]} />;
const ISearch  = () => <Icon d={["M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z","M21 21l-4.35-4.35"]} />;
const IClose   = () => <Icon d={["M18 6L6 18","M6 6l12 12"]} />;
const ICheck   = () => <Icon d={["M20 6L9 17l-5-5"]} />;
const IPlus    = () => <Icon d={["M12 5v14","M5 12h14"]} />;
const IEdit    = () => <Icon d={["M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7","M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"]} />;
const IChevron = () => <Icon d={["M6 9l6 6 6-6"]} />;

// ─── SLOT BAR ─────────────────────────────────────────────────────────────────
function SlotBar({ members, slots }) {
  const pct   = (members / slots) * 100;
  const color = members === slots ? "#ef4444" : pct >= 80 ? "#f59e0b" : "#22c55e";
  return (
    <div className="slotbar">
      <div className="slotbar__track">
        <div className="slotbar__fill" style={{ width: `${pct}%`, background: color }} />
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
    const esc = e => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal ${danger ? "modal--danger" : ""}`} onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h3 className="modal__title">{title}</h3>
          <button className="modal__close" onClick={onClose}><IClose /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── MODAL: EDIT ROOM ─────────────────────────────────────────────────────────
function EditModal({ room, onClose, onSave }) {
  const [form, setForm] = useState({
    name:         room.name,
    description:  room.description,
    style:        room.style,
    rank_min:     room.rank_min,
    rank_max:     room.rank_max,
    schedule:     room.schedule,
    slots:        room.slots,
    mic_required: room.mic_required,
    status:       room.status,
    tags:         [...room.tags],
  });
  const [tagInput, setTagInput] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t) && form.tags.length < 6) {
      set("tags", [...form.tags, t]);
      setTagInput("");
    }
  };

  const removeTag = t => set("tags", form.tags.filter(x => x !== t));

  const RANKS = ["Qualquer","Ferro","Bronze","Prata","Ouro","Platina","Diamante","Imortal","Radiante"];
  const STYLES = ["Competitivo", "Casual"];

  return (
    <Modal title="Editar sala" onClose={onClose}>
      <div className="modal__body">
        <div className="form-grid">
          <div className="form-field form-field--full">
            <label className="form-label">Nome da sala</label>
            <input className="form-input" value={form.name} onChange={e => set("name", e.target.value)} maxLength={60} />
          </div>
          <div className="form-field form-field--full">
            <label className="form-label">Descrição</label>
            <textarea className="form-textarea" value={form.description} onChange={e => set("description", e.target.value)} rows={3} maxLength={300} />
          </div>
          <div className="form-field">
            <label className="form-label">Estilo</label>
            <select className="form-select" value={form.style} onChange={e => set("style", e.target.value)}>
              {STYLES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Vagas (slots)</label>
            <select className="form-select" value={form.slots} onChange={e => set("slots", Number(e.target.value))}>
              {[2,3,4,5].map(n => <option key={n} value={n}>{n} jogadores</option>)}
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Rank mínimo</label>
            <select className="form-select" value={form.rank_min} onChange={e => set("rank_min", e.target.value)}>
              {RANKS.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Rank máximo</label>
            <select className="form-select" value={form.rank_max} onChange={e => set("rank_max", e.target.value)}>
              {RANKS.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Horário</label>
            <input className="form-input" value={form.schedule} onChange={e => set("schedule", e.target.value)} placeholder="ex: 21h–00h" />
          </div>
          <div className="form-field">
            <label className="form-label">Status</label>
            <select className="form-select" value={form.status} onChange={e => set("status", e.target.value)}>
              <option value="open">Aberta</option>
              <option value="closed">Fechada</option>
            </select>
          </div>
          <div className="form-field form-field--row">
            <label className="form-label">Microfone obrigatório</label>
            <button className={`toggle ${form.mic_required ? "toggle--on" : ""}`} onClick={() => set("mic_required", !form.mic_required)}>
              <span className="toggle__knob" />
            </button>
          </div>
          <div className="form-field form-field--full">
            <label className="form-label">Tags (máx. 6)</label>
            <div className="tag-input-row">
              <input
                className="form-input"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())}
                placeholder="Digite e pressione Enter"
                maxLength={20}
              />
              <button className="btn-icon" onClick={addTag}><IPlus /></button>
            </div>
            <div className="tag-chips">
              {form.tags.map(t => (
                <span key={t} className="tag-chip">
                  #{t}
                  <button className="tag-chip__remove" onClick={() => removeTag(t)}>×</button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="modal__footer">
        <button className="btn-secondary" onClick={onClose}>Cancelar</button>
        <button className="btn-primary" onClick={() => onSave(form)}>Salvar alterações</button>
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
          <p>Esta ação é <strong>permanente</strong> e encerrará o grupo para todos os membros. A sala <strong>"{roomName}"</strong> será removida e não poderá ser recuperada.</p>
        </div>
      </div>
      <div className="modal__footer">
        <button className="btn-secondary" onClick={onClose}>Cancelar</button>
        <button className="btn-danger" onClick={onConfirm}>Excluir sala</button>
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
          <p>Tem certeza que deseja expulsar <strong>{member.nickname}</strong> da sala?</p>
        </div>
      </div>
      <div className="modal__footer">
        <button className="btn-secondary" onClick={onClose}>Cancelar</button>
        <button className="btn-danger" onClick={() => onConfirm(member.id)}>Expulsar</button>
      </div>
    </Modal>
  );
}

// ─── MODAL: INVITE ────────────────────────────────────────────────────────────
const MOCK_SEARCH = [
  { id: 10, nickname: "CipherX" },
  { id: 11, nickname: "PixelStar" },
  { id: 12, nickname: "VoidHunter" },
  { id: 13, nickname: "NeonRaider" },
];

function InviteModal({ onClose, onInvite, currentMembers }) {
  const [q, setQ]           = useState("");
  const [results, setResults] = useState([]);
  const [invited, setInvited] = useState([]);

  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    const ids = currentMembers.map(m => m.id);
    setResults(MOCK_SEARCH.filter(u =>
      u.nickname.toLowerCase().includes(q.toLowerCase()) && !ids.includes(u.id)
    ));
  }, [q, currentMembers]);

  const handleInvite = (user) => {
    setInvited(v => [...v, user.id]);
    onInvite(user);
  };

  return (
    <Modal title="Convidar jogador" onClose={onClose}>
      <div className="modal__body">
        <div className="invite-search">
          <span className="invite-search__icon"><ISearch /></span>
          <input
            className="form-input"
            style={{ paddingLeft: 36 }}
            placeholder="Buscar por nickname..."
            value={q}
            onChange={e => setQ(e.target.value)}
            autoFocus
          />
        </div>
        <div className="invite-results">
          {!q && <p className="invite-hint">Digite o nickname do jogador para buscar.</p>}
          {q && results.length === 0 && <p className="invite-hint">Nenhum jogador encontrado.</p>}
          {results.map(u => (
            <div key={u.id} className="invite-row">
              {avatar(u.nickname, 32)}
              <span className="invite-nick">{u.nickname}</span>
              {invited.includes(u.id)
                ? <span className="invite-sent"><ICheck /> Convidado</span>
                : <button className="btn-primary btn--sm" onClick={() => handleInvite(u)}>Convidar</button>
              }
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

// ─── MEMBER ITEM ──────────────────────────────────────────────────────────────
function MemberItem({ member, isOwner, currentUserIsOwner, onKick, onPromote }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div className={`member-item ${member.online ? "" : "member-item--offline"}`} ref={ref}>
      <div className="member-item__av-wrap">
        {avatar(member.nickname, 32)}
        <span className={`member-item__dot ${member.online ? "member-item__dot--on" : ""}`} />
      </div>
      <div className="member-item__info">
        <span className="member-item__nick">{member.nickname}</span>
        {isOwner && <span className="member-item__crown">👑</span>}
      </div>
      <span className="member-item__status">{member.online ? "online" : "offline"}</span>

      {currentUserIsOwner && !isOwner && (
        <div className="member-item__actions">
          <button className="member-item__dots" onClick={() => setMenuOpen(v => !v)}>⋯</button>
          {menuOpen && (
            <div className="member-mini-menu">
              <button onClick={() => { onPromote(member); setMenuOpen(false); }}>
                <ICrown /> Promover a dono
              </button>
              <button className="member-mini-menu__danger" onClick={() => { onKick(member); setMenuOpen(false); }}>
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
function ChatMessage({ msg, isOwn }) {
  if (msg.type === "system") {
    return <div className="msg-system">{msg.content}</div>;
  }
  return (
    <div className={`msg ${isOwn ? "msg--own" : ""}`}>
      {!isOwn && (
        <div className="msg__av-wrap">
          {avatar(msg.nickname, 28)}
        </div>
      )}
      <div className="msg__body">
        {!isOwn && <span className="msg__nick">{msg.nickname}</span>}
        <div className={`msg__bubble ${isOwn ? "msg__bubble--own" : ""}`}>
          {msg.content}
        </div>
        <span className="msg__time">{msg.created_at}</span>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function RoomDetail() {
  const { roomId } = useParams();
  const navigate   = useNavigate();

  const [room,      setRoom]      = useState(MOCK_ROOM);
  const [messages,  setMessages]  = useState(MOCK_MESSAGES);
  const [members,   setMembers]   = useState(MOCK_ROOM.members);
  const [text,      setText]      = useState("");
  const [mobileTab, setMobileTab] = useState("chat");

  // 🌟 ESTADOS DO NOVO POPUP
  const [popupOpen, setPopupOpen]       = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType]       = useState("info");

  // Modals
  const [modal, setModal] = useState(null); 
  const [kickTarget, setKickTarget] = useState(null);

  // Owner dropdown
  const [ownerDrop, setOwnerDrop] = useState(false);
  const ownerDropRef = useRef(null);

  const isOwner = room.owner_id === CURRENT_USER.id;
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const h = e => { if (ownerDropRef.current && !ownerDropRef.current.contains(e.target)) setOwnerDrop(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // 🌟 FUNÇÃO REFEITA PARA USAR O SEU COMPONENTE POPUP
  const triggerPopup = useCallback((msg, type = "success") => {
    setPopupMessage(msg);
    setPopupType(type);
    setPopupOpen(true);
  }, []);

  // Send message
  const sendMessage = () => {
    if (!text.trim()) return;
    const newMsg = {
      id: Date.now(),
      user_id: CURRENT_USER.id,
      nickname: CURRENT_USER.nickname,
      content: text.trim(),
      created_at: now(),
    };
    setMessages(m => [...m, newMsg]);
    setText("");
  };

  const handleKeyDown = e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Leave room
  const leaveRoom = () => {
    triggerPopup("Você saiu da sala.", "info");
    setTimeout(() => navigate("/games"), 1200);
  };

  // Edit room
  const saveRoom = (form) => {
    setRoom(r => ({ ...r, ...form }));
    setModal(null);
    triggerPopup("Sala atualizada com sucesso!", "success");
  };

  // Delete room
  const deleteRoom = () => {
    triggerPopup("Sala excluída.", "info");
    setTimeout(() => navigate("/games"), 1200);
  };

  // Kick
  const openKick = (member) => { setKickTarget(member); setModal("kick"); };
  const confirmKick = (userId) => {
    if (!kickTarget) return;
    setMembers(m => m.filter(x => x.id !== userId));
    setMessages(msgs => [...msgs, { id: Date.now(), type: "system", content: `${kickTarget.nickname} foi removido da sala.`, created_at: now() }]);
    triggerPopup(`${kickTarget.nickname} foi expulso.`, "success");
    setModal(null);
    setKickTarget(null);
  };

  // Promote
  const promoteOwner = (member) => {
    setRoom(r => ({ ...r, owner_id: member.id }));
    setMessages(msgs => [...msgs, { id: Date.now(), type: "system", content: `${member.nickname} agora é o dono da sala.`, created_at: now() }]);
    triggerPopup(`${member.nickname} promovido a dono.`, "success");
  };

  // Invite
  const handleInvite = (user) => {
    triggerPopup(`Convite enviado para ${user.nickname}!`, "success");
  };

  const full = members.length >= room.slots;

  return (
    <div className="rp">
      <Header />
      
      {/* 🌟 SEU NOVO COMPONENTE POPUP RENDERIZADO NA TELA */}
      <Popup 
        isOpen={popupOpen} 
        message={popupMessage} 
        type={popupType} 
        onClose={() => setPopupOpen(false)} 
      />

      {/* ── Modals ── */}
      {modal === "edit"   && <EditModal   room={room} onClose={() => setModal(null)} onSave={saveRoom} />}
      {modal === "delete" && <DeleteModal roomName={room.name} onClose={() => setModal(null)} onConfirm={deleteRoom} />}
      
      {/* 🌟 CORREÇÃO DO ERRO DO COGNOME/NICKNAME: Garante que kickTarget existe antes de renderizar o Modal */}
      {modal === "kick"   && kickTarget && <KickModal member={kickTarget} onClose={() => setModal(null)} onConfirm={confirmKick} />}
      
      {modal === "invite" && <InviteModal onClose={() => setModal(null)} onInvite={handleInvite} currentMembers={members} />}

      <div className="rp__wrap">
        
        {/* 🌟 NOVO: ELEMENTOS FLUTUANTES DO FUNDO (IGUAL AO AUTH) */}
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

        {/* ── Room header ── */}
        <div className="rp__header">
          <div className="rp__header-left">
            <button className="rp__back" onClick={() => navigate(-1)}>←</button>
            <div>
              <div className="rp__header-title">
                {room.name}
                <span className="rp__game-badge">{room.game}</span>
              </div>
              <div className="rp__header-meta">
                <span className={`rp__style-badge rp__style-badge--${room.style === "Competitivo" ? "comp" : "casual"}`}>
                  {room.style === "Competitivo" ? "⚔️" : "🎮"} {room.style}
                </span>
                <span className={`rp__status ${full ? "rp__status--full" : "rp__status--open"}`}>
                  {full ? "● Cheia" : "● Aberta"}
                </span>
                <SlotBar members={members.length} slots={room.slots} />
              </div>
            </div>
          </div>

          <div className="rp__header-actions">
            {isOwner && (
              <div className="owner-drop-wrap" ref={ownerDropRef}>
                <button className="btn-manage" onClick={() => setOwnerDrop(v => !v)}>
                  <ISettings /> Gerenciar <IChevron />
                </button>
                {ownerDrop && (
                  <div className="owner-drop">
                    <button onClick={() => { setModal("edit"); setOwnerDrop(false); }}><IEdit /> Editar sala</button>
                    <button onClick={() => { setModal("invite"); setOwnerDrop(false); }}><IPlus /> Convidar jogador</button>
                    <div className="owner-drop__div" />
                    <button className="owner-drop__danger" onClick={() => { setModal("delete"); setOwnerDrop(false); }}><ITrash /> Excluir sala</button>
                  </div>
                )}
              </div>
            )}
            <button className="btn-leave" onClick={leaveRoom}><IExit /> Sair da sala</button>
          </div>
        </div>

        {/* ── Mobile tabs ── */}
        <div className="mobile-tabs">
          {[["info","ℹ️ Info"],["chat","💬 Chat"],["members","👥 Membros"]].map(([id, label]) => (
            <button
              key={id}
              className={`mobile-tab ${mobileTab === id ? "mobile-tab--on" : ""}`}
              onClick={() => setMobileTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── 3-column body ── */}
        <div className="rp__body">

          {/* ── LEFT: Info + Members ── */}
          <aside className={`rp__left ${mobileTab === "info" || mobileTab === "members" ? "rp__col--visible" : ""}`}>

            {/* Info block */}
            <div className={`rp__panel ${mobileTab === "members" ? "rp__panel--hidden-mobile" : ""}`}>
              <div className="rp__panel-title">Informações da sala</div>
              <div className="info-grid">
                {[
                  ["🎯", "Estilo",     room.style],
                  ["🕐", "Horário",    room.schedule],
                  ["🏅", "Rank mín.",  room.rank_min],
                  ["🏆", "Rank máx.",  room.rank_max],
                  ["🌐", "Idioma",     room.language],
                  ["🎙️", "Microfone",  room.mic_required ? "Obrigatório" : "Opcional"],
                ].map(([ic, lb, vl]) => (
                  <div key={lb} className="info-item">
                    <span className="info-item__icon">{ic}</span>
                    <div>
                      <div className="info-item__label">{lb}</div>
                      <div className="info-item__value">{vl}</div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="info-desc">{room.description}</p>
              <div className="info-tags">
                {room.tags.map(t => <span key={t} className="info-tag">#{t}</span>)}
              </div>
            </div>

            {/* Members block */}
            <div className="rp__panel">
              <div className="rp__panel-title">
                Membros
                <span className="rp__panel-count">{members.length}/{room.slots}</span>
              </div>
              <div className="members-list">
                {members.map(m => (
                  <MemberItem
                    key={m.id}
                    member={m}
                    isOwner={m.id === room.owner_id}
                    currentUserIsOwner={isOwner}
                    onKick={openKick}
                    onPromote={promoteOwner}
                  />
                ))}
              </div>
              {isOwner && !full && (
                <button className="btn-invite" onClick={() => setModal("invite")}>
                  <IPlus /> Convidar jogador
                </button>
              )}
            </div>
          </aside>

          {/* ── CENTER: Chat ── */}
          <main className={`rp__chat ${mobileTab === "chat" ? "rp__col--visible" : ""}`}>
            <div className="chat-messages">
              {messages.map(msg => (
                <ChatMessage
                  key={msg.id}
                  msg={msg}
                  isOwn={msg.user_id === CURRENT_USER.id}
                />
              ))}
              <div ref={chatEndRef} />
            </div>

            <div className="chat-input-wrap">
              <textarea
                className="chat-input"
                placeholder="Enviar mensagem... (Enter para enviar)"
                value={text}
                onChange={e => setText(e.target.value.slice(0, 500))}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <div className="chat-input-footer">
                <span className="chat-char">{text.length}/500</span>
                <button className="btn-send" onClick={sendMessage} disabled={!text.trim()}>
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