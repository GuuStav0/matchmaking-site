// src/assets/actions/header.jsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../models/authContext.jsx";

export default function Header() {
  const navigate = useNavigate();

  // atualizarDadosUsuario is now available but header only reads.
  // The avatar stays fresh automatically because authContext writes the
  // updated user object to state (and localStorage) whenever atualizarDadosUsuario is called.
  const { logado, user, logoutSessao } = useAuth();

  const [dropdownAberto,   setDropdownAberto]   = useState(false);
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);
  const dropdownRef = useRef(null);

  // ── Avatar source ─────────────────────────────────────────────────────────────
  // Reads both camelCase (login response) and snake_case (localStorage persisted).
  // After profile PUT, atualizarDadosUsuario writes avatarUrl into the context,
  // so this expression will pick up the new value on the very next render.
  const avatarSrc = user?.avatarUrl || user?.avatar_url || null;

  const getIniciais = (nickname) => {
    if (!nickname) return "M";
    const nomes = nickname.trim().split(" ");
    if (nomes.length > 1) return (nomes[0][0] + nomes[1][0]).toUpperCase();
    return nomes[0].substring(0, 2).toUpperCase();
  };

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    logoutSessao();
    setDropdownAberto(false);
    setMenuMobileAberto(false);
    navigate("/auth");
  };

  useEffect(() => {
    function clicarFora(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownAberto(false);
      }
    }
    document.addEventListener("mousedown", clicarFora);
    return () => document.removeEventListener("mousedown", clicarFora);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuMobileAberto ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuMobileAberto]);

  const navegar = (rota) => {
    navigate(rota);
    setMenuMobileAberto(false);
  };

  // ── Reusable avatar element ───────────────────────────────────────────────────
  const AvatarElement = ({ mobile = false }) => {
    if (avatarSrc) {
      return (
        <img
          src={avatarSrc}
          alt="Perfil"
          className={mobile ? "mobile-avatar-img" : "header-avatar-img"}
          draggable="false"
          onError={(e) => {
            // If URL is broken fall back to placeholder initials
            e.target.style.display = "none";
          }}
        />
      );
    }
    return (
      <div className={mobile ? "mobile-avatar-placeholder" : "header-avatar-placeholder"}>
        {getIniciais(user?.nickname || user?.email)}
      </div>
    );
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

        {/* Desktop menu */}
        <div className="about-nav-menu">
          <span className="nav-link" onClick={() => navigate("/games")} style={{ cursor: "pointer" }}>
            Explorar
          </span>
          <span className="nav-link" onClick={() => navigate("/players")} style={{ cursor: "pointer" }}>
            Jogadores
          </span>

          {logado ? (
            <div className="header-profile-container" ref={dropdownRef} style={{ position: "relative" }}>
              <div
                className="header-avatar-clickable"
                onClick={() => setDropdownAberto(!dropdownAberto)}
                style={{ cursor: "pointer" }}
              >
                <div className="avatar-wrapper-with-caret">
                  <AvatarElement />
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
                  <button onClick={() => { navigate("/dashboard"); setDropdownAberto(false); }} className="dropdown-item">
                    Home
                  </button>
                  <button onClick={() => { navigate("/perfil"); setDropdownAberto(false); }} className="dropdown-item">
                    Meu Perfil
                  </button>
                  <button onClick={() => { navigate("/meus-jogos"); setDropdownAberto(false); }} className="dropdown-item">
                    Meus Jogos
                  </button>
                  {user?.isAdmin && (
                    <button onClick={() => { navigate("/admin"); setDropdownAberto(false); }} className="dropdown-item">
                      ⚡ Painel Admin
                    </button>
                  )}
                  <button onClick={handleLogout} className="dropdown-item logout-btn">
                    Sair (Sign Out)
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => navigate("/auth")}
              className="cta-primary"
              style={{ padding: "8px 20px", fontSize: 13 }}
            >
              Entrar
            </button>
          )}
        </div>

        {/* Hamburger */}
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

      {menuMobileAberto && (
        <div className="mobile-overlay" onClick={() => setMenuMobileAberto(false)} />
      )}

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
              <AvatarElement mobile />
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

          {logado && (
            <>
              <hr className="mobile-sidebar__divider" />
              <button className="mobile-nav-item" onClick={() => navegar("/perfil")}>👤 Meu Perfil</button>
              <button className="mobile-nav-item" onClick={() => navegar("/meus-jogos")}>🎯 Meus Jogos</button>
              {user?.isAdmin && (
                <button className="mobile-nav-item" onClick={() => navegar("/admin")}>⚡ Painel Admin</button>
              )}
              <button className="mobile-nav-item mobile-nav-item--logout" onClick={handleLogout}>🚪 Sair</button>
            </>
          )}

          {!logado && (
            <>
              <hr className="mobile-sidebar__divider" />
              <button className="mobile-nav-item mobile-nav-item--accent" onClick={() => navegar("/auth")}>
                Entrar / Criar conta
              </button>
            </>
          )}
        </nav>
      </aside>
    </>
  );
}