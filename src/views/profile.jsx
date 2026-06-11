import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../models/authContext.jsx";
import Header from "../assets/actions/header.jsx";
import Footer from "../assets/actions/footer.jsx";
import "../assets/css/profile.css";

const DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function parseSchedule(scheduleStr) {
  if (!scheduleStr) return { days: [], start: "", end: "" };
  const parts = scheduleStr.trim().split(" ");
  const days = parts[0] ? parts[0].split(",").map((d) => d.trim()) : [];
  const timePart = parts[1] || "";
  const [start = "", end = ""] = timePart.split("-");
  return { days, start, end };
}

// ── Live preview card ─────────────────────────────────────────────────────────
function PlayerPreviewCard({ nickname, bio, avatarUrl, selectedDays, timeStart, timeEnd }) {
  const initials = nickname
    ? nickname.trim().substring(0, 2).toUpperCase()
    : "?";

  const hasSchedule = selectedDays.length > 0 && timeStart && timeEnd;

  return (
    <div className="profile-preview-card">
      <div className="ppc-banner" />
      <div className="ppc-body">
        <div className="ppc-avatar-wrap">
          <div className="ppc-avatar">
            {avatarUrl
              ? <img src={avatarUrl} alt="avatar" onError={(e) => { e.target.style.display = "none"; }} />
              : initials}
          </div>
        </div>

        <p className="ppc-nickname">
          {nickname.trim() || <span className="ppc-placeholder-text">seu nickname</span>}
        </p>

        <p className="ppc-bio">
          {bio.trim()
            ? bio.trim()
            : <span className="ppc-placeholder-text">sua bio aparece aqui…</span>}
        </p>

        <div className="ppc-divider" />

        <div className="ppc-meta">
          {hasSchedule && (
            <div className="ppc-meta-row">
              <span className="ppc-meta-icon">🕐</span>
              <span>{timeStart} – {timeEnd}</span>
            </div>
          )}

          {selectedDays.length > 0 && (
            <div className="ppc-meta-row">
              <span className="ppc-meta-icon">📅</span>
              <div className="ppc-days">
                {selectedDays.map((d) => (
                  <span key={d} className="ppc-day-pill">{d}</span>
                ))}
              </div>
            </div>
          )}

          {!hasSchedule && (
            <div className="ppc-meta-row">
              <span className="ppc-meta-icon">📅</span>
              <span className="ppc-placeholder-text">disponibilidade…</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ProfileSetup() {
  const navigate = useNavigate();
  const { user, atualizarDadosUsuario } = useAuth();

  const [nickname, setNickname]       = useState("");
  const [bio, setBio]                 = useState("");
  const [avatarUrl, setAvatarUrl]     = useState("");
  const [selectedDays, setSelectedDays] = useState([]);
  const [timeStart, setTimeStart]     = useState("");
  const [timeEnd, setTimeEnd]         = useState("");
  const [errors, setErrors]           = useState({});
  const [loading, setLoading]         = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (!user?.id) { setLoadingProfile(false); return; }

    async function fetchProfile() {
      try {
        const response = await fetch(`http://localhost:3000/api/players/${user.id}`);
        const result = await response.json();

        if (response.ok && result.status === "sucesso") {
          const d = result.dados;
          setNickname(d.nickname || user.nickname || "");
          setBio(d.bio || "");
          setAvatarUrl(d.avatar_url || "");
          const { days, start, end } = parseSchedule(d.schedule_availability);
          setSelectedDays(days);
          setTimeStart(start);
          setTimeEnd(end);
        } else {
          setNickname(user.nickname || "");
          setAvatarUrl(user.avatarUrl || "");
        }
      } catch {
        setNickname(user.nickname || "");
        setAvatarUrl(user.avatarUrl || "");
      } finally {
        setLoadingProfile(false);
      }
    }

    fetchProfile();
  }, [user?.id]);

  function toggleDay(day) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function validate() {
    const e = {};
    if (!nickname || nickname.trim().length < 3)
      e.nickname = "Nickname deve ter ao menos 3 caracteres";
    if (nickname.trim().length > 30)
      e.nickname = "Nickname pode ter no máximo 30 caracteres";
    if (!bio || bio.trim().length < 10)
      e.bio = "Bio deve ter ao menos 10 caracteres";
    if (bio.length > 300)
      e.bio = "Bio pode ter no máximo 300 caracteres";
    if (selectedDays.length === 0)
      e.days = "Selecione ao menos um dia disponível";
    if (!timeStart) e.timeStart = "Informe o horário de início";
    if (!timeEnd)   e.timeEnd   = "Informe o horário de fim";
    if (timeStart && timeEnd && timeStart >= timeEnd)
      e.timeEnd = "Horário de fim deve ser maior que o de início";
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) { setErrors(validationErrors); return; }
    setErrors({});
    setLoading(true);

    const scheduleAvailability = `${selectedDays.join(",")} ${timeStart}-${timeEnd}`;

    try {
      const response = await fetch(`http://localhost:3000/api/profiles/${user?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: nickname.trim(),
          bio: bio.trim(),
          avatar_url: avatarUrl.trim() || null,
          schedule_availability: scheduleAvailability,
        }),
      });

      const result = await response.json();
      if (!response.ok || result.status === "erro")
        throw new Error(result.mensagem || "Erro ao salvar perfil.");

      atualizarDadosUsuario({
        nickname: result.dados?.nickname || nickname.trim(),
        avatarUrl: avatarUrl.trim() || null,
      });
      navigate("/players");
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setLoading(false);
    }
  }

  if (loadingProfile) {
    return (
      <div className="profile-page">
        <div className="profile-bg">
          <div className="profile-bg__blob profile-bg__blob--a" />
          <div className="profile-bg__blob profile-bg__blob--b" />
          <div className="profile-bg__grid" />
        </div>
        <Header />
        <main className="profile-main">
          <div className="profile-loading">
            <span className="btn-spinner" /> Carregando perfil…
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Atmospheric background */}
      <div className="profile-bg">
        <div className="profile-bg__blob profile-bg__blob--a" />
        <div className="profile-bg__blob profile-bg__blob--b" />
        <div className="profile-bg__grid" />
      </div>

      <Header />

      <main className="profile-main">
        <div className="profile-shell">

          {/* ── Sidebar: live preview ── */}
          <aside className="profile-sidebar">
            <p className="profile-preview-label">Prévia do seu perfil</p>
            <PlayerPreviewCard
              nickname={nickname}
              bio={bio}
              avatarUrl={avatarUrl}
              selectedDays={selectedDays}
              timeStart={timeStart}
              timeEnd={timeEnd}
            />
            <div className="profile-sidebar-tip">
              <span className="profile-sidebar-tip__icon">💡</span>
              <span>É assim que outros jogadores vão te ver ao buscar partidas.</span>
            </div>
          </aside>

          {/* ── Form card ── */}
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

              {/* ── Identidade ── */}
              <div className="form-section">
                <span className="form-section-label">Identidade</span>

                {/* Avatar URL */}
                <div className="field-block">
                  <label className="field-label">
                    Foto de perfil <span className="field-optional">(opcional)</span>
                  </label>
                  <div className="avatar-preview-row">
                    <div className="avatar-preview">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt="Preview"
                          className="avatar-preview-img"
                          onError={(e) => { e.target.style.display = "none"; }}
                        />
                      ) : (
                        <span className="avatar-preview-placeholder">
                          {nickname?.substring(0, 2).toUpperCase() ||
                            user?.nickname?.substring(0, 2).toUpperCase() || "?"}
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

                {/* Nickname */}
                <div className="field-block">
                  <label className="field-label">Nickname</label>
                  <input
                    type="text"
                    className={`profile-input ${errors.nickname ? "input-error" : ""}`}
                    placeholder="Seu nome de jogador"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    maxLength={30}
                  />
                  <div className="field-footer">
                    {errors.nickname
                      ? <span className="field-error">{errors.nickname}</span>
                      : <span />}
                    <span className="field-counter">{nickname.length}/30</span>
                  </div>
                </div>

                {/* Bio */}
                <div className="field-block">
                  <label className="field-label">Bio</label>
                  <textarea
                    className={`profile-textarea ${errors.bio ? "input-error" : ""}`}
                    placeholder="Fale um pouco sobre você como jogador… ex: competitivo de FPS, disponível à noite"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                  />
                  <div className="field-footer">
                    {errors.bio
                      ? <span className="field-error">{errors.bio}</span>
                      : <span />}
                    <span className="field-counter">{bio.length}/300</span>
                  </div>
                </div>
              </div>

              {/* ── Disponibilidade ── */}
              <div className="form-section">
                <span className="form-section-label">Disponibilidade</span>

                {/* Dias */}
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
                        <span>{day}</span>
                      </button>
                    ))}
                  </div>
                  {errors.days && <span className="field-error">{errors.days}</span>}
                </div>

                {/* Horário */}
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
              </div>

              {errors.submit && (
                <div className="submit-error">{errors.submit}</div>
              )}

              <button type="submit" className="profile-submit-btn" disabled={loading}>
                {loading
                  ? <><span className="btn-spinner" /> Salvando…</>
                  : "Salvar perfil"}
              </button>
            </form>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}