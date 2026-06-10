import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { authService } from "../models/authService.js";
import { Popup } from "../assets/actions/PopUp.jsx";
import "../assets/css/auth.css"; // Reaproveita os estilos do card

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({ isOpen: false, message: "", type: "info" });

  const notificar = (message, type = "info") => setPopup({ isOpen: true, message, type });

  const handleReset = async (e) => {
    e.preventDefault();
    if (!password || password.length < 8) {
      return notificar("A senha deve ter no mínimo 8 caracteres", "error");
    }
    if (password !== confirm) {
      return notificar("As senhas não coincidem", "error");
    }

    setLoading(true);
    const resultado = await authService.resetPassword(token, password);
    setLoading(false);

    if (resultado.sucesso) {
      notificar(resultado.mensagem, "success");
      setTimeout(() => navigate("/auth"), 2000);
    } else {
      notificar(resultado.mensagem, "error");
    }
  };

  return (
    <div className="main-layout" style={{ justifyContent: "center", alignItems: "center" }}>
      <Popup isOpen={popup.isOpen} message={popup.message} type={popup.type} onClose={() => setPopup({ ...popup, isOpen: false })} />
      
      <div className="auth-card" style={{ width: "100%", maxWidth: 450 }}>
        <div className="logo-container">
          <div className="logo-badge">⚡</div>
          <span className="logo-text">Match<span className="logo-accent">up</span></span>
        </div>
        
        <h2 className="screen-title">Nova senha</h2>
        <p className="screen-subtitle">Digite e confirme sua nova senha de acesso.</p>

        <form className="form-grid" onSubmit={handleReset}>
          <div className="field-container">
            <label className="field-label">Nova Senha</label>
            <input 
              type="password" 
              className="field-input" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="••••••••" 
            />
          </div>

          <div className="field-container">
            <label className="field-label">Confirmar Nova Senha</label>
            <input 
              type="password" 
              className="field-input" 
              value={confirm} 
              onChange={e => setConfirm(e.target.value)} 
              placeholder="••••••••" 
            />
          </div>

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? "Salvando..." : "Atualizar senha"}
          </button>
        </form>
      </div>
    </div>
  );
}