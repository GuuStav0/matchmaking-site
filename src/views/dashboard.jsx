import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../models/authContext.jsx";
import Header from "../assets/actions/header.jsx";
import Footer from "../assets/actions/footer.jsx";
import "../assets/css/dashboard.css";

// ── Componente: stat simples (número + label) ─────────────────────────────────
function StatCard({ icon, label, value, loading }) {
  return (
    <div className="dash-stat">
      <span className="dash-stat__icon">{icon}</span>
      <div>
        <p className="dash-stat__value">{loading ? "…" : value}</p>
        <p className="dash-stat__label">{label}</p>
      </div>
    </div>
  );
}

// ── Componente: card de grupo ─────────────────────────────────────────────────
function GroupCard({ group, onEnter }) {
  const free = group.max_slots - group.slots_used;
  return (
    <div className="dash-group-card">
      <div className={`dash-group-stripe dash-group-stripe--${group.style?.toLowerCase()}`} />

      <div className="dash-group-top">
        <div className="dash-group-top-info">
          {group.game_cover && (
            <img src={group.game_cover} alt={group.game_name} className="dash-group-cover" />
          )}
          <div className="dash-group-info">
            <span className="dash-group-name">{group.name}</span>
            <span className="dash-group-game">{group.game_name}</span>
          </div>
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
          {group.slots_used}/{group.max_slots} membros · {free}{" "}
          {free === 1 ? "vaga" : "vagas"}
        </span>
      </div>

      <div className="dash-group-tags">
        <span className={`dash-group-tag dash-group-tag--${group.style?.toLowerCase()}`}>
          {group.style === "Competitivo" || group.style === "competitive"
            ? "Competitivo"
            : "Casual"}
        </span>
      </div>

      <button className="dash-group-btn" onClick={() => onEnter(group)}>
        Entrar no grupo
      </button>
    </div>
  );
}

// ── Componente: card de jogo vinculado com rank ───────────────────────────────
function LinkedGameCard({ game }) {
  return (
    <div className="dash-game-card">
      {game.image_url ? (
        <img src={game.image_url} alt={game.game_name} className="dash-game-card__img" />
      ) : (
        <div className="dash-game-card__img-placeholder">🎮</div>
      )}
      <div className="dash-game-card__info">
        <span className="dash-game-card__name">{game.game_name}</span>
        <div className="dash-game-card__meta">
          <span className={`dash-game-card__style dash-game-card__style--${game.game_style}`}>
            {game.game_style === "competitive" ? "Competitivo" : "Casual"}
          </span>
          {game.game_rank && (
            <span className="dash-game-card__rank">🏆 {game.game_rank}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profile, setProfile]       = useState(null);
  const [groups, setGroups]         = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingGroups, setLoadingGroups]   = useState(true);

  // Busca perfil completo (inclui jogos vinculados)
  const fetchProfile = useCallback(async () => {
    if (!user?.id) return;
    setLoadingProfile(true);
    try {
      const res = await fetch(`http://localhost:3000/api/players/${user.id}`);
      const result = await res.json();
      if (res.ok && result.status === "sucesso") setProfile(result.dados);
    } catch (err) {
      console.error("Erro ao carregar perfil:", err);
    } finally {
      setLoadingProfile(false);
    }
  }, [user?.id]);

  // Busca grupos em que o usuário é membro ou dono
  const fetchGroups = useCallback(async () => {
    if (!user?.id) return;
    setLoadingGroups(true);
    try {
      const res = await fetch(`http://localhost:3000/api/profiles/${user.id}/groups`);
      const result = await res.json();
      if (res.ok && result.status === "sucesso") setGroups(result.dados);
    } catch (err) {
      console.error("Erro ao carregar grupos:", err);
    } finally {
      setLoadingGroups(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchProfile();
    fetchGroups();
  }, [fetchProfile, fetchGroups]);

  function getIniciais(name) {
    if (!name) return "?";
    const partes = name.trim().split(" ");
    if (partes.length > 1) return (partes[0][0] + partes[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }

  function handleEnterGroup(group) {
    navigate(`/rooms/${group.game_id}/${group.id}`);
  }

  const games        = profile?.games ?? [];
  const avatarUrl    = profile?.avatar_url || user?.avatarUrl;
  const nickname     = profile?.nickname   || user?.nickname || "Jogador";

  return (
    <div className="dash-page">
      <Header />

      <main className="dash-main">

        {/* ── Boas-vindas ── */}
        <section className="dash-hero">
          <div className="dash-hero__left">
            <div className="dash-avatar">
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" className="dash-avatar-img" />
              ) : (
                <div className="dash-avatar-placeholder">
                  {getIniciais(nickname)}
                </div>
              )}
              <span className="dash-avatar-online" />
            </div>
            <div>
              <p className="dash-greeting">Bem-vindo de volta,</p>
              <h1 className="dash-username">
                {nickname} <span className="dash-wave">👋</span>
              </h1>
            </div>
          </div>
          <button className="dash-edit-btn" onClick={() => navigate("/perfil")}>
            ✏️ Editar perfil
          </button>
        </section>

        {/* ── Stats rápidos ── */}
        <section className="dash-stats">
          <StatCard
            icon="🎮"
            label="Jogos vinculados"
            value={games.length}
            loading={loadingProfile}
          />
          <StatCard
            icon="👥"
            label="Grupos ativos"
            value={groups.length}
            loading={loadingGroups}
          />
        </section>

        {/* ── Jogos vinculados ── */}
        <section className="dash-games-section">
          <div className="dash-section-header">
            <h2 className="dash-section-title">Meus jogos</h2>
            <button
              className="dash-section-link"
              onClick={() => navigate("/meus-jogos")}
            >
              Gerenciar →
            </button>
          </div>

          {loadingProfile ? (
            <p className="dash-loading-text">Carregando jogos...</p>
          ) : games.length === 0 ? (
            <div className="dash-empty">
              <span className="dash-empty-icon">🎮</span>
              <p className="dash-empty-title">Nenhum jogo vinculado</p>
              <p className="dash-empty-sub">Adicione seus jogos para aparecer nas buscas!</p>
              <button className="dash-empty-btn" onClick={() => navigate("/meus-jogos")}>
                Adicionar jogos
              </button>
            </div>
          ) : (
            <div className="dash-games-list">
              {games.map((game, i) => (
                <LinkedGameCard key={i} game={game} />
              ))}
            </div>
          )}
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
            {!loadingGroups && (
              <span className="dash-section-count">{groups.length} grupos</span>
            )}
          </div>

          {loadingGroups ? (
            <p className="dash-loading-text">Carregando grupos...</p>
          ) : groups.length === 0 ? (
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
              {groups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  onEnter={handleEnterGroup}
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