import { useState, useEffect, useRef } from "react";
import "../assets/css/admin.css";

// ─── MOCK DATA ─────────────────────────────────────────────────────────────────
const MOCK = {
  users: Array.from({ length: 38 }, (_, i) => ({
    id: i + 1,
    email: `user${i + 1}@mail.com`,
    created_at: `2025-0${(i % 9) + 1}-${String((i % 28) + 1).padStart(2, "0")}`,
  })),
  profiles: Array.from({ length: 38 }, (_, i) => ({
    id: i + 1,
    user_id: i + 1,
    nickname: ["GhostReaper","LunaStrike","SkyWarden","NovaPulse","IronVeil","CipherX","PixelStar","VoidHunter","NeonRaider","StormBlade"][i % 10] + (i > 9 ? i : ""),
    bio: i % 3 === 0 ? "Jogador competitivo focado em rank." : i % 3 === 1 ? "Casual e sempre disposto a ajudar." : null,
    avatar_url: null,
    schedule_availability: ["21h–00h", "Fins de semana", "Madrugada", "Qualquer horário"][i % 4],
    created_at: `2025-0${(i % 9) + 1}-${String((i % 28) + 1).padStart(2, "0")}`,
  })),
  games: [
    { id:1, name:"Valorant",          genre:"FPS",          rooms_count:142 },
    { id:2, name:"League of Legends", genre:"MOBA",         rooms_count:98  },
    { id:3, name:"CS2",               genre:"FPS",          rooms_count:87  },
    { id:4, name:"Apex Legends",      genre:"Battle Royale",rooms_count:63  },
    { id:5, name:"Rainbow Six Siege", genre:"FPS",          rooms_count:55  },
    { id:6, name:"Rocket League",     genre:"Esporte",      rooms_count:44  },
    { id:7, name:"Dota 2",            genre:"MOBA",         rooms_count:39  },
    { id:8, name:"Overwatch 2",       genre:"FPS",          rooms_count:36  },
    { id:9, name:"Fortnite",          genre:"Battle Royale",rooms_count:31  },
    { id:10,name:"Minecraft",         genre:"Sandbox",      rooms_count:19  },
    { id:11,name:"FIFA 25",           genre:"Esporte",      rooms_count:17  },
    { id:12,name:"World of Warcraft", genre:"MMORPG",       rooms_count:15  },
  ],
  groups: Array.from({ length: 24 }, (_, i) => ({
    id: i + 1,
    name: ["Rank até Imortal","Casual fins de semana","Trio Duelist","Full team 5v5","Noturno intenso","Aprendendo a jogar"][i % 6] + (i > 5 ? ` #${i}` : ""),
    game_id: (i % 12) + 1,
    game_name: ["Valorant","LoL","CS2","Apex","R6S","Rocket League","Dota 2","OW2","Fortnite","Minecraft","FIFA 25","WoW"][i % 12],
    owner_id: (i % 38) + 1,
    style: i % 2 === 0 ? "Competitivo" : "Casual",
    members_count: (i % 4) + 1,
    slots: 5,
    status: i % 7 === 0 ? "closed" : "open",
    created_at: `2025-0${(i % 9) + 1}-${String((i % 28) + 1).padStart(2, "0")}`,
  })),
  group_members: Array.from({ length: 62 }, (_, i) => ({
    id: i + 1,
    group_id: (i % 24) + 1,
    user_id: (i % 38) + 1,
    role: i % 6 === 0 ? "owner" : "member",
    joined_at: `2025-0${(i % 9) + 1}-${String((i % 28) + 1).padStart(2, "0")}`,
  })),
};

const STATS = [
  { label: "Usuários",   value: 38,  icon: "👤", color: "#7c3aed", delta: "+12%" },
  { label: "Perfis",     value: 38,  icon: "🪪", color: "#0ea5e9", delta: "+12%" },
  { label: "Jogos",      value: 12,  icon: "🎮", color: "#10b981", delta: "+2"   },
  { label: "Salas",      value: 24,  icon: "🏠", color: "#f59e0b", delta: "+18%" },
  { label: "Membros",    value: 62,  icon: "👥", color: "#ec4899", delta: "+24%" },
];

