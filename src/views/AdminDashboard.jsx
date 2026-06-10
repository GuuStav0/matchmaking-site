// src/views/AdminDashboard.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../models/authContext.jsx";
import { useApi }  from "../hooks/useApi.js";
import { MOCK, SECTIONS } from "../components/admin/adminData.jsx";
import { IMenu, IPlus } from "../components/admin/AdminIcons.jsx";
import Overview    from "../components/admin/Overview.jsx";
import SectionView from "../components/admin/SectionView.jsx";
import "../assets/css/admin.css";

export default function AdminDashboard() {
  const { user, logoutSessao } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutSessao();
    navigate("/auth");
  };
  const { request } = useApi();

  const [active,   setActive]   = useState("overview");
  const [sideOpen, setSideOpen] = useState(true);
  const [data,     setData]     = useState(MOCK);
  const [stats,    setStats]    = useState({ users: 0, profiles: 0, games: 12, groups: 0, group_members: 0 });
  const [isMock,   setIsMock]   = useState(true);
  const [loading,  setLoading]  = useState(true);

  const fetchSection = useCallback(async (section) => {
    try {
      const path = `/admin/${section === "group_members" ? "group-members" : section}`;
      const res  = await request(path);
      if (res.ok && res.dados) {
        setData((prev) => ({ ...prev, [section]: res.dados }));
        setIsMock(false);
      }
    } catch {
      // mantém mock
    }
  }, [request]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await request("/admin/stats");
      if (res.ok && res.dados) {
        setStats(res.dados);
        setIsMock(false);
      }
    } catch {
      // mantém stats padrão
    }
  }, [request]);

  useEffect(() => {
    const sections = ["users", "profiles", "games", "groups", "group_members"];
    Promise.all([
      fetchStats(),
      ...sections.map(fetchSection),
    ]).finally(() => setLoading(false));
  }, [fetchSection, fetchStats]);

  const handleRefresh = useCallback((section) => {
    if (section === "overview") {
      fetchStats();
    } else {
      fetchSection(section);
      fetchStats();
    }
  }, [fetchSection, fetchStats]);

  const activeSection = SECTIONS.find((s) => s.id === active);

  return (
    <div className="admin">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');`}</style>

      {/* ── Top bar ── */}
      <header className="admin-topbar">
        <div className="admin-topbar__left">
          <button className="admin-topbar__menu" onClick={() => setSideOpen((v) => !v)}><IMenu /></button>
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
          <button
            className="admin-topbar__logout"
            onClick={handleLogout}
            title="Sair"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sair
          </button>
        </div>
      </header>

      <div className="admin-body">
        {/* ── Sidebar ── */}
        <aside className={`admin-side ${sideOpen ? "admin-side--open" : "admin-side--closed"}`}>
          <div className="admin-side__inner">
            <div className="admin-side__section-label">Navegação</div>
            <nav className="admin-nav">
              {SECTIONS.map((s) => (
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
                    { table: "users",         count: stats.users         ?? (data.users?.length         ?? 0) },
                    { table: "profiles",      count: stats.profiles      ?? (data.profiles?.length      ?? 0) },
                    { table: "games",         count: stats.games         ?? (data.games?.length         ?? 0) },
                    { table: "groups",        count: stats.groups        ?? (data.groups?.length        ?? 0) },
                    { table: "group_members", count: stats.group_members ?? (data.group_members?.length ?? 0) },
                  ].map((t) => (
                    <div
                      key={t.table}
                      className="db-row"
                      onClick={() => setActive(t.table)}
                    >
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
