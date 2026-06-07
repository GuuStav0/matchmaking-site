// src/views/resetPassword.jsx
// Sprint 3 — Tela de redefinição de senha (acessada pelo link no e-mail)
//
// URL esperada:  /reset-password?token=<token>
//
// Fluxo:
//   1. Ao montar, lê o ?token= da URL e chama authService.verifyResetToken
//   2. Se válido → exibe formulário com campos nova senha + confirmação
//   3. Ao submeter → chama authService.resetPassword
//   4. Sucesso → redireciona para /auth com popup de confirmação

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authService } from "../models/authService.js";
import { Popup } from "../assets/actions/PopUp.jsx";
import "../assets/css/auth.css";
import "../assets/css/resetPassword.css";

// ─── Ícones inline ────────────────────────────────────────────────────────────
const IconLock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const IconEye = ({ off }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {off ? (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </>
    ) : (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </>
    )}
  </svg>
);

const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

// ─── Campo reutilizável ───────────────────────────────────────────────────────
function Field({ label, icon, type = "text", value, onChange, placeholder, error, rightSlot }) {
  return (
    <div className="field-container">
      <label className="field-label">{label}</label>
      <div className="field-input-wrapper">
        <span className={`field-icon ${error ? "error-state" : ""}`}>{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`field-input ${error ? "error-state" : ""}`}
        />
        {rightSlot && <span className="field-right-slot">{rightSlot}</span>}
      </div>
      {error && <span className="field-error-msg">{error}</span>}
    </div>
  );
}

