// src/components/auth/RecoverForm.jsx
import { useState } from "react";
import { authService } from "../../models/authService.js";
import { SCREENS, Field, SubmitBtn, AuthCard, Logo, IconMail, IconArrow } from "./AuthShared.jsx";

export default function RecoverForm({ setScreen, notificar }) {
  const [email,   setEmail]   = useState("");
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);

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
          <button type="button" onClick={() => setScreen(SCREENS.LOGIN)} className="back-btn">
            <IconArrow /> Voltar para login
          </button>
          <h2 className="screen-title">Recuperar senha</h2>
          <p className="screen-subtitle" style={{ lineHeight: 1.6 }}>
            Informe seu e-mail de cadastro. Enviaremos um link para redefinir sua senha.
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
            <SubmitBtn type="submit" loading={loading}>Enviar link de recuperação</SubmitBtn>
          </form>
        </>
      ) : (
        <div className="success-state-container">
          <div className="success-icon-badge">📬</div>
          <h2 className="success-title">E-mail enviado!</h2>
          <p className="success-description">
            Se o endereço <strong className="success-highlight">{email}</strong>{" "}
            estiver cadastrado, você receberá um link de redefinição em instantes.
          </p>
          <p className="success-subtext">Não encontrou? Verifique a caixa de spam.</p>
          <button type="button" onClick={() => setScreen(SCREENS.LOGIN)} className="outline-btn">
            Voltar ao login
          </button>
        </div>
      )}
    </AuthCard>
  );
}
