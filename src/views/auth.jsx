import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../assets/css/auth.css";
import { Popup } from "../assets/actions/PopUp.jsx";
import { authService } from "../models/authService.js";
import { useAuth } from "../models/AuthContext.jsx";

const SCREENS = { LOGIN: "login", REGISTER: "register", RECOVER: "recover" };

// ─── ICONS ───────────────────────────────────────────────────────────────────
const IconEye = ({ off }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
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

const IconUser = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconMail = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const IconLock = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const IconCheck = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconArrow = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

// ─── SHARED FIELD ────────────────────────────────────────────────────────────
function Field({
  label,
  icon,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  hint,
  rightSlot,
}) {
  return (
    <div className="field-container">
      <label className="field-label">{label}</label>
      <div className="field-input-wrapper">
        <span className={`field-icon ${error ? "error-state" : ""}`}>
          {icon}
        </span>
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
function PasswordStrength({ password }) {
  const checks = [
    { label: "Mínimo 8 caracteres", ok: password.length >= 8 },
    { label: "Letra maiúscula", ok: /[A-Z]/.test(password) },
    { label: "Número", ok: /[0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const colors = ["var(--error)", "var(--warn)", "var(--success)"];
  const labels = ["Fraca", "Média", "Forte"];

  if (!password) return null;

  return (
    <div className="pwd-strength-container">
      <div className="pwd-strength-bars">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="pwd-strength-bar"
            style={{
              background: i < score ? colors[score - 1] : "var(--input-border)",
            }}
          />
        ))}
      </div>
      <div className="pwd-strength-checklist">
        {checks.map((c) => (
          <span
            key={c.label}
            className={`pwd-strength-item ${c.ok ? "ok" : ""}`}
          >
            <span className="pwd-strength-bullet">{c.ok && <IconCheck />}</span>
            {c.label}
          </span>
        ))}
      </div>
      {score > 0 && (
        <span
          className="pwd-strength-label"
          style={{ color: colors[score - 1] }}
        >
          Senha {labels[score - 1]}
        </span>
      )}
    </div>
  );
}

// ─── SUBMIT BUTTON ────────────────────────────────────────────────────────────
function SubmitBtn({ children, loading, onClick, type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading}
      className="submit-btn"
    >
      {loading ? (
        <>
          <span className="submit-btn-spinner" />
          Aguarde...
        </>
      ) : (
        children
      )}
    </button>
  );
}

// ─── CARD WRAPPER ─────────────────────────────────────────────────────────────
function AuthCard({ children }) {
  return <div className="auth-card">{children}</div>;
}

// ─── LOGO ─────────────────────────────────────────────────────────────────────
function Logo() {
  return (
    <div className="logo-container">
      <div className="logo-badge">⚡</div>
      <span className="logo-text">
        Match<span className="logo-accent">up</span>
      </span>
    </div>
  );
}

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────
function LoginScreen({ setScreen, notificar }) {
  const navigate = useNavigate();
  const { loginSessao } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const e = {};
    if (!email) e.email = "E-mail obrigatório";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "E-mail inválido";
    if (!password) e.password = "Senha obrigatória";
    return e;
  }

  async function handleLogin(e) {
    if (e) e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setLoading(true);

    const resultado = await authService.login(email, password);
    setLoading(false);

    if (resultado.sucesso) {
      notificar(resultado.mensagem, "success");

      // 3. SALVA OS DADOS DO USUÁRIO NA SESSÃO DO REACT E LOCALSTORAGE
      loginSessao(resultado.user);

      // 4. Redireciona o usuário após 0.5s para a página de jogos
      setTimeout(() => {
        navigate("/games"); // Ajustado para a rota informada (/games)
      }, 500);
    } else {
      notificar(resultado.mensagem, "error");
    }
  }

  return (
    <AuthCard>
      <Logo />
      <h2 className="screen-title">Bem-vindo de volta</h2>
      <p className="screen-subtitle">Entre na sua conta para continuar.</p>

      <form className="form-grid" onSubmit={handleLogin}>
        <Field
          label="E-mail"
          icon={<IconMail />}
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="seu@email.com"
          error={errors.email}
        />
        <Field
          label="Senha"
          icon={<IconLock />}
          type={showPass ? "text" : "password"}
          value={password}
          onChange={setPassword}
          placeholder="••••••••"
          error={errors.password}
          rightSlot={
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--icon)",
                padding: 2,
              }}
            >
              <IconEye off={showPass} />
            </button>
          }
        />

        <div className="text-link-wrapper">
          <button
            type="button"
            onClick={() => setScreen(SCREENS.RECOVER)}
            className="text-link-btn"
          >
            Esqueci minha senha
          </button>
        </div>

        <SubmitBtn type="submit" loading={loading}>
          Entrar
        </SubmitBtn>
      </form>

      <p className="footer-text">
        Não tem conta?{" "}
        <button
          type="button"
          onClick={() => setScreen(SCREENS.REGISTER)}
          className="footer-btn"
        >
          Criar conta
        </button>
      </p>
    </AuthCard>
  );
}

