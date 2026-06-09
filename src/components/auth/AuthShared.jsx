// src/components/auth/AuthShared.jsx
// Ícones, componentes e constantes compartilhados entre LoginForm, RegisterForm e RecoverForm.

// ─── CONSTANTES ───────────────────────────────────────────────────────────────
export const SCREENS = { LOGIN: "login", REGISTER: "register", RECOVER: "recover" };

// ─── ÍCONES ───────────────────────────────────────────────────────────────────
export const IconEye = ({ off }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {off ? (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    ) : (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    )}
  </svg>
);

export const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export const IconMail = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

export const IconLock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const IconArrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

// ─── FIELD ────────────────────────────────────────────────────────────────────
export function Field({ label, icon, type = "text", value, onChange, placeholder, error, hint, rightSlot }) {
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
      {hint && !error && <span className="field-hint-msg">{hint}</span>}
    </div>
  );
}

// ─── PASSWORD STRENGTH ────────────────────────────────────────────────────────
export function PasswordStrength({ password }) {
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

// ─── SUBMIT BUTTON ────────────────────────────────────────────────────────────
export function SubmitBtn({ children, loading, onClick, type = "button" }) {
  return (
    <button type={type} onClick={onClick} disabled={loading} className="submit-btn">
      {loading ? (
        <>
          <span className="submit-btn-spinner" />
          Aguarde...
        </>
      ) : children}
    </button>
  );
}

// ─── CARD WRAPPER ─────────────────────────────────────────────────────────────
export function AuthCard({ children }) {
  return <div className="auth-card">{children}</div>;
}

// ─── LOGO ─────────────────────────────────────────────────────────────────────
export function Logo() {
  return (
    <div className="logo-container">
      <div className="logo-badge">⚡</div>
      <span className="logo-text">
        Match<span className="logo-accent">up</span>
      </span>
    </div>
  );
}

// ─── TOGGLE SENHA ─────────────────────────────────────────────────────────────
export function EyeToggle({ show, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--icon)", padding: 2 }}
    >
      <IconEye off={show} />
    </button>
  );
}
