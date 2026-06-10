// src/components/auth/LoginForm.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../models/authContext.jsx";
import { authService } from "../../models/authService.js";
import { SCREENS, Field, SubmitBtn, AuthCard, Logo, IconMail, IconLock, EyeToggle } from "./AuthShared.jsx";

export default function LoginForm({ setScreen, notificar }) {
  const navigate = useNavigate();
  const { loginSessao } = useAuth();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);

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
      loginSessao(resultado.usuario);
      setTimeout(() => navigate("/games"), 500);
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
          rightSlot={<EyeToggle show={showPass} onToggle={() => setShowPass((v) => !v)} />}
        />

        <div className="text-link-wrapper">
          <button type="button" onClick={() => setScreen(SCREENS.RECOVER)} className="text-link-btn">
            Esqueci minha senha
          </button>
        </div>

        <SubmitBtn type="submit" loading={loading}>Entrar</SubmitBtn>
      </form>

      <p className="footer-text">
        Não tem conta?{" "}
        <button type="button" onClick={() => setScreen(SCREENS.REGISTER)} className="footer-btn">
          Criar conta
        </button>
      </p>
    </AuthCard>
  );
}