const SECTIONS = [
  { id: "overview",      label: "Visão Geral",   icon: "▦" },
  { id: "users",         label: "Usuários",       icon: "👤" },
  { id: "profiles",      label: "Perfis",         icon: "🪪" },
  { id: "games",         label: "Jogos",          icon: "🎮" },
  { id: "groups",        label: "Salas",          icon: "🏠" },
  { id: "group_members", label: "Membros Salas",  icon: "👥" },
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
    const step = Math.ceil(stat.value / 30);
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
        <span className="stat-card__delta">{stat.delta}</span>
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
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
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

// ─── TABLE ────────────────────────────────────────────────────────────────────
function Table({ columns, data, onDelete }) {
  const [confirm, setConfirm] = useState(null);

  const handleDelete = (row) => {
    setConfirm(row);
  };

  const confirmDelete = () => {
    onDelete(confirm.id);
    setConfirm(null);
  };

  return (
    <>
      {confirm && (
        <ConfirmModal
          msg={`Excluir registro #${confirm.id}? Esta ação é irreversível.`}
          onConfirm={confirmDelete}
          onClose={() => setConfirm(null)}
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
              <tr key={row.id} className="tbl__row" style={{ animationDelay: `${ri * 30}ms` }}>
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
                    <button className="tbl__btn tbl__btn--edit" title="Editar">
                      <IEdit />
                    </button>
                    <button className="tbl__btn tbl__btn--del" title="Excluir" onClick={() => handleDelete(row)}>
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

// ─── SECTION VIEWS ────────────────────────────────────────────────────────────
function SectionView({ id, data, setData }) {
  const [page,    setPage]    = useState(1);
  const [search,  setSearch]  = useState("");

  const handleDelete = (rowId) => {
    setData(prev => ({ ...prev, [id]: prev[id].filter(r => r.id !== rowId) }));
  };

  const filtered = data[id]?.filter(row =>
    Object.values(row).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
  ) ?? [];

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const COLS = {
    users: [
      { key: "id",         label: "#",          mono: true },
      { key: "email",      label: "E-mail" },
      { key: "created_at", label: "Criado em",  render: v => <span className="tbl__date">{v}</span> },
    ],
    profiles: [
      { key: "id",                   label: "#",          mono: true },
      { key: "user_id",              label: "user_id",    mono: true },
      { key: "nickname",             label: "Nickname",   render: (v) => <span className="tbl__nick"><span className="tbl__nick-av">{v[0]}</span>{v}</span> },
      { key: "schedule_availability",label: "Horário" },
      { key: "bio",                  label: "Bio",        render: v => v ? <span className="tbl__clamp">{v}</span> : <span className="tbl__null">—</span> },
      { key: "created_at",           label: "Criado em",  render: v => <span className="tbl__date">{v}</span> },
    ],
    games: [
      { key: "id",          label: "#",        mono: true },
      { key: "name",        label: "Nome",     render: v => <strong style={{ color: "#f1f5f9" }}>{v}</strong> },
      { key: "genre",       label: "Gênero",   render: v => <span className="tbl__genre">{v}</span> },
      { key: "rooms_count", label: "Salas",    render: v => <span className="tbl__num">{v}</span> },
    ],
    groups: [
      { key: "id",           label: "#",         mono: true },
      { key: "name",         label: "Nome" },
      { key: "game_name",    label: "Jogo" },
      { key: "owner_id",     label: "owner_id",  mono: true },
      { key: "style",        label: "Estilo",    render: v => <span className={`tbl__badge tbl__badge--${v === "Competitivo" ? "comp" : "casual"}`}>{v}</span> },
      { key: "members_count",label: "Membros",   render: (v, row) => <span className="tbl__num">{v}/{row.slots}</span> },
      { key: "status",       label: "Status",    render: v => <span className={`tbl__badge tbl__badge--${v === "open" ? "open" : "closed"}`}>{v === "open" ? "Aberta" : "Fechada"}</span> },
      { key: "created_at",   label: "Criado em", render: v => <span className="tbl__date">{v}</span> },
    ],
    group_members: [
      { key: "id",       label: "#",        mono: true },
      { key: "group_id", label: "group_id", mono: true },
      { key: "user_id",  label: "user_id",  mono: true },
      { key: "role",     label: "Papel",    render: v => <span className={`tbl__badge ${v === "owner" ? "tbl__badge--comp" : "tbl__badge--casual"}`}>{v === "owner" ? "👑 Dono" : "Membro"}</span> },
      { key: "joined_at",label: "Entrou em",render: v => <span className="tbl__date">{v}</span> },
    ],
  };

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

      <Table columns={COLS[id] || []} data={paginated} onDelete={handleDelete} />

      <Pagination
        page={page}
        total={filtered.length}
        perPage={PER_PAGE}
        onChange={setPage}
      />
    </div>
  );
}

// ─── OVERVIEW ─────────────────────────────────────────────────────────────────
function Overview({ data }) {
  const recentGroups = data.groups.slice(0, 5);
  const recentUsers  = data.users.slice(0, 5);

  return (
    <div className="overview">
      <div className="overview__stats">
        {STATS.map((s, i) => <StatCard key={s.label} stat={s} index={i} />)}
      </div>

      <div className="overview__grid">
        {/* Recent groups */}
        <div className="ov-panel">
          <div className="ov-panel__title">Salas recentes</div>
          <div className="ov-list">
            {recentGroups.map(g => (
              <div key={g.id} className="ov-row">
                <div className="ov-row__icon" style={{ background: g.style === "Competitivo" ? "rgba(124,58,237,.2)" : "rgba(14,165,233,.15)" }}>
                  {g.style === "Competitivo" ? "⚔️" : "🎮"}
                </div>
                <div className="ov-row__info">
                  <span className="ov-row__name">{g.name}</span>
                  <span className="ov-row__sub">{g.game_name} · {g.members_count}/{g.slots}</span>
                </div>
                <span className={`tbl__badge tbl__badge--${g.status === "open" ? "open" : "closed"}`} style={{ fontSize: 10 }}>
                  {g.status === "open" ? "Aberta" : "Fechada"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent users */}
        <div className="ov-panel">
          <div className="ov-panel__title">Usuários recentes</div>
          <div className="ov-list">
            {recentUsers.map(u => (
              <div key={u.id} className="ov-row">
                <div className="ov-row__icon" style={{ background: "rgba(124,58,237,.2)", color: "#c084fc", fontSize: 12, fontWeight: 700 }}>
                  #{u.id}
                </div>
                <div className="ov-row__info">
                  <span className="ov-row__name">{u.email}</span>
                  <span className="ov-row__sub">Criado em {u.created_at}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Games by rooms */}
        <div className="ov-panel">
          <div className="ov-panel__title">Jogos por salas ativas</div>
          <div className="ov-bars">
            {data.games.slice(0, 6).map(g => {
              const max = data.games[0].rooms_count;
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

        {/* Member roles */}
        <div className="ov-panel">
          <div className="ov-panel__title">Distribuição de papéis</div>
          <div className="ov-donut-wrap">
            <div className="ov-donut">
              <div className="ov-donut__inner">
                <span className="ov-donut__num">{data.group_members.length}</span>
                <span className="ov-donut__lbl">total</span>
              </div>
            </div>
            <div className="ov-donut-legend">
              {[
                { label: "Donos",   count: data.group_members.filter(m => m.role === "owner").length,  color: "#7c3aed" },
                { label: "Membros", count: data.group_members.filter(m => m.role === "member").length, color: "#0ea5e9" },
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
  const [active,    setActive]    = useState("overview");
  const [data,      setData]      = useState(MOCK);
  const [sideOpen,  setSideOpen]  = useState(true);

  const activeSection = SECTIONS.find(s => s.id === active);

  return (
    <div className="admin">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
      `}</style>

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
          <div className="admin-topbar__user">
            <div className="admin-topbar__av">A</div>
            <div className="admin-topbar__user-info">
              <span className="admin-topbar__nick">admin</span>
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
                    { table: "users",         count: data.users.length },
                    { table: "profiles",      count: data.profiles.length },
                    { table: "games",         count: data.games.length },
                    { table: "groups",        count: data.groups.length },
                    { table: "group_members", count: data.group_members.length },
                  ].map(t => (
                    <div key={t.table} className="db-row" onClick={() => setActive(t.table === "groups" ? "groups" : t.table)}>
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
          {/* Page header */}
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
            {active !== "overview" && (
              <button className="btn-add">+ Novo registro</button>
            )}
          </div>

          {/* Content */}
          <div className="admin-main__content">
            {active === "overview"
              ? <Overview data={data} />
              : <SectionView id={active} data={data} setData={setData} />
            }
          </div>
        </main>
      </div>
    </div>
  );
}
