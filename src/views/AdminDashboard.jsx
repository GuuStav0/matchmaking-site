import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../models/authContext.jsx";
import "../assets/css/admin.css";

const API_BASE = "http://localhost:3000/api";

const SECTIONS = [
  { id: "overview",      label: "Visão Geral",  icon: "▦" },
  { id: "users",         label: "Usuários",      icon: "👤" },
  { id: "profiles",      label: "Perfis",        icon: "🪪" },
  { id: "games",         label: "Jogos",         icon: "🎮" },
  { id: "groups",        label: "Salas",         icon: "🏠" },
  { id: "group_members", label: "Membros Salas", icon: "👥" },
];

const STATS_CONFIG = [
  { key: "users",         label: "Usuários", icon: "👤", color: "#7c3aed" },
  { key: "profiles",      label: "Perfis",   icon: "🪪", color: "#0ea5e9" },
  { key: "games",         label: "Jogos",    icon: "🎮", color: "#10b981" },
  { key: "groups",        label: "Salas",    icon: "🏠", color: "#f59e0b" },
  { key: "group_members", label: "Membros",  icon: "👥", color: "#ec4899" },
];

const PER_PAGE = 10;

// ─── ICONS ────────────────────────────────────────────────────────────────────
const ISearch = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const ITrash  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
const IEdit   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IChevL  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
const IChevR  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;
const ISort   = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="5 12 12 5 19 12"/></svg>;
const IMenu   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;
const IClose  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;

// ─── STAT CARD ────────────────────────────────────────────────────────────────
function StatCard({ stat, index }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let c = 0;
    const step = Math.max(1, Math.ceil(stat.value / 30));
    const t = setInterval(() => {
      c = Math.min(c + step, stat.value);
      setCount(c);
      if (c >= stat.value) clearInterval(t);
    }, 40);
    return () => clearInterval(t);
  }, [stat.value]);

  return (
    <div className="stat-card" style={{ "--accent": stat.color, animationDelay: `${index * 80}ms` }}>
      <div className="stat-card__glow" />
      <div className="stat-card__top">
        <span className="stat-card__icon">{stat.icon}</span>
      </div>
      <div className="stat-card__value">{count.toLocaleString("pt-BR")}</div>
      <div className="stat-card__label">{stat.label}</div>
      <div className="stat-card__bar">
        <div className="stat-card__bar-fill" style={{ background: stat.color }} />
      </div>
    </div>
  );
}

// ─── PAGINATION ───────────────────────────────────────────────────────────────
function Pagination({ page, total, perPage, onChange }) {
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) return null;
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) pages.push(i);
    else if (pages[pages.length - 1] !== "…") pages.push("…");
  }
  return (
    <div className="pagination">
      <span className="pagination__info">
        {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} de {total} registros
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

// ─── CONFIRM MODAL ────────────────────────────────────────────────────────────
function ConfirmModal({ msg, onConfirm, onClose }) {
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
          <button className="btn-sec" onClick={onClose}>Cancelar</button>
          <button className="btn-del" onClick={onConfirm}>Excluir</button>
        </div>
      </div>
    </div>
  );
}

// ─── EDIT MODAL ───────────────────────────────────────────────────────────────
const EDIT_FIELDS = {
  games: [
    { key: "name",      label: "Nome",          type: "text" },
    { key: "image_url", label: "URL da Imagem", type: "text" },
  ],
  groups: [
    { key: "name",       label: "Nome",     type: "text" },
    { key: "bio",        label: "Descrição", type: "textarea" },
    { key: "game_style", label: "Estilo",   type: "select", options: ["Casual", "Competitivo"] },
  ],
  profiles: [
    { key: "nickname", label: "Nickname", type: "text" },
    { key: "bio",      label: "Bio",      type: "textarea" },
  ],
};

