import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../models/authContext.jsx";

export default function Header() {
  const navigate = useNavigate();
  const { logado, user, logoutSessao } = useAuth(); // <-- Puxa os dados da sessão global
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const dropdownRef = useRef(null);

  const navAuth = () => {
    navigate("/auth");
  };

  const handleLogout = () => {
    logoutSessao();
    setDropdownAberto(false);
    navigate("/auth");
  };

  // Função para pegar as duas primeiras iniciais do Nickname
  const getIniciais = (nickname) => {
    if (!nickname) return "M"; // Fallback caso não ache o nickname
    const nomes = nickname.trim().split(" ");
    if (nomes.length > 1) {
      return (nomes[0][0] + nomes[1][0]).toUpperCase();
    }
    return nomes[0].substring(0, 2).toUpperCase();
  };

  // Fecha o dropdown se o usuário clicar em qualquer lugar fora dele
  useEffect(() => {
    function clicarFora(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownAberto(false);
      }
    }
    document.addEventListener("mousedown", clicarFora);
    return () => document.removeEventListener("mousedown", clicarFora);
  }, []);

  return (
    <nav className="about-navbar">
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

      <div className="about-nav-menu">
        <span
          className="nav-link"
          onClick={() => navigate("/games")}
          style={{ cursor: "pointer" }}
        >
          Explorar
        </span>
        <span className="nav-link">Grupos</span>
        <span className="nav-link">Ranking</span>

        {/* CONDIÇÃO DE SESSÃO */}
        {logado ? (
          <div
            className="header-profile-container"
            ref={dropdownRef}
            style={{ position: "relative" }}
          >
            {/* Ícone clicável do Perfil com a Seta ao lado */}
            <div
              className="header-avatar-clickable"
              onClick={() => setDropdownAberto(!dropdownAberto)}
              style={{ cursor: "pointer" }}
            >
              <div className="avatar-wrapper-with-caret">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt="Perfil"
                    className="header-avatar-img"
                    draggable="false" /* Impedir que o usuário arraste a imagem */
                  />
                ) : (
                  <div className="header-avatar-placeholder">
                    {getIniciais(user?.nickname || user?.email)}
                  </div>
                )}

                {/* Triângulo indicador de Dropdown (Affordance) */}
                <span
                  className={`header-dropdown-caret ${dropdownAberto ? "aberto" : ""}`}
                >
                  ▼
                </span>
              </div>
            </div>

            {/* Menu Dropdown */}
            {dropdownAberto && (
              <div className="header-dropdown-menu">
                <div className="dropdown-user-info">
                  <p className="dropdown-nickname">
                    {user?.nickname || "Jogador"}
                  </p>
                  <p className="dropdown-email">{user?.email}</p>
                </div>
                <hr className="dropdown-divider" />
                <button
                  onClick={() => {
                    navigate("/perfil");
                    setDropdownAberto(false);
                  }}
                  className="dropdown-item"
                >
                  Meu Perfil
                </button>
                <button
                  onClick={handleLogout}
                  className="dropdown-item logout-btn"
                >
                  Sair (Sign Out)
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Se não estiver logado, exibe o botão tradicional */
          <button
            onClick={navAuth}
            className="cta-primary"
            style={{ padding: "8px 20px", fontSize: 13 }}
          >
            Entrar
          </button>
        )}
      </div>
    </nav>
  );
}
