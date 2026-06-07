import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../models/authContext.jsx";

export default function Header() {
  const navigate = useNavigate();
  const { logado, user, logoutSessao } = useAuth();
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logoutSessao();
    setDropdownAberto(false);
    setMenuMobileAberto(false);
    navigate("/auth");
  };

  const getIniciais = (nickname) => {
    if (!nickname) return "M";
    const nomes = nickname.trim().split(" ");
    if (nomes.length > 1) return (nomes[0][0] + nomes[1][0]).toUpperCase();
    return nomes[0].substring(0, 2).toUpperCase();
  };

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function clicarFora(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownAberto(false);
      }
    }
    document.addEventListener("mousedown", clicarFora);
    return () => document.removeEventListener("mousedown", clicarFora);
  }, []);

  // Trava scroll do body quando menu mobile estiver aberto
  useEffect(() => {
    document.body.style.overflow = menuMobileAberto ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuMobileAberto]);

  const navegar = (rota) => {
    navigate(rota);
    setMenuMobileAberto(false);
  };

  return (
    <>
      <nav className="about-navbar">
        {/* Logo */}
        <div
          className="about-logo-wrapper"
          onClick={() => navigate("/")}
          style={{ cursor: "pointer" }}
        >
          <div className="about-logo-icon">⚡</div>
          <span className="about-logo-text">
            Match<span className="about-logo-accent">up</span>
          </span>
        </div>

        {/* Menu desktop */}
        <div className="about-nav-menu">
          <span className="nav-link" onClick={() => navigate("/games")} style={{ cursor: "pointer" }}>Explorar</span>
          <span className="nav-link" style={{ cursor: "pointer" }}>Grupos</span>
          <span className="nav-link" style={{ cursor: "pointer" }}>Ranking</span>

          {logado ? (
            <div className="header-profile-container" ref={dropdownRef} style={{ position: "relative" }}>
              <div
                className="header-avatar-clickable"
                onClick={() => setDropdownAberto(!dropdownAberto)}
                style={{ cursor: "pointer" }}
              >
                <div className="avatar-wrapper-with-caret">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="Perfil" className="header-avatar-img" draggable="false" />
                  ) : (
                    <div className="header-avatar-placeholder">
                      {getIniciais(user?.nickname || user?.email)}
                    </div>
                  )}
                  <span className={`header-dropdown-caret ${dropdownAberto ? "aberto" : ""}`}>▼</span>
                </div>
              </div>

              {dropdownAberto && (
                <div className="header-dropdown-menu">
                  <div className="dropdown-user-info">
                    <p className="dropdown-nickname">{user?.nickname || "Jogador"}</p>
                    <p className="dropdown-email">{user?.email}</p>
                  </div>
                  <hr className="dropdown-divider" />
                  <button onClick={() => { navigate("/perfil"); setDropdownAberto(false); }} className="dropdown-item">Meu Perfil</button>
                  <button onClick={() => { navigate("/meus-jogos"); setDropdownAberto(false); }} className="dropdown-item">Meus Jogos</button>
                  <button onClick={handleLogout} className="dropdown-item logout-btn">Sair (Sign Out)</button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => navigate("/auth")} className="cta-primary" style={{ padding: "8px 20px", fontSize: 13 }}>
              Entrar
            </button>
          )}
        </div>

        {/* Botão hamburger — só aparece no mobile */}
        <button
          className={`hamburger-btn ${menuMobileAberto ? "hamburger-btn--open" : ""}`}
          onClick={() => setMenuMobileAberto(!menuMobileAberto)}
          aria-label="Menu"
        >
          <span className="hamburger-line" />
          <span className="hamburger-line" />
          <span className="hamburger-line" />
        </button>
      </nav>

      {/* Overlay escuro atrás do menu mobile */}
      {menuMobileAberto && (
        <div className="mobile-overlay" onClick={() => setMenuMobileAberto(false)} />
      )}

      {/* Sidebar mobile */}
      <aside className={`mobile-sidebar ${menuMobileAberto ? "mobile-sidebar--open" : ""}`}>
        <div className="mobile-sidebar__header">
          <div className="about-logo-wrapper" onClick={() => navegar("/")}>
            <div className="about-logo-icon">⚡</div>
            <span className="about-logo-text">
              Match<span className="about-logo-accent">up</span>
            </span>
          </div>
          <button className="mobile-sidebar__close" onClick={() => setMenuMobileAberto(false)}>✕</button>
        </div>

        {logado && (
          <div className="mobile-sidebar__user">
            <div className="mobile-avatar">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="Perfil" className="mobile-avatar-img" />
              ) : (
                <div className="mobile-avatar-placeholder">
                  {getIniciais(user?.nickname || user?.email)}
                </div>
              )}
            </div>
            <div>
              <p className="mobile-user-nickname">{user?.nickname || "Jogador"}</p>
              <p className="mobile-user-email">{user?.email}</p>
            </div>
          </div>
        )}

        <nav className="mobile-sidebar__nav">
          <button className="mobile-nav-item" onClick={() => navegar("/games")}>🎮 Explorar Jogos</button>
          <button className="mobile-nav-item" onClick={() => navegar("/players")}>🔍 Encontrar Jogadores</button>
          <button className="mobile-nav-item" onClick={() => navegar("/")}>👥 Grupos</button>
          <button className="mobile-nav-item" onClick={() => navegar("/")}>🏆 Ranking</button>

          {logado && (
            <>
              <hr className="mobile-sidebar__divider" />
              <button className="mobile-nav-item" onClick={() => navegar("/perfil")}>👤 Meu Perfil</button>
              <button className="mobile-nav-item" onClick={() => navegar("/meus-jogos")}>🎯 Meus Jogos</button>
              <button className="mobile-nav-item mobile-nav-item--logout" onClick={handleLogout}>🚪 Sair</button>
            </>
          )}

          {!logado && (
            <>
              <hr className="mobile-sidebar__divider" />
              <button className="mobile-nav-item mobile-nav-item--accent" onClick={() => navegar("/auth")}>Entrar / Criar conta</button>
            </>
          )}
        </nav>
      </aside>
    </>
  );
}