// ─── REGISTER SCREEN ──────────────────────────────────────────────────────────
function RegisterScreen({ setScreen, notificar }) {
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  function validate() {
    const e = {};
    if (!nickname || nickname.trim().length < 3)
      e.nickname = "Nick deve ter ao menos 3 caracteres";
    if (nickname.length > 50)
      e.nickname = "Nick pode ter no máximo 50 caracteres";
    if (!email) e.email = "E-mail obrigatório";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "E-mail inválido";
    if (!password) e.password = "Senha obrigatória";
    else if (password.length < 8) e.password = "Mínimo 8 caracteres";
    if (password !== confirm) e.confirm = "Senhas não coincidem";
    if (!agreed) e.agreed = "Você deve aceitar os termos";
    return e;
  }

  async function handleRegister(e) {
    if (e) e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setLoading(true);

    const resultado = await authService.register(email, password, nickname);

    setLoading(false);

    if (resultado.sucesso) {
      notificar(resultado.mensagem, "success");
      setScreen(SCREENS.LOGIN);
    } else {
      notificar(resultado.mensagem, "error");
    }
  }

  return (
    <AuthCard>
      <Logo />
      <h2 className="screen-title">Criar conta</h2>
      <p className="screen-subtitle">Registre-se e encontre seu time ideal.</p>

      <form className="form-grid-register" onSubmit={handleRegister}>
        <Field
          label="Nickname"
          icon={<IconUser />}
          value={nickname}
          onChange={setNickname}
          placeholder="SeuNickGamer"
          error={errors.nickname}
          hint="Será exibido para outros jogadores (máx. 50 caracteres)"
        />
        <Field
          label="E-mail"
          icon={<IconMail />}
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="seu@email.com"
          error={errors.email}
        />
        <div>
          <Field
            label="Senha"
            icon={<IconLock />}
            type={showPass ? "text" : "password"}
            value={password}
            onChange={setPassword}
            placeholder="Mínimo 8 caracteres"
            error={errors.password}
            rightSlot={
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--icon)",
                  padding: 2,
                }}
              >
                <IconEye off={showPass} />
              </button>
            }
          />
          <PasswordStrength password={password} />
        </div>
        <Field
          label="Confirmar senha"
          icon={<IconLock />}
          type={showConfirm ? "text" : "password"}
          value={confirm}
          onChange={setConfirm}
          placeholder="Repita a senha"
          error={errors.confirm}
          rightSlot={
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--icon)",
                padding: 2,
              }}
            >
              <IconEye off={showConfirm} />
            </button>
          }
        />

        <label className="terms-label">
          <div
            onClick={() => setAgreed((v) => !v)}
            className={`terms-checkbox ${agreed ? "agreed" : ""} ${errors.agreed ? "error-state" : ""}`}
          >
            {agreed && (
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
          <span className="terms-text">
            Concordo com os{" "}
            <span className="terms-highlight">Termos de Uso</span> e a{" "}
            <span className="terms-highlight">Política de Privacidade</span>
          </span>
        </label>
        {errors.agreed && (
          <span className="field-error-msg" style={{ marginTop: -8 }}>
            {errors.agreed}
          </span>
        )}

        <SubmitBtn type="submit" loading={loading}>
          Criar conta gratuita
        </SubmitBtn>
      </form>

      <p className="footer-text">
        Já tem conta?{" "}
        <button
          type="button"
          onClick={() => setScreen(SCREENS.LOGIN)}
          className="footer-btn"
        >
          Entrar
        </button>
      </p>
    </AuthCard>
  );
}

