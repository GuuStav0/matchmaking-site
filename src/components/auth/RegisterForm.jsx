// src/components/auth/RegisterForm.jsx
import { useState } from "react";
import { authService } from "../../models/authService.js";
import {
  SCREENS,
  Field, PasswordStrength, SubmitBtn, AuthCard, Logo,
  IconUser, IconMail, IconLock, IconCheck, EyeToggle,
} from "./AuthShared.jsx";

export default function RegisterForm({ setScreen, notificar }) {
  const [email,       setEmail]       = useState("");
  const [nickname,    setNickname]    = useState("");
  const [password,    setPassword]    = useState("");
  const [confirm,     setConfirm]     = useState("");
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors,      setErrors]      = useState({});
  const [loading,     setLoading]     = useState(false);
  const [agreed,      setAgreed]      = useState(false);

  function validate() {
    const e = {};
    if (!nickname || nickname.trim().length < 3) e.nickname = "Nick deve ter ao menos 3 caracteres";
    if (nickname.length > 50)                    e.nickname = "Nick pode ter no máximo 50 caracteres";
    if (!email)                                  e.email = "E-mail obrigatório";
    else if (!/\S+@\S+\.\S+/.test(email))        e.email = "E-mail inválido";
    if (!password)                               e.password = "Senha obrigatória";
    else if (password.length < 8)                e.password = "Mínimo 8 caracteres";
    if (password !== confirm)                    e.confirm = "Senhas não coincidem";
    if (!agreed)                                 e.agreed = "Você deve aceitar os termos";
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
            rightSlot={<EyeToggle show={showPass} onToggle={() => setShowPass((v) => !v)} />}
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
          rightSlot={<EyeToggle show={showConfirm} onToggle={() => setShowConfirm((v) => !v)} />}
        />

        <label className="terms-label">
          <div
            onClick={() => setAgreed((v) => !v)}
            className={`terms-checkbox ${agreed ? "agreed" : ""} ${errors.agreed ? "error-state" : ""}`}
          >
            {agreed && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
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
          <span className="field-error-msg" style={{ marginTop: -8 }}>{errors.agreed}</span>
        )}

        <SubmitBtn type="submit" loading={loading}>Criar conta gratuita</SubmitBtn>
      </form>

      <p className="footer-text">
        Já tem conta?{" "}
        <button type="button" onClick={() => setScreen(SCREENS.LOGIN)} className="footer-btn">
          Entrar
        </button>
      </p>
    </AuthCard>
  );
}
