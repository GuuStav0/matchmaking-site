import "../assets/css/playerCard.css";

// ── Helpers ───────────────────────────────────────────────────────────────────
function getIniciais(name) {
  if (!name) return "?";
  const partes = name.trim().split(" ");
  if (partes.length > 1) return (partes[0][0] + partes[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

function parseSchedule(scheduleStr) {
  if (!scheduleStr) return { days: [], start: "", end: "" };
  const parts = scheduleStr.trim().split(" ");
  const days = parts[0] ? parts[0].split(",").map((d) => d.trim()).filter(Boolean) : [];
  const timePart = parts[1] || "";
  const [start = "", end = ""] = timePart.split("-");
  return { days, start, end };
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function PlayerCard({ player, onClick, avatarBorderClass }) {
  const {
    nickname,
    avatar_url,
    bio,
    game_name,
    game_rank,
    game_style,
    schedule_availability,
  } = player;

  const { days, start, end } = parseSchedule(schedule_availability);
  const hasSchedule = days.length > 0 && start && end;

  // Banner gradient by style
  const bannerClass = game_style === "competitive"
    ? "pc2-banner--competitive"
    : game_style === "casual"
      ? "pc2-banner--casual"
      : "pc2-banner--default";

  // Style tag label + class
  const styleLabel = game_style === "competitive" ? "Competitivo" : game_style === "casual" ? "Casual" : null;
  const styleTagClass = game_style === "competitive"
    ? "pc2-tag--competitive"
    : game_style === "casual"
      ? "pc2-tag--casual"
      : "";

  return (
    <div className="pc2-card" onClick={onClick}>
      {/* Top accent line */}
      <div className={`pc2-accent-line ${styleTagClass}`} />

      {/* Banner */}
      <div className={`pc2-banner ${bannerClass}`} />

      <div className="pc2-body">
        {/* Avatar */}
        <div className="pc2-avatar-wrap">
          <div className={`pc2-avatar ${styleTagClass}`}>
            {avatar_url ? (
              <img
                src={avatar_url}
                alt={nickname}
                className={`pc2-avatar-img ${avatarBorderClass || ""}`}
                onError={(e) => { e.target.style.display = "none"; }}
              />
            ) : (
              <span className="pc2-avatar-initials">{getIniciais(nickname)}</span>
            )}
          </div>
          <span className="pc2-online-dot" />
        </div>

        {/* Nickname */}
        <p className="pc2-nickname">{nickname}</p>

        {/* Game name */}
        {game_name && (
          <p className="pc2-game-name">{game_name}</p>
        )}

        {/* Bio */}
        {bio && (
          <p className="pc2-bio">
            {bio.length > 90 ? bio.substring(0, 90) + "…" : bio}
          </p>
        )}

        {/* Divider */}
        <div className="pc2-divider" />

        {/* Tags row */}
        <div className="pc2-tags">
          {game_rank && (
            <span className="pc2-tag pc2-tag--rank">
              {game_rank}
            </span>
          )}
          {styleLabel && (
            <span className={`pc2-tag ${styleTagClass}`}>
              {styleLabel}
            </span>
          )}
        </div>

        {/* Schedule meta */}
        <div className="pc2-meta">
          {hasSchedule && (
            <div className="pc2-meta-row">
              <span className="pc2-meta-icon">🕐</span>
              <span>{start} – {end}</span>
            </div>
          )}
          {days.length > 0 && (
            <div className="pc2-meta-row">
              <span className="pc2-meta-icon">📅</span>
              <div className="pc2-days">
                {days.map((d) => (
                  <span key={d} className="pc2-day-pill">{d}</span>
                ))}
              </div>
            </div>
          )}
          {!hasSchedule && !days.length && (
            <div className="pc2-meta-row">
              <span className="pc2-meta-icon">📅</span>
              <span className="pc2-meta-empty">Horário não informado</span>
            </div>
          )}
        </div>

        <button className="pc2-btn" tabIndex={-1}>Ver perfil</button>
      </div>
    </div>
  );
}