function EditModal({ section, row, onSave, onClose }) {
  const fields = EDIT_FIELDS[section];
  const [values, setValues] = useState(() =>
    Object.fromEntries(fields.map(f => [f.key, row[f.key] ?? ""]))
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const ok = await onSave(values);
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div className="modal__hdr">
          <span className="modal__title">Editar registro #{row.id}</span>
          <button className="modal__x" onClick={onClose}><IClose /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal__body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {fields.map(f => (
              <div key={f.key} className="modal__field">
                <label className="modal__label">{f.label}</label>
                {f.type === "textarea" ? (
                  <textarea
                    className="modal__input"
                    rows={3}
                    value={values[f.key]}
                    onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))}
                  />
                ) : f.type === "select" ? (
                  <select
                    className="modal__input"
                    value={values[f.key]}
                    onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))}
                  >
                    {f.options.map(o => <option key={o}>{o}</option>)}
                  </select>
                ) : (
                  <input
                    className="modal__input"
                    type="text"
                    value={values[f.key]}
                    required={f.key === "name" || f.key === "nickname"}
                    onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="modal__footer">
            <button type="button" className="btn-sec" onClick={onClose}>Cancelar</button>
            <button
              type="submit"
              className="btn-del"
              style={{ background: "rgba(124,58,237,0.2)", borderColor: "rgba(124,58,237,0.4)", color: "#c084fc" }}
              disabled={saving}
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── TABLE ────────────────────────────────────────────────────────────────────
function Table({ section, columns, data, onDelete, onEdit }) {
  const [confirm, setConfirm] = useState(null);
  const [editing, setEditing] = useState(null);
  const canEdit = !!onEdit;

  return (
    <>
      {confirm && (
        <ConfirmModal
          msg={`Excluir registro #${confirm.id}? Esta ação é irreversível.`}
          onConfirm={() => { onDelete(confirm); setConfirm(null); }}
          onClose={() => setConfirm(null)}
        />
      )}
      {editing && (
        <EditModal
          section={section}
          row={editing}
          onSave={async (fields) => {
            const ok = await onEdit(editing, fields);
            if (ok) setEditing(null);
            return ok;
          }}
          onClose={() => setEditing(null)}
        />
      )}
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key} className="tbl__th">
                  <span className="tbl__th-inner">
                    {col.label}
                    {col.sortable !== false && <ISort />}
                  </span>
                </th>
              ))}
              <th className="tbl__th tbl__th--actions">Ações</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, ri) => (
              <tr key={row.id ?? ri} className="tbl__row" style={{ animationDelay: `${ri * 30}ms` }}>
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
                    <button
                      className="tbl__btn tbl__btn--edit"
                      title={canEdit ? "Editar" : "Edição não disponível"}
                      onClick={canEdit ? () => setEditing(row) : undefined}
                      disabled={!canEdit}
                      style={!canEdit ? { opacity: 0.3, cursor: "not-allowed" } : {}}
                    >
                      <IEdit />
                    </button>
                    <button
                      className="tbl__btn tbl__btn--del"
                      title="Excluir"
                      onClick={() => setConfirm(row)}
                    >
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

// ─── SECTION VIEW ────────────────────────────────────────────────────────────
const COLS = {
  users: [
    { key: "id",         label: "#",         mono: true },
    { key: "email",      label: "E-mail" },
    { key: "created_at", label: "Criado em",  render: v => <span className="tbl__date">{v}</span> },
  ],
  profiles: [
    { key: "id",                    label: "#",       mono: true },
    { key: "user_id",               label: "user_id", mono: true },
    { key: "nickname",              label: "Nickname", render: v => <span className="tbl__nick"><span className="tbl__nick-av">{(v || "?")[0]}</span>{v}</span> },
    { key: "schedule_availability", label: "Horário" },
    { key: "bio",                   label: "Bio", render: v => v ? <span className="tbl__clamp">{v}</span> : <span className="tbl__null">—</span> },
    { key: "created_at",            label: "Criado em", render: v => <span className="tbl__date">{v}</span> },
  ],
  games: [
    { key: "id",          label: "#",     mono: true },
    { key: "name",        label: "Nome",  render: v => <strong style={{ color: "#f1f5f9" }}>{v}</strong> },
    { key: "genre",       label: "Gênero", render: v => <span className="tbl__genre">{v}</span> },
    { key: "rooms_count", label: "Salas", render: v => <span className="tbl__num">{v}</span> },
  ],
  groups: [
    { key: "id",           label: "#",        mono: true },
    { key: "name",         label: "Nome" },
    { key: "game_name",    label: "Jogo" },
    { key: "owner",        label: "Criador" },
    { key: "style",        label: "Estilo",   render: v => <span className={`tbl__badge tbl__badge--${v === "Competitivo" ? "comp" : "casual"}`}>{v}</span> },
    { key: "members_count",label: "Membros",  render: (v, row) => <span className="tbl__num">{v}/{row.slots ?? row.max_slots}</span> },
    { key: "status",       label: "Status",   render: v => <span className={`tbl__badge tbl__badge--${v === "open" ? "open" : "closed"}`}>{v === "open" ? "Aberta" : "Fechada"}</span> },
    { key: "created_at",   label: "Criado em", render: v => <span className="tbl__date">{v}</span> },
  ],
  group_members: [
    { key: "id",         label: "#",          mono: true },
    { key: "group_id",   label: "group_id",   mono: true },
    { key: "profile_id", label: "profile_id", mono: true },
    { key: "nickname",   label: "Jogador" },
    { key: "group_name", label: "Sala" },
    { key: "role",       label: "Papel", render: v => <span className={`tbl__badge ${v === "owner" ? "tbl__badge--comp" : "tbl__badge--casual"}`}>{v === "owner" ? "👑 Dono" : "Membro"}</span> },
    { key: "joined_at",  label: "Entrou em",  render: v => <span className="tbl__date">{v}</span> },
  ],
};

function SectionView({ id, rows, loading, onDelete, onEdit }) {
  const [page,   setPage]   = useState(1);
  const [search, setSearch] = useState("");

  const EDITABLE = ["games", "groups", "profiles"];

  const filtered = rows.filter(row =>
    Object.values(row).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
  );
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  if (loading) {
    return (
      <div style={{ textAlign: "center", color: "#475569", padding: "48px 0", fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
        Carregando dados...
      </div>
    );
  }

  return (
    <div className="section-view">
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
        </div>
      </div>

      <Table
        section={id}
        columns={COLS[id] || []}
        data={paginated}
        onDelete={row => onDelete(id, row)}
        onEdit={EDITABLE.includes(id) ? (row, fields) => onEdit(id, row, fields) : null}
      />

      <Pagination page={page} total={filtered.length} perPage={PER_PAGE} onChange={setPage} />
    </div>
  );
}

// ─── OVERVIEW ─────────────────────────────────────────────────────────────────
function Overview({ stats, overviewData }) {
  const statCards = STATS_CONFIG.map(s => ({ ...s, value: stats[s.key] ?? 0 }));
  const { recentGroups, recentUsers, games, group_members } = overviewData;
  const maxRooms = games[0]?.rooms_count || 1;

  return (
    <div className="overview">
      <div className="overview__stats">
        {statCards.map((s, i) => <StatCard key={s.key} stat={s} index={i} />)}
      </div>

      <div className="overview__grid">
        <div className="ov-panel">
          <div className="ov-panel__title">Salas recentes</div>
          <div className="ov-list">
            {recentGroups.length === 0
              ? <span style={{ color: "#334155", fontSize: 12 }}>Nenhuma sala criada.</span>
              : recentGroups.map(g => (
                <div key={g.id} className="ov-row">
                  <div className="ov-row__icon" style={{ background: g.style === "Competitivo" ? "rgba(124,58,237,.2)" : "rgba(14,165,233,.15)" }}>
                    {g.style === "Competitivo" ? "⚔️" : "🎮"}
                  </div>
                  <div className="ov-row__info">
                    <span className="ov-row__name">{g.name}</span>
                    <span className="ov-row__sub">{g.game_name} · {g.members_count}/{g.slots ?? g.max_slots}</span>
                  </div>
                  <span className={`tbl__badge tbl__badge--${g.status === "open" ? "open" : "closed"}`} style={{ fontSize: 10 }}>
                    {g.status === "open" ? "Aberta" : "Fechada"}
                  </span>
                </div>
              ))
            }
          </div>
        </div>

        <div className="ov-panel">
          <div className="ov-panel__title">Usuários recentes</div>
          <div className="ov-list">
            {recentUsers.length === 0
              ? <span style={{ color: "#334155", fontSize: 12 }}>Nenhum usuário ainda.</span>
              : recentUsers.map(u => (
                <div key={u.id} className="ov-row">
                  <div className="ov-row__icon" style={{ background: "rgba(124,58,237,.2)", color: "#c084fc", fontSize: 12, fontWeight: 700 }}>
                    #{u.id}
                  </div>
                  <div className="ov-row__info">
                    <span className="ov-row__name">{u.email}</span>
                    <span className="ov-row__sub">Criado em {u.created_at}</span>
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        <div className="ov-panel">
          <div className="ov-panel__title">Jogos por salas ativas</div>
          <div className="ov-bars">
            {games.length === 0
              ? <span style={{ color: "#334155", fontSize: 12 }}>Nenhum jogo cadastrado.</span>
              : games.slice(0, 6).map(g => (
                <div key={g.id} className="ov-bar-row">
                  <span className="ov-bar-label">{g.name}</span>
                  <div className="ov-bar-track">
                    <div className="ov-bar-fill" style={{ width: `${(g.rooms_count / maxRooms) * 100}%` }} />
                  </div>
                  <span className="ov-bar-val">{g.rooms_count}</span>
                </div>
              ))
            }
          </div>
        </div>

        <div className="ov-panel">
          <div className="ov-panel__title">Distribuição de papéis</div>
          <div className="ov-donut-wrap">
            <div className="ov-donut">
              <div className="ov-donut__inner">
                <span className="ov-donut__num">{group_members.length}</span>
                <span className="ov-donut__lbl">total</span>
              </div>
            </div>
            <div className="ov-donut-legend">
              {[
                { label: "Donos",   count: group_members.filter(m => m.role === "owner").length,  color: "#7c3aed" },
                { label: "Membros", count: group_members.filter(m => m.role === "member").length, color: "#0ea5e9" },
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

// ─── ADMIN DASHBOARD ──────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate   = useNavigate();
  const { user }   = useAuth();
  const [active,       setActive]       = useState("overview");
  const [stats,        setStats]        = useState({ users: 0, profiles: 0, games: 0, groups: 0, group_members: 0 });
  const [overviewData, setOverviewData] = useState({ recentGroups: [], recentUsers: [], games: [], group_members: [] });
  const [rows,         setRows]         = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [sideOpen,     setSideOpen]     = useState(true);

  // ── Stats ────────────────────────────────────────────────────────────────────
  const fetchStats = useCallback(() => {
    fetch(`${API_BASE}/admin/stats`)
      .then(r => r.json())
      .then(res => { if (res.dados) setStats(res.dados); })
      .catch(console.error);
  }, []);

  // ── Overview data ────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchStats();
    Promise.all([
      fetch(`${API_BASE}/admin/groups`).then(r => r.json()),
      fetch(`${API_BASE}/admin/users`).then(r => r.json()),
      fetch(`${API_BASE}/games`).then(r => r.json()),
      fetch(`${API_BASE}/admin/group-members`).then(r => r.json()),
    ]).then(([groupsRes, usersRes, gamesRes, membersRes]) => {
      setOverviewData({
        recentGroups:  (groupsRes.dados  || []).slice(0, 5),
        recentUsers:   (usersRes.dados   || []).slice(0, 5),
        games:         Array.isArray(gamesRes) ? gamesRes : (gamesRes.dados || []),
        group_members: membersRes.dados  || [],
      });
    }).catch(console.error);
  }, [fetchStats]);

  // ── Section data ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (active === "overview") return;
    setLoading(true);
    setRows([]);

    const SECTION_URLS = {
      users:         `${API_BASE}/admin/users`,
      profiles:      `${API_BASE}/players?limit=500`,
      games:         `${API_BASE}/games`,
      groups:        `${API_BASE}/admin/groups`,
      group_members: `${API_BASE}/admin/group-members`,
    };

    fetch(SECTION_URLS[active])
      .then(r => r.json())
      .then(res => {
        const data = res.dados ?? (Array.isArray(res) ? res : []);
        setRows(data);
        setLoading(false);
      })
      .catch(err => { console.error(err); setLoading(false); });
  }, [active]);

  // ── Delete ───────────────────────────────────────────────────────────────────
  const handleDelete = useCallback(async (sectionId, row) => {
    const cfgMap = {
      users:    { url: `${API_BASE}/users/${row.id}`,        headers: {} },
      profiles: { url: `${API_BASE}/profiles/${row.id}`,     headers: {} },
      games:    { url: `${API_BASE}/games/${row.id}`,        headers: {} },
      groups:   { url: `${API_BASE}/game-groups/${row.id}`,  headers: { "x-profile-id": String(user?.profileId ?? "") } },
      group_members: {
        url: `${API_BASE}/group-members`,
        headers: {},
        body: JSON.stringify({ group_id: row.group_id, profile_id: row.profile_id }),
      },
    };

    const cfg = cfgMap[sectionId];
    if (!cfg) return;

    try {
      const res = await fetch(cfg.url, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...cfg.headers },
        body: cfg.body,
      });
      if (res.ok) {
        setRows(prev => prev.filter(r =>
          sectionId === "group_members"
            ? !(r.group_id === row.group_id && r.profile_id === row.profile_id)
            : r.id !== row.id
        ));
        fetchStats();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.mensagem || "Erro ao excluir registro.");
      }
    } catch (err) {
      console.error("Erro ao deletar:", err);
      alert("Erro de conexão com a API.");
    }
  }, [user, fetchStats]);

  // ── Edit ─────────────────────────────────────────────────────────────────────
  const handleEdit = useCallback(async (sectionId, row, updatedFields) => {
    const cfgMap = {
      games: {
        url:  `${API_BASE}/games/${row.id}`,
        body: { name: updatedFields.name, genre_id: row.genre_id ?? 1, image_url: updatedFields.image_url || null },
      },
      groups: {
        url:  `${API_BASE}/game-groups/${row.id}`,
        body: {
          name:        updatedFields.name,
          bio:         updatedFields.bio || null,
          game_style:  updatedFields.game_style || "Casual",
          max_slots:   row.max_slots ?? row.slots ?? 5,
          rank_min:    row.rank_min  ?? "Livre",
          rank_max:    row.rank_max  ?? "Livre",
          schedule:    row.schedule  ?? null,
          mic_required: row.mic_required ?? 0,
          tags:        row.tags      ?? null,
        },
      },
      profiles: {
        url:  `${API_BASE}/profiles/${row.id}`,
        body: {
          nickname:              updatedFields.nickname,
          bio:                   updatedFields.bio || null,
          avatar_url:            row.avatar_url            ?? null,
          schedule_availability: row.schedule_availability ?? null,
        },
      },
    };

    const cfg = cfgMap[sectionId];
    if (!cfg) return false;

    try {
      const res = await fetch(cfg.url, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(cfg.body),
      });
      if (res.ok) {
        setRows(prev => prev.map(r => r.id === row.id ? { ...r, ...updatedFields } : r));
        return true;
      }
      const err = await res.json().catch(() => ({}));
      alert(err.mensagem || "Erro ao salvar.");
    } catch (err) {
      console.error("Erro ao editar:", err);
      alert("Erro de conexão com a API.");
    }
    return false;
  }, []);

  const activeSection = SECTIONS.find(s => s.id === active);

  const DB_TABLES = [
    { table: "users",         count: stats.users,         section: "users" },
    { table: "profiles",      count: stats.profiles,      section: "profiles" },
    { table: "games",         count: stats.games,         section: "games" },
    { table: "groups",        count: stats.groups,        section: "groups" },
    { table: "group_members", count: stats.group_members, section: "group_members" },
  ];

  return (
    <div className="admin">
      {/* ── Top bar ── */}
      <header className="admin-topbar">
        <div className="admin-topbar__left">
          <button className="admin-topbar__menu" onClick={() => setSideOpen(v => !v)}>
            <IMenu />
          </button>
          <div className="admin-topbar__brand">
            <span className="admin-topbar__logo">⚡</span>
            <span className="admin-topbar__name">Matchup <span className="admin-topbar__tag">Admin</span></span>
          </div>
        </div>
        <div className="admin-topbar__right">
          <button
            className="btn-sec"
            style={{ fontSize: 12, padding: "6px 12px" }}
            onClick={() => navigate("/dashboard")}
          >
            ← Voltar
          </button>
          <div className="admin-topbar__user">
            <div className="admin-topbar__av">
              {(user?.nickname?.[0] || "A").toUpperCase()}
            </div>
            <div className="admin-topbar__user-info">
              <span className="admin-topbar__nick">{user?.nickname || "Admin"}</span>
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
                  {DB_TABLES.map(t => (
                    <div key={t.table} className="db-row" onClick={() => setActive(t.section)}>
                      <span className="db-row__table">{t.table}</span>
                      <span className="db-row__count">{t.count}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="admin-main">
          <div className="admin-main__header">
            <div>
              <h1 className="admin-main__title">
                {activeSection?.icon} {activeSection?.label}
              </h1>
              <p className="admin-main__sub">
                {active === "overview"
                  ? "Visão consolidada do sistema Matchup"
                  : `Gerenciar tabela · ${active}`}
              </p>
            </div>
          </div>

          <div className="admin-main__content">
            {active === "overview"
              ? <Overview stats={stats} overviewData={overviewData} />
              : <SectionView
                  id={active}
                  rows={rows}
                  loading={loading}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                />
            }
          </div>
        </main>
      </div>
    </div>
  );
}
