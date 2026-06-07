import { useNavigate } from "react-router-dom";
import { useAuth } from "../models/authContext.jsx";
import Header from "../assets/actions/header.jsx";
import Footer from "../assets/actions/footer.jsx";
import "../assets/css/dashboard.css";

// Dados mockados de grupos — substituir pela API quando disponível
const MOCK_GROUPS = [
  {
    id: 1,
    name: "Rumo ao Radiante",
    game: "Valorant",
    slots_used: 3,
    max_slots: 5,
    style: "competitive",
    role: "owner",
  },
  {
    id: 2,
    name: "LoL Casual Noturno",
    game: "League of Legends",
    slots_used: 2,
    max_slots: 5,
    style: "casual",
    role: "member",
  },
];

function StatCard({ icon, label, value }) {
  return (
    <div className="dash-stat">
      <span className="dash-stat__icon">{icon}</span>
      <div>
        <p className="dash-stat__value">{value}</p>
        <p className="dash-stat__label">{label}</p>
      </div>
    </div>
  );
}

function GroupCard({ group, onEnter }) {
  const free = group.max_slots - group.slots_used;
  return (
    <div className="dash-group-card">
      <div className={`dash-group-stripe dash-group-stripe--${group.style}`} />
      <div className="dash-group-top">
        <div className="dash-group-info">
          <span className="dash-group-name">{group.name}</span>
          <span className="dash-group-game">{group.game}</span>
        </div>
        {group.role === "owner" && (
          <span className="dash-group-owner-badge">👑 Dono</span>
        )}
      </div>
      <div className="dash-group-slots">
        <div className="dash-group-slots-bar">
          <div
            className="dash-group-slots-fill"
            style={{ width: `${(group.slots_used / group.max_slots) * 100}%` }}
          />
        </div>
        <span className="dash-group-slots-text">
          {group.slots_used}/{group.max_slots} membros · {free} {free === 1 ? "vaga" : "vagas"}
        </span>
      </div>
      <div className="dash-group-tags">
        <span className={`dash-group-tag dash-group-tag--${group.style}`}>
          {group.style === "competitive" ? "Competitivo" : "Casual"}
        </span>
      </div>
      <button className="dash-group-btn" onClick={() => onEnter(group)}>
        Entrar no grupo
      </button>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  function getIniciais(name) {
    if (!name) return "?";
    const partes = name.trim().split(" ");
    if (partes.length > 1) return (partes[0][0] + partes[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }

  return (
    <div className="dash-page">
      <Header />

      <main className="dash-main">

        {/* ── Boas-vindas ── */}
        <section className="dash-hero">
          <div className="dash-hero__left">
            <div className="dash-avatar">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="avatar" className="dash-avatar-img" />
              ) : (
                <div className="dash-avatar-placeholder">
                  {getIniciais(user?.nickname || user?.email)}
                </div>
              )}
              <span className="dash-avatar-online" />
            </div>
            <div>
              <p className="dash-greeting">Bem-vindo de volta,</p>
              <h1 className="dash-username">
                {user?.nickname || "Jogador"} <span className="dash-wave">👋</span>
              </h1>
            </div>
          </div>
          <button className="dash-edit-btn" onClick={() => navigate("/perfil")}>
            ✏️ Editar perfil
          </button>
        </section>

        {/* ── Stats rápidos ── */}
        <section className="dash-stats">
          <StatCard icon="🎮" label="Jogos vinculados" value={user?.games_count ?? "—"} />
          <StatCard icon="👥" label="Grupos ativos" value={MOCK_GROUPS.length} />
          <StatCard icon="🔍" label="Jogadores disponíveis" value="4" />
          <StatCard icon="⭐" label="Rank mais alto" value={user?.top_rank ?? "—"} />
        </section>

        {/* ── Ações rápidas ── */}
        <section className="dash-actions-section">
          <h2 className="dash-section-title">Acesso rápido</h2>
          <div className="dash-actions">
            <button className="dash-action-card" onClick={() => navigate("/players")}>
              <span className="dash-action-icon">🔍</span>
              <span className="dash-action-label">Encontrar jogadores</span>
              <span className="dash-action-arrow">→</span>
            </button>
            <button className="dash-action-card" onClick={() => navigate("/games")}>
              <span className="dash-action-icon">🎮</span>
              <span className="dash-action-label">Explorar jogos</span>
              <span className="dash-action-arrow">→</span>
            </button>
            <button className="dash-action-card" onClick={() => navigate("/meus-jogos")}>
              <span className="dash-action-icon">🎯</span>
              <span className="dash-action-label">Gerenciar meus jogos</span>
              <span className="dash-action-arrow">→</span>
            </button>
            <button className="dash-action-card" onClick={() => navigate("/perfil")}>
              <span className="dash-action-icon">👤</span>
              <span className="dash-action-label">Completar perfil</span>
              <span className="dash-action-arrow">→</span>
            </button>
          </div>
        </section>

        {/* ── Painel de grupos ── */}
        <section className="dash-groups-section">
          <div className="dash-section-header">
            <h2 className="dash-section-title">Meus grupos</h2>
            <span className="dash-section-count">{MOCK_GROUPS.length} grupos</span>
          </div>

          {MOCK_GROUPS.length === 0 ? (
            <div className="dash-empty">
              <span className="dash-empty-icon">👥</span>
              <p className="dash-empty-title">Nenhum grupo ainda</p>
              <p className="dash-empty-sub">Explore jogadores e entre em um grupo!</p>
              <button className="dash-empty-btn" onClick={() => navigate("/players")}>
                Encontrar jogadores
              </button>
            </div>
          ) : (
            <div className="dash-groups-grid">
              {MOCK_GROUPS.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  onEnter={(g) => console.log("Entrar no grupo:", g.name)}
                />
              ))}
            </div>
          )}
        </section>

      </main>

      <Footer />
    </div>
  );
}