import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../models/authContext.jsx";
import Header from "../assets/actions/header.jsx";
import Footer from "../assets/actions/footer.jsx";
import "../assets/css/profile.css";

const DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export default function ProfileSetup() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [selectedDays, setSelectedDays] = useState([]);
  const [timeStart, setTimeStart] = useState("");
  const [timeEnd, setTimeEnd] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function toggleDay(day) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function validate() {
    const e = {};
    if (!bio || bio.trim().length < 10)
      e.bio = "Bio deve ter ao menos 10 caracteres";
    if (bio.length > 300)
      e.bio = "Bio pode ter no máximo 300 caracteres";
    if (selectedDays.length === 0)
      e.days = "Selecione ao menos um dia disponível";
    if (!timeStart)
      e.timeStart = "Informe o horário de início";
    if (!timeEnd)
      e.timeEnd = "Informe o horário de fim";
    if (timeStart && timeEnd && timeStart >= timeEnd)
      e.timeEnd = "Horário de fim deve ser maior que o de início";
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setLoading(true);

    // Formata schedule_availability como "Seg,Ter 18:00-22:00"
    const scheduleAvailability = `${selectedDays.join(",")} ${timeStart}-${timeEnd}`;

    try {
      // Usa PUT /api/profiles/:id pois o perfil já existe (criado no cadastro)
      const response = await fetch(`http://localhost:3000/api/profiles/${user?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: user?.nickname,
          bio: bio.trim(),
          avatar_url: avatarUrl.trim() || null,
          schedule_availability: scheduleAvailability,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.status === "erro") {
        throw new Error(result.mensagem || "Erro ao salvar perfil.");
      }

      navigate("/games");
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="profile-page">
      <Header />

      <main className="profile-main">
        <div className="profile-card">
          <div className="profile-card__header">
            <div className="profile-logo">
              <div className="profile-badge">👤</div>
              <span className="profile-logo-text">
                Match<span className="profile-logo-accent">up</span>
              </span>
            </div>
            <h1 className="profile-title">Configure seu perfil</h1>
            <p className="profile-subtitle">
              Essas informações ajudam outros jogadores a te encontrar.
            </p>
          </div>

          <form className="profile-form" onSubmit={handleSubmit}>

            {/* AVATAR URL */}
            <div className="field-block">
              <label className="field-label">URL da foto de perfil <span className="field-optional">(opcional)</span></label>
              <div className="avatar-preview-row">
                <div className="avatar-preview">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Preview" className="avatar-preview-img"
                      onError={(e) => { e.target.style.display = "none"; }} />
                  ) : (
                    <span className="avatar-preview-placeholder">
                      {user?.nickname?.substring(0, 2).toUpperCase() || "?"}
                    </span>
                  )}
                </div>
                <input
                  type="url"
                  className="profile-input"
                  placeholder="https://exemplo.com/sua-foto.jpg"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                />
              </div>
            </div>

            {/* BIO */}
            <div className="field-block">
              <label className="field-label">Bio</label>
              <textarea
                className={`profile-textarea ${errors.bio ? "input-error" : ""}`}
                placeholder="Fale um pouco sobre você como jogador... (ex: jogador competitivo de FPS, disponível à noite)"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
              />
              <span className="field-counter">{bio.length}/300</span>
              {errors.bio && <span className="field-error">{errors.bio}</span>}
            </div>

            {/* DIAS DISPONÍVEIS */}
            <div className="field-block">
              <label className="field-label">Dias disponíveis</label>
              <div className="days-grid">
                {DAYS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    className={`day-btn ${selectedDays.includes(day) ? "day-btn--active" : ""}`}
                    onClick={() => toggleDay(day)}
                  >
                    {day}
                  </button>
                ))}
              </div>
              {errors.days && <span className="field-error">{errors.days}</span>}
            </div>

            {/* HORÁRIOS */}
            <div className="field-block">
              <label className="field-label">Horário disponível</label>
              <div className="time-row">
                <div className="time-field">
                  <label className="time-label">De</label>
                  <input
                    type="time"
                    className={`time-input ${errors.timeStart ? "input-error" : ""}`}
                    value={timeStart}
                    onChange={(e) => setTimeStart(e.target.value)}
                  />
                  {errors.timeStart && <span className="field-error">{errors.timeStart}</span>}
                </div>
                <div className="time-field">
                  <label className="time-label">Até</label>
                  <input
                    type="time"
                    className={`time-input ${errors.timeEnd ? "input-error" : ""}`}
                    value={timeEnd}
                    onChange={(e) => setTimeEnd(e.target.value)}
                  />
                  {errors.timeEnd && <span className="field-error">{errors.timeEnd}</span>}
                </div>
              </div>
            </div>

            {errors.submit && (
              <div className="submit-error">{errors.submit}</div>
            )}

            <button type="submit" className="profile-submit-btn" disabled={loading}>
              {loading ? (
                <><span className="btn-spinner" /> Salvando...</>
              ) : (
                "Salvar perfil"
              )}
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}