// ─── RECOVER SCREEN ──────────────────────────────────────────────────────────
function RecoverScreen({ setScreen, notificar }) {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  function validate() {
    const e = {};
    if (!email) e.email = "E-mail obrigatório";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "E-mail inválido";
    return e;
  }

  async function handleRecover(e) {
    if (e) e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setLoading(true);

    const resultado = await authService.recoverPassword(email);
    setLoading(false);

    if (resultado.sucesso) {
      notificar(resultado.mensagem, "success");
      setSent(true);
    } else {
      notificar(resultado.mensagem, "error");
    }
  }

  return (
    <AuthCard>
      <Logo />
      {!sent ? (
        <>
          <button
            type="button"
            onClick={() => setScreen(SCREENS.LOGIN)}
            className="back-btn"
          >
            <IconArrow /> Voltar para login
          </button>
          <h2 className="screen-title">Recuperar senha</h2>
          <p className="screen-subtitle" style={{ lineHeight: 1.6 }}>
            Informe seu e-mail de cadastro. Enviaremos um link para redefinir
            sua senha.
          </p>
          <form className="form-grid" onSubmit={handleRecover}>
            <Field
              label="E-mail cadastrado"
              icon={<IconMail />}
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="seu@email.com"
              error={errors.email}
            />
            <SubmitBtn type="submit" loading={loading}>
              Enviar link de recuperação
            </SubmitBtn>
          </form>
        </>
      ) : (
        <div className="success-state-container">
          <div className="success-icon-badge">📬</div>
          <h2 className="success-title">E-mail enviado!</h2>
          <p className="success-description">
            Se o endereço <strong className="success-highlight">{email}</strong>{" "}
            estiver cadastrado, você receberá um link de redefinição em
            instantes.
          </p>
          <p className="success-subtext">
            Não encontrou? Verifique a caixa de spam.
          </p>
          <button
            type="button"
            onClick={() => setScreen(SCREENS.LOGIN)}
            className="outline-btn"
          >
            Voltar ao login
          </button>
        </div>
      )}
    </AuthCard>
  );
}

// ─── ROOT COMPONENT ──────────────────────────────────────────────────────────
export default function AuthScreens() {
  const [screen, setScreen] = useState(SCREENS.LOGIN);

  // Controle de estado centralizado para o componente Popup separado
  const [popupConfig, setPopupConfig] = useState({
    isOpen: false,
    message: "",
    type: "info",
  });

  const notificar = (message, type = "info") => {
    setPopupConfig({ isOpen: true, message, type });
  };

  const fecharPopup = () => {
    setPopupConfig((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <div className="main-layout">
      {/* Componente flutuante global de Pop-up */}
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
            <pattern
              id="gr"
              width="48"
              height="48"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 48 0 L 0 0 0 48"
                fill="none"
                stroke="white"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#gr)" />
        </svg>

        {/* Floating decorative elements */}
        {[
          { top: "15%", left: "6%", size: 40, delay: "0s", icon: "🎮" },
          { top: "70%", left: "4%", size: 32, delay: "1.2s", icon: "⚔️" },
          { top: "30%", right: "5%", size: 36, delay: "0.6s", icon: "🏆" },
          { top: "75%", right: "7%", size: 30, delay: "1.8s", icon: "🎯" },
        ].map((d, i) => (
          <div
            key={i}
            className="floating-icon"
            style={{
              top: d.top,
              left: d.left,
              right: d.right,
              fontSize: d.size,
              animation: `float 4s ease-in-out ${d.delay} infinite`,
            }}
          >
            {d.icon}
          </div>
        ))}
      </div>

      {/* Left panel — visible on wider screens */}
      <div className="left-panel">
        <div className="left-panel-content">
          <div className="badge-tag">Sistema de Matchmaking</div>
          <h1 className="main-headline">
            Encontre
            <br />
            seu time.
            <br />
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
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span className="feature-text">{txt}</span>
              </div>
            ))}
          </div>

          {/* Screen tabs */}
          <div className="tabs-container">
            {[
              { id: SCREENS.LOGIN, label: "Login" },
              { id: SCREENS.REGISTER, label: "Cadastro" },
              { id: SCREENS.RECOVER, label: "Recuperar senha" },
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
        {screen === SCREENS.LOGIN && (
          <LoginScreen setScreen={setScreen} notificar={notificar} />
        )}
        {screen === SCREENS.REGISTER && (
          <RegisterScreen setScreen={setScreen} notificar={notificar} />
        )}
        {screen === SCREENS.RECOVER && (
          <RecoverScreen setScreen={setScreen} notificar={notificar} />
        )}
      </div>
    </div>
  );
}