// ─── Indicador de força da senha ──────────────────────────────────────────────
function PasswordStrength({ password }) {
  const checks = [
    { label: "Mínimo 8 caracteres", ok: password.length >= 8 },
    { label: "Letra maiúscula",      ok: /[A-Z]/.test(password) },
    { label: "Número",               ok: /[0-9]/.test(password) },
  ];
  const score  = checks.filter((c) => c.ok).length;
  const colors = ["var(--error)", "var(--warn)", "var(--success)"];
  const labels = ["Fraca", "Média", "Forte"];
  if (!password) return null;
  return (
    <div className="pwd-strength-container">
      <div className="pwd-strength-bars">
        {[0, 1, 2].map((i) => (
          <div key={i} className="pwd-strength-bar"
               style={{ background: i < score ? colors[score - 1] : "var(--input-border)" }} />
        ))}
      </div>
      <div className="pwd-strength-checklist">
        {checks.map((c) => (
          <span key={c.label} className={`pwd-strength-item ${c.ok ? "ok" : ""}`}>
            <span className="pwd-strength-bullet">{c.ok && <IconCheck />}</span>
            {c.label}
          </span>
        ))}
      </div>
      {score > 0 && (
        <span className="pwd-strength-label" style={{ color: colors[score - 1] }}>
          Senha {labels[score - 1]}
        </span>
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function ResetPassword() {
  const navigate          = useNavigate();
  const [searchParams]    = useSearchParams();
  const token             = searchParams.get("token") || "";

  // Estados de verificação do token
  const [tokenStatus, setTokenStatus] = useState("checking"); // checking | valid | invalid | expired
  const [tokenMsg, setTokenMsg]       = useState("");

  // Formulário
  const [newPassword, setNewPassword]     = useState("");
  const [confirmPass, setConfirmPass]     = useState("");
  const [showNew, setShowNew]             = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);
  const [errors, setErrors]               = useState({});
  const [loading, setLoading]             = useState(false);
  const [done, setDone]                   = useState(false);

  // Popup
  const [popupConfig, setPopupConfig] = useState({ isOpen: false, message: "", type: "info" });
  const notificar = (message, type = "info") => setPopupConfig({ isOpen: true, message, type });
  const fecharPopup = () => setPopupConfig((p) => ({ ...p, isOpen: false }));

  // ── Verifica o token ao montar ─────────────────────────────────────────────
  useEffect(() => {
    if (!token) {
      setTokenStatus("invalid");
      setTokenMsg("Link inválido. Nenhum token encontrado na URL.");
      return;
    }

    authService.verifyResetToken(token).then((res) => {
      if (res.sucesso) {
        setTokenStatus("valid");
      } else {
        const isExpired = res.mensagem?.toLowerCase().includes("expir");
        setTokenStatus(isExpired ? "expired" : "invalid");
        setTokenMsg(res.mensagem || "Token inválido.");
      }
    });
  }, [token]);

  // ── Validação ─────────────────────────────────────────────────────────────
  function validate() {
    const e = {};
    if (!newPassword)               e.newPassword = "Senha obrigatória";
    else if (newPassword.length < 8) e.newPassword = "Mínimo 8 caracteres";
    if (newPassword !== confirmPass) e.confirmPass = "Senhas não coincidem";
    return e;
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);

    const res = await authService.resetPassword(token, newPassword);
    setLoading(false);

    if (res.sucesso) {
      setDone(true);
      notificar(res.mensagem, "success");
      setTimeout(() => navigate("/auth"), 3000);
    } else {
      notificar(res.mensagem, "error");
    }
  }

  // ─── Layout ────────────────────────────────────────────────────────────────
  return (
    <div className="reset-page">
      <Popup isOpen={popupConfig.isOpen} message={popupConfig.message}
             type={popupConfig.type} onClose={fecharPopup} />

      {/* Background FX (mesmo padrão da tela de auth) */}
      <div className="bg-fx-layer">
        <div className="bg-blur-top" />
        <div className="bg-blur-bottom" />
        <svg className="bg-grid-svg" width="100%" height="100%">
          <defs>
            <pattern id="gr2" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#gr2)"/>
        </svg>
      </div>

      {/* Card central */}
      <div className="reset-card-wrapper">
        <div className="auth-card reset-card">

          {/* Logo */}
          <div className="logo-container">
            <div className="logo-badge">⚡</div>
            <span className="logo-text">Match<span className="logo-accent">up</span></span>
          </div>

          {/* ── Verificando token ── */}
          {tokenStatus === "checking" && (
            <div className="reset-state">
              <div className="players-spinner" style={{ margin: "0 auto" }} />
              <p className="reset-state__text">Validando link de recuperação…</p>
            </div>
          )}

          {/* ── Token inválido ── */}
          {(tokenStatus === "invalid" || tokenStatus === "expired") && (
            <div className="reset-state">
              <div className="reset-state__icon reset-state__icon--error">
                {tokenStatus === "expired" ? "⏰" : "🚫"}
              </div>
              <h2 className="screen-title" style={{ textAlign: "center" }}>
                {tokenStatus === "expired" ? "Link expirado" : "Link inválido"}
              </h2>
              <p className="screen-subtitle" style={{ textAlign: "center", lineHeight: 1.6 }}>
                {tokenMsg}
              </p>
              <button
                className="submit-btn"
                style={{ marginTop: "1rem" }}
                onClick={() => navigate("/auth")}
              >
                Solicitar novo link
              </button>
            </div>
          )}

          {/* ── Token válido → formulário ── */}
          {tokenStatus === "valid" && !done && (
            <>
              <h2 className="screen-title">Nova senha</h2>
              <p className="screen-subtitle" style={{ lineHeight: 1.6 }}>
                Escolha uma senha segura para sua conta Matchup.
              </p>

              <form className="form-grid" onSubmit={handleSubmit}>
                <div>
                  <Field
                    label="Nova senha"
                    icon={<IconLock />}
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={setNewPassword}
                    placeholder="Mínimo 8 caracteres"
                    error={errors.newPassword}
                    rightSlot={
                      <button type="button" onClick={() => setShowNew((v) => !v)}
                              style={{ background: "none", border: "none", cursor: "pointer",
                                       color: "var(--icon)", padding: 2 }}>
                        <IconEye off={showNew} />
                      </button>
                    }
                  />
                  <PasswordStrength password={newPassword} />
                </div>

                <Field
                  label="Confirmar nova senha"
                  icon={<IconLock />}
                  type={showConfirm ? "text" : "password"}
                  value={confirmPass}
                  onChange={setConfirmPass}
                  placeholder="Repita a senha"
                  error={errors.confirmPass}
                  rightSlot={
                    <button type="button" onClick={() => setShowConfirm((v) => !v)}
                            style={{ background: "none", border: "none", cursor: "pointer",
                                     color: "var(--icon)", padding: 2 }}>
                      <IconEye off={showConfirm} />
                    </button>
                  }
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="submit-btn"
                >
                  {loading ? (
                    <><span className="submit-btn-spinner" /> Salvando…</>
                  ) : (
                    "Redefinir senha"
                  )}
                </button>
              </form>
            </>
          )}

          {/* ── Sucesso ── */}
          {done && (
            <div className="success-state-container">
              <div className="success-icon-badge">✅</div>
              <h2 className="success-title">Senha redefinida!</h2>
              <p className="success-description">
                Sua senha foi alterada com sucesso. Redirecionando para o login…
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
