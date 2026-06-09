import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../models/authContext.jsx";
import "../assets/css/admin.css";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getToken() {
  return (
    JSON.parse(localStorage.getItem("@Matchup:user") || "{}").token ||
    localStorage.getItem("@Matchup:token") ||
    ""
  );
}

async function adminFetch(path, options = {}) {
  const token = getToken();
  const res = await fetch(`/api/admin${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const json = await res.json();
  return { ok: res.ok, status: res.status, ...json };
}

// ─── Dados mock usados como fallback quando a API não está disponível ─────────
const MOCK = {
  users: Array.from({ length: 8 }, (_, i) => ({
    id: `mock-user-${i + 1}`,
    email: `user${i + 1}@mail.com`,
    nickname: `Player${i + 1}`,
    created_at: `2025-0${(i % 9) + 1}-${String((i % 28) + 1).padStart(2, "0")}`,
  })),
  profiles: Array.from({ length: 8 }, (_, i) => ({
    id: `mock-user-${i + 1}`,
    nickname: ["GhostReaper","LunaStrike","SkyWarden","NovaPulse","IronVeil","CipherX","PixelStar","VoidHunter"][i % 8],
    bio: i % 2 === 0 ? "Jogador competitivo focado em rank." : null,
    schedule_availability: ["21h–00h", "Fins de semana", "Madrugada", "Qualquer horário"][i % 4],
    created_at: `2025-0${(i % 9) + 1}-${String((i % 28) + 1).padStart(2, "0")}`,
  })),
  games: [
    { id:1, name:"Valorant",          genre:"FPS",           rooms_count:142 },
    { id:2, name:"League of Legends", genre:"MOBA",          rooms_count:98  },
    { id:3, name:"CS2",               genre:"FPS",           rooms_count:87  },
    { id:4, name:"Apex Legends",      genre:"Battle Royale", rooms_count:63  },
    { id:5, name:"Rainbow Six Siege", genre:"FPS",           rooms_count:55  },
    { id:6, name:"Rocket League",     genre:"Esporte",       rooms_count:44  },
    { id:7, name:"Dota 2",            genre:"MOBA",          rooms_count:39  },
    { id:8, name:"Overwatch 2",       genre:"FPS",           rooms_count:36  },
    { id:9, name:"Fortnite",          genre:"Battle Royale", rooms_count:31  },
    { id:10,name:"Minecraft",         genre:"Sandbox",       rooms_count:19  },
    { id:11,name:"FIFA 25",           genre:"Esporte",       rooms_count:17  },
    { id:12,name:"World of Warcraft", genre:"MMORPG",        rooms_count:15  },
  ],
  groups: Array.from({ length: 6 }, (_, i) => ({
    id: i + 1,
    name: ["Rank até Imortal","Casual fins de semana","Trio Duelist","Full team 5v5","Noturno intenso","Aprendendo"][i],
    game_name: ["Valorant","LoL","CS2","Apex","R6S","Minecraft"][i],
    creator_id: `mock-user-${i + 1}`,
    max_slots: 5,
    members_count: (i % 4) + 1,
    created_at: `2025-0${i + 1}-01`,
  })),
  group_members: Array.from({ length: 12 }, (_, i) => ({
    group_id: (i % 6) + 1,
    profile_id: `mock-user-${(i % 8) + 1}`,
    nickname: ["GhostReaper","LunaStrike","SkyWarden","NovaPulse","IronVeil","CipherX","PixelStar","VoidHunter"][i % 8],
    group_name: ["Rank até Imortal","Casual fins de semana","Trio Duelist","Full team 5v5","Noturno intenso","Aprendendo"][i % 6],
    role: i % 5 === 0 ? "owner" : "member",
    joined_at: `2025-0${(i % 9) + 1}-${String((i % 28) + 1).padStart(2, "0")}`,
  })),
};

const SECTIONS = [
  { id: "overview",      label: "Visão Geral",  icon: "▦" },
  { id: "users",         label: "Usuários",      icon: "👤" },
  { id: "profiles",      label: "Perfis",        icon: "🪪" },
  { id: "games",         label: "Jogos",         icon: "🎮" },
  { id: "groups",        label: "Salas",         icon: "🏠" },
  { id: "group_members", label: "Membros Salas", icon: "👥" },
];

const GENRES = ["FPS", "MOBA", "Battle Royale", "Esporte", "Sandbox", "MMORPG", "RPG", "Estratégia", "Luta", "Outro"];
const PER_PAGE = 10;

// ─── Ícones SVG ───────────────────────────────────────────────────────────────
const ISearch = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const ITrash  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
const IEdit   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IChevL  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
const IChevR  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;
const ISort   = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="5 12 12 5 19 12"/></svg>;
const IMenu   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;
const IClose  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IPlus   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;

// ─── Stat Card ────────────────────────────────────────────────────────────────
const STAT_META = [
  { key: "users",         label: "Usuários",     icon: "👤", color: "#7c3aed" },
  { key: "profiles",      label: "Perfis",       icon: "🪪", color: "#0ea5e9" },
  { key: "games",         label: "Jogos",        icon: "🎮", color: "#10b981" },
  { key: "groups",        label: "Salas",        icon: "🏠", color: "#f59e0b" },
  { key: "group_members", label: "Membros",      icon: "👥", color: "#ec4899" },
];

function StatCard({ meta, value, index }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let c = 0;
    const step = Math.max(1, Math.ceil(value / 30));
    const t = setInterval(() => {
      c = Math.min(c + step, value);
      setCount(c);
      if (c >= value) clearInterval(t);
    }, 40);
    return () => clearInterval(t);
  }, [value]);

  return (
    <div className="stat-card" style={{ "--accent": meta.color, animationDelay: `${index * 80}ms` }}>
      <div className="stat-card__glow" />
      <div className="stat-card__top">
        <span className="stat-card__icon">{meta.icon}</span>
      </div>
      <div className="stat-card__value">{count.toLocaleString("pt-BR")}</div>
      <div className="stat-card__label">{meta.label}</div>
      <div className="stat-card__bar">
        <div className="stat-card__bar-fill" style={{ background: meta.color }} />
      </div>
    </div>
  );
}

// ─── Paginação ────────────────────────────────────────────────────────────────
function Pagination({ page, total, perPage, onChange }) {
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) return null;
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }
  return (
    <div className="pagination">
      <span className="pagination__info">
        {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} de {total}
      </span>
      <div className="pagination__btns">
        <button className="pg-btn" onClick={() => onChange(page - 1)} disabled={page === 1}><IChevL /></button>
        {pages.map((p, i) =>
          p === "…"
            ? <span key={`d${i}`} className="pg-dots">…</span>
            : <button key={p} className={`pg-btn ${page === p ? "pg-btn--on" : ""}`} onClick={() => onChange(p)}>{p}</button>
        )}
        <button className="pg-btn" onClick={() => onChange(page + 1)} disabled={page === totalPages}><IChevR /></button>
      </div>
    </div>
  );
}

// ─── Modal de Confirmação de Exclusão ─────────────────────────────────────────
function ConfirmModal({ msg, onConfirm, onClose, loading }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__hdr">
          <span className="modal__title">Confirmar exclusão</span>
          <button className="modal__x" onClick={onClose}><IClose /></button>
        </div>
        <div className="modal__body">
          <div className="modal__warn">⚠️ {msg}</div>
        </div>
        <div className="modal__footer">
          <button className="btn-sec" onClick={onClose} disabled={loading}>Cancelar</button>
          <button className="btn-del" onClick={onConfirm} disabled={loading}>
            {loading ? "Excluindo…" : "Excluir"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal de Jogo (criar / editar) ──────────────────────────────────────────
function GameFormModal({ game, onSave, onClose }) {
  const [form, setForm]     = useState({ name: game?.name || "", genre: game?.genre || "", cover_url: game?.cover_url || "" });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.genre.trim()) {
      setError("Nome e gênero são obrigatórios.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      let result;
      if (game) {
        result = await adminFetch(`/games/${game.id}`, {
          method: "PUT",
          body: JSON.stringify({ name: form.name, genre: form.genre, cover_url: form.cover_url || null }),
        });
      } else {
        result = await adminFetch("/games", {
          method: "POST",
          body: JSON.stringify({ name: form.name, genre: form.genre, cover_url: form.cover_url || null }),
        });
      }
      if (!result.ok) {
        setError(result.mensagem || "Erro ao salvar jogo.");
        setLoading(false);
        return;
      }
      onSave(game ? { ...game, ...form } : { id: result.id, ...form, rooms_count: 0 });
    } catch {
      setError("Erro de conexão com a API.");
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--form" onClick={e => e.stopPropagation()}>
        <div className="modal__hdr">
          <span className="modal__title">{game ? "✏️ Editar Jogo" : "🎮 Novo Jogo"}</span>
          <button className="modal__x" onClick={onClose}><IClose /></button>
        </div>
        <form className="modal__body" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nome do jogo *</label>
            <input
              className="form-input"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Ex: Valorant"
              maxLength={100}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Gênero *</label>
            <select
              className="form-input"
              value={form.genre}
              onChange={e => setForm(p => ({ ...p, genre: e.target.value }))}
            >
              <option value="">Selecionar gênero…</option>
              {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">URL da capa (opcional)</label>
            <input
              className="form-input"
              value={form.cover_url}
              onChange={e => setForm(p => ({ ...p, cover_url: e.target.value }))}
              placeholder="https://..."
            />
          </div>
          {error && <div className="form-error">⚠️ {error}</div>}
          <div className="modal__footer" style={{ marginTop: 8 }}>
            <button type="button" className="btn-sec" onClick={onClose} disabled={loading}>Cancelar</button>
            <button type="submit" className="btn-add" disabled={loading}>
              {loading ? "Salvando…" : game ? "Salvar alterações" : "Cadastrar jogo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Tabela genérica ──────────────────────────────────────────────────────────
function Table({ columns, data, onDelete, onEdit, isMock }) {
  const [confirm, setConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    setDeleting(true);
    await onDelete(confirm);
    setDeleting(false);
    setConfirm(null);
  };

  return (
    <>
      {confirm && (
        <ConfirmModal
          msg={`Excluir este registro? Esta ação é irreversível.`}
          onConfirm={confirmDelete}
          onClose={() => setConfirm(null)}
          loading={deleting}
        />
      )}
      {isMock && (
        <div className="mock-banner">
          ⚡ Exibindo dados de demonstração — inicie a API para dados reais
        </div>
      )}
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key} className="tbl__th">
                  <span className="tbl__th-inner">{col.label}{col.sortable !== false && <ISort />}</span>
                </th>
              ))}
              <th className="tbl__th tbl__th--actions">Ações</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr><td colSpan={columns.length + 1} className="tbl__empty">Nenhum registro encontrado</td></tr>
            ) : data.map((row, ri) => (
              <tr key={row.id ?? `${row.group_id}-${row.profile_id}`} className="tbl__row" style={{ animationDelay: `${ri * 30}ms` }}>
                {columns.map(col => (
                  <td key={col.key} className="tbl__td">
                    {col.render ? col.render(row[col.key], row) : (
                      <span className={col.mono ? "tbl__mono" : ""}>
                        {row[col.key] === null || row[col.key] === undefined
                          ? <span className="tbl__null">—</span>
                          : String(row[col.key])}
                      </span>
                    )}
                  </td>
                ))}
                <td className="tbl__td tbl__td--actions">
                  <div className="tbl__action-btns">
                    {onEdit && (
                      <button className="tbl__btn tbl__btn--edit" title="Editar" onClick={() => onEdit(row)}>
                        <IEdit />
                      </button>
                    )}
                    <button className="tbl__btn tbl__btn--del" title="Excluir" onClick={() => setConfirm(row)}>
                      <ITrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ─── Definição de colunas por seção ──────────────────────────────────────────
const COLS = {
  users: [
    { key: "id",         label: "#",         mono: true },
    { key: "email",      label: "E-mail" },
    { key: "nickname",   label: "Nickname" },
    { key: "created_at", label: "Criado em",  render: v => <span className="tbl__date">{v}</span> },
  ],
  profiles: [
    { key: "id",                    label: "#",         mono: true },
    { key: "nickname",              label: "Nickname",  render: v => <span className="tbl__nick"><span className="tbl__nick-av">{v?.[0] ?? "?"}</span>{v}</span> },
    { key: "schedule_availability", label: "Horário" },
    { key: "bio",                   label: "Bio",       render: v => v ? <span className="tbl__clamp">{v}</span> : <span className="tbl__null">—</span> },
    { key: "created_at",            label: "Criado em", render: v => <span className="tbl__date">{v}</span> },
  ],
  games: [
    { key: "id",          label: "#",       mono: true },
    { key: "name",        label: "Nome",    render: v => <strong style={{ color: "#f1f5f9" }}>{v}</strong> },
    { key: "genre",       label: "Gênero",  render: v => <span className="tbl__genre">{v}</span> },
    { key: "rooms_count", label: "Salas",   render: v => <span className="tbl__num">{v}</span> },
  ],
  groups: [
    { key: "id",           label: "#",        mono: true },
    { key: "name",         label: "Nome" },
    { key: "game_name",    label: "Jogo" },
    { key: "members_count",label: "Membros",  render: (v, row) => <span className="tbl__num">{v}/{row.max_slots}</span> },
    { key: "created_at",   label: "Criado em",render: v => <span className="tbl__date">{v}</span> },
  ],
  group_members: [
    { key: "group_id",   label: "Sala ID",    mono: true },
    { key: "group_name", label: "Sala" },
    { key: "nickname",   label: "Jogador" },
    { key: "role",       label: "Papel",      render: v => <span className={`tbl__badge ${v === "owner" ? "tbl__badge--comp" : "tbl__badge--casual"}`}>{v === "owner" ? "👑 Dono" : "Membro"}</span> },
    { key: "joined_at",  label: "Entrou em",  render: v => <span className="tbl__date">{v}</span> },
  ],
};

// ─── SectionView ─────────────────────────────────────────────────────────────
function SectionView({ id, data, isMock, onRefresh }) {
  const [page,   setPage]   = useState(1);
  const [search, setSearch] = useState("");
  const [gameForm, setGameForm] = useState(null); // null | "new" | { ...gameObj }

  const handleDelete = useCallback(async (row) => {
    try {
      let path;
      if (id === "users")         path = `/users/${row.id}`;
      else if (id === "profiles") path = `/profiles/${row.id}`;
      else if (id === "games")    path = `/games/${row.id}`;
      else if (id === "groups")   path = `/groups/${row.id}`;
      else if (id === "group_members") path = `/group-members/${row.group_id}/${row.profile_id}`;

      if (!path) return;
      await adminFetch(path, { method: "DELETE" });
      onRefresh(id);
    } catch {
      // silencia erro de conexão — mock data permanece
    }
  }, [id, onRefresh]);

  const handleSaveGame = useCallback((savedGame) => {
    setGameForm(null);
    onRefresh("games");
  }, [onRefresh]);

  const rows = data[id] ?? [];
  const filtered = rows.filter(row =>
    Object.values(row).some(v => String(v ?? "").toLowerCase().includes(search.toLowerCase()))
  );
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="section-view">
      {gameForm && (
        <GameFormModal
          game={gameForm === "new" ? null : gameForm}
          onSave={handleSaveGame}
          onClose={() => setGameForm(null)}
        />
      )}

      <div className="section-view__controls">
        <div className="sv-search">
          <span className="sv-search__icon"><ISearch /></span>
          <input
            className="sv-search__input"
            placeholder="Filtrar registros..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
          {search && <button className="sv-search__clear" onClick={() => setSearch("")}>✕</button>}
        </div>
        <div className="sv-meta">
          <span className="sv-meta__total">{filtered.length} registro{filtered.length !== 1 ? "s" : ""}</span>
          {id === "games" && (
            <button className="btn-add btn-add--sm" onClick={() => setGameForm("new")}>
              <IPlus /> Novo jogo
            </button>
          )}
        </div>
      </div>

      <Table
        columns={COLS[id] || []}
        data={paginated}
        isMock={isMock}
        onDelete={handleDelete}
        onEdit={id === "games" ? (row) => setGameForm(row) : null}
      />

      <Pagination page={page} total={filtered.length} perPage={PER_PAGE} onChange={setPage} />
    </div>
  );
}

// ─── Visão Geral ──────────────────────────────────────────────────────────────
function Overview({ data, stats }) {
  const recentGroups = (data.groups ?? []).slice(0, 5);
  const recentUsers  = (data.users  ?? []).slice(0, 5);

  return (
    <div className="overview">
      <div className="overview__stats">
        {STAT_META.map((meta, i) => (
          <StatCard key={meta.key} meta={meta} value={stats[meta.key] ?? 0} index={i} />
        ))}
      </div>

      <div className="overview__grid">
        {/* Salas recentes */}
        <div className="ov-panel">
          <div className="ov-panel__title">Salas recentes</div>
          <div className="ov-list">
            {recentGroups.length === 0
              ? <div className="ov-empty">Nenhuma sala ainda.</div>
              : recentGroups.map((g, i) => (
                <div key={g.id ?? i} className="ov-row">
                  <div className="ov-row__icon" style={{ background: "rgba(124,58,237,.2)" }}>🏠</div>
                  <div className="ov-row__info">
                    <span className="ov-row__name">{g.name}</span>
                    <span className="ov-row__sub">{g.game_name} · {g.members_count}/{g.max_slots}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Usuários recentes */}
        <div className="ov-panel">
          <div className="ov-panel__title">Usuários recentes</div>
          <div className="ov-list">
            {recentUsers.length === 0
              ? <div className="ov-empty">Nenhum usuário ainda.</div>
              : recentUsers.map((u, i) => (
                <div key={u.id ?? i} className="ov-row">
                  <div className="ov-row__icon" style={{ background: "rgba(124,58,237,.2)", color: "#c084fc", fontSize: 12, fontWeight: 700 }}>
                    {String(u.nickname?.[0] ?? "#").toUpperCase()}
                  </div>
                  <div className="ov-row__info">
                    <span className="ov-row__name">{u.email}</span>
                    <span className="ov-row__sub">{u.nickname} · {u.created_at}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Jogos por salas */}
        <div className="ov-panel">
          <div className="ov-panel__title">Jogos por salas ativas</div>
          <div className="ov-bars">
            {(data.games ?? []).slice(0, 6).map(g => {
              const max = Math.max(...(data.games ?? [{ rooms_count: 1 }]).map(x => x.rooms_count), 1);
              return (
                <div key={g.id} className="ov-bar-row">
                  <span className="ov-bar-label">{g.name}</span>
                  <div className="ov-bar-track">
                    <div className="ov-bar-fill" style={{ width: `${(g.rooms_count / max) * 100}%` }} />
                  </div>
                  <span className="ov-bar-val">{g.rooms_count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Distribuição de papéis */}
        <div className="ov-panel">
          <div className="ov-panel__title">Distribuição de papéis</div>
          <div className="ov-donut-wrap">
            <div className="ov-donut">
              <div className="ov-donut__inner">
                <span className="ov-donut__num">{(data.group_members ?? []).length}</span>
                <span className="ov-donut__lbl">total</span>
              </div>
            </div>
            <div className="ov-donut-legend">
              {[
                { label: "Donos",   count: (data.group_members ?? []).filter(m => m.role === "owner").length,  color: "#7c3aed" },
                { label: "Membros", count: (data.group_members ?? []).filter(m => m.role === "member").length, color: "#0ea5e9" },
              ].map(item => (
                <div key={item.label} className="ov-legend-row">
                  <span className="ov-legend-dot" style={{ background: item.color }} />
                  <span className="ov-legend-label">{item.label}</span>
                  <span className="ov-legend-val">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Dashboard (componente principal) ───────────────────────────────────
export default function AdminDashboard() {
  const { user } = useAuth();

  const [active,   setActive]   = useState("overview");
  const [sideOpen, setSideOpen] = useState(true);
  const [data,     setData]     = useState(MOCK);
  const [stats,    setStats]    = useState({ users: 0, profiles: 0, games: 12, groups: 0, group_members: 0 });
  const [isMock,   setIsMock]   = useState(true);
  const [loading,  setLoading]  = useState(true);

  const fetchSection = useCallback(async (section) => {
    try {
      const res = await adminFetch(`/${section === "group_members" ? "group-members" : section}`);
      if (res.ok && res.dados) {
        setData(prev => ({ ...prev, [section]: res.dados }));
        setIsMock(false);
      }
    } catch {
      // mantém mock
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await adminFetch("/stats");
      if (res.ok && res.dados) {
        setStats(res.dados);
        setIsMock(false);
      }
    } catch {
      // mantém stats padrão
    }
  }, []);

  // Carrega todos os dados na montagem
  useEffect(() => {
    const sections = ["users", "profiles", "games", "groups", "group_members"];
    Promise.all([
      fetchStats(),
      ...sections.map(fetchSection),
    ]).finally(() => setLoading(false));
  }, [fetchSection, fetchStats]);

  // Recarrega uma seção específica (chamado após create/delete)
  const handleRefresh = useCallback((section) => {
    if (section === "overview") {
      fetchStats();
    } else {
      fetchSection(section);
      fetchStats();
    }
  }, [fetchSection, fetchStats]);

  const activeSection = SECTIONS.find(s => s.id === active);

  return (
    <div className="admin">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');`}</style>

      {/* ── Top bar ── */}
      <header className="admin-topbar">
        <div className="admin-topbar__left">
          <button className="admin-topbar__menu" onClick={() => setSideOpen(v => !v)}><IMenu /></button>
          <div className="admin-topbar__brand">
            <span className="admin-topbar__logo">⚡</span>
            <span className="admin-topbar__name">Matchup <span className="admin-topbar__tag">Admin</span></span>
          </div>
        </div>
        <div className="admin-topbar__right">
          <div className="admin-topbar__user">
            <div className="admin-topbar__av">
              {String(user?.nickname?.[0] ?? user?.email?.[0] ?? "A").toUpperCase()}
            </div>
            <div className="admin-topbar__user-info">
              <span className="admin-topbar__nick">{user?.nickname ?? user?.email ?? "admin"}</span>
              <span className="admin-topbar__role">Administrador</span>
            </div>
          </div>
        </div>
      </header>

      <div className="admin-body">
        {/* ── Sidebar ── */}
        <aside className={`admin-side ${sideOpen ? "admin-side--open" : "admin-side--closed"}`}>
          <div className="admin-side__inner">
            <div className="admin-side__section-label">Navegação</div>
            <nav className="admin-nav">
              {SECTIONS.map(s => (
                <button
                  key={s.id}
                  className={`admin-nav__item ${active === s.id ? "admin-nav__item--active" : ""}`}
                  onClick={() => setActive(s.id)}
                >
                  <span className="admin-nav__icon">{s.icon}</span>
                  {sideOpen && <span className="admin-nav__label">{s.label}</span>}
                  {sideOpen && active === s.id && <span className="admin-nav__active-dot" />}
                </button>
              ))}
            </nav>

            {sideOpen && (
              <>
                <div className="admin-side__divider" />
                <div className="admin-side__section-label">Banco de dados</div>
                <div className="admin-side__db-info">
                  {[
                    { table: "users",         count: stats.users         ?? (data.users?.length ?? 0) },
                    { table: "profiles",      count: stats.profiles      ?? (data.profiles?.length ?? 0) },
                    { table: "games",         count: stats.games         ?? (data.games?.length ?? 0) },
                    { table: "groups",        count: stats.groups        ?? (data.groups?.length ?? 0) },
                    { table: "group_members", count: stats.group_members ?? (data.group_members?.length ?? 0) },
                  ].map(t => (
                    <div key={t.table} className="db-row"
                      onClick={() => setActive(t.table === "groups" ? "groups" : t.table)}>
                      <span className="db-row__table">{t.table}</span>
                      <span className="db-row__count">{t.count}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </aside>

        {/* ── Conteúdo principal ── */}
        <main className="admin-main">
          <div className="admin-main__header">
            <div>
              <h1 className="admin-main__title">
                {loading ? "⏳" : activeSection?.icon} {activeSection?.label}
              </h1>
              <p className="admin-main__sub">
                {active === "overview"
                  ? `Visão consolidada · ${isMock ? "dados de demonstração" : "dados em tempo real"}`
                  : `Gerenciar tabela · ${active}`}
              </p>
            </div>
            {active === "games" && (
              <button className="btn-add" onClick={() => setActive("games")}>
                <IPlus /> Gerenciar jogos
              </button>
            )}
          </div>

          <div className="admin-main__content">
            {loading ? (
              <div className="admin-loading">
                <div className="players-spinner" />
                <span>Carregando dados…</span>
              </div>
            ) : active === "overview" ? (
              <Overview data={data} stats={stats} />
            ) : (
              <SectionView
                id={active}
                data={data}
                isMock={isMock}
                onRefresh={handleRefresh}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
