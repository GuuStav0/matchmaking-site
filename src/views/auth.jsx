// src/views/auth.jsx
import { useState } from "react";
import { Popup } from "../assets/actions/PopUp.jsx";
import { SCREENS } from "../components/auth/AuthShared.jsx";
import LoginForm   from "../components/auth/LoginForm.jsx";
import RegisterForm from "../components/auth/RegisterForm.jsx";
import RecoverForm  from "../components/auth/RecoverForm.jsx";
import "../assets/css/auth.css";

export default function AuthScreens() {
  const [screen, setScreen] = useState(SCREENS.LOGIN);
  const [popupConfig, setPopupConfig] = useState({ isOpen: false, message: "", type: "info" });

  const notificar = (message, type = "info") => {
    setPopupConfig({ isOpen: true, message, type });
  };

  const fecharPopup = () => {
    setPopupConfig((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <div className="main-layout">
      <Popup
        isOpen={popupConfig.isOpen}
        message={popupConfig.message}
        type={popupConfig.type}
        onClose={fecharPopup}
      />

      {/* Background FX Layer */}
      <div className="bg-fx-layer">
        <div className="bg-blur-top" />
        <div className="bg-blur-bottom" />
        <svg className="bg-grid-svg" width="100%" height="100%">
          <defs>
            <pattern id="gr" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#gr)" />
        </svg>

        {[
          { top: "15%", left: "6%",  size: 40, delay: "0s",   icon: "🎮" },
          { top: "70%", left: "4%",  size: 32, delay: "1.2s", icon: "⚔️" },
          { top: "30%", right: "5%", size: 36, delay: "0.6s", icon: "🏆" },
          { top: "75%", right: "7%", size: 30, delay: "1.8s", icon: "🎯" },
        ].map((d, i) => (
          <div
            key={i}
            className="floating-icon"
            style={{ top: d.top, left: d.left, right: d.right, fontSize: d.size, animation: `float 4s ease-in-out ${d.delay} infinite` }}
          >
            {d.icon}
          </div>
        ))}
      </div>

      {/* Left panel */}
      <div className="left-panel">
        <div className="left-panel-content">
          <div className="badge-tag">Sistema de Matchmaking</div>
          <h1 className="main-headline">
            Encontre<br />seu time.<br />
            <span className="main-headline-gradient">Jogue melhor.</span>
          </h1>
          <p className="main-description">
            Pare de depender da Solo Queue. Conecte-se com jogadores que têm os
            mesmos objetivos, horários e estilo de jogo que você.
          </p>

          <div className="features-list">
            {[
              "Filtros por jogo, rank e estilo",
              "Grupos pre-made sem toxicidade",
              "Perfil multidimensional de jogador",
            ].map((txt) => (
              <div key={txt} className="feature-item">
                <div className="feature-icon-wrapper">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span className="feature-text">{txt}</span>
              </div>
            ))}
          </div>

          <div className="tabs-container">
            {[
              { id: SCREENS.LOGIN,    label: "Login" },
              { id: SCREENS.REGISTER, label: "Cadastro" },
              { id: SCREENS.RECOVER,  label: "Recuperar senha" },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setScreen(s.id)}
                className={`tab-btn ${screen === s.id ? "active" : ""}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — forms */}
      <div className="right-panel">
        {screen === SCREENS.LOGIN    && <LoginForm    setScreen={setScreen} notificar={notificar} />}
        {screen === SCREENS.REGISTER && <RegisterForm setScreen={setScreen} notificar={notificar} />}
        {screen === SCREENS.RECOVER  && <RecoverForm  setScreen={setScreen} notificar={notificar} />}
      </div>
    </div>
  );
}
