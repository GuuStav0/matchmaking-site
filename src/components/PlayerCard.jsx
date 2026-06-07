import "../assets/css/playerCard.css";

export default function PlayerCard({ player, onClick }) {
  const {
    nickname,
    avatar_url,
    bio,
    game_name,
    game_rank,
    game_style,
    schedule_availability,
  } = player;

  function getIniciais(name) {
    if (!name) return "?";
    const partes = name.trim().split(" ");
    if (partes.length > 1) return (partes[0][0] + partes[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }

  return (
    <div className="pc-card" onClick={onClick}>
      <div className={`pc-stripe pc-stripe--${game_style}`} />

      <div className="pc-header">
        <div className="pc-avatar-wrap">
          {avatar_url ? (
            <img
              src={avatar_url}
              alt={nickname}
              className="pc-avatar-img"
              onError={(e) => { e.target.style.display = "none"; }}
            />
          ) : (
            <div className={`pc-avatar-placeholder pc-avatar-placeholder--${game_style}`}>
              {getIniciais(nickname)}
            </div>
          )}
          <span className="pc-online-dot" />
        </div>

        <div className="pc-info">
          <span className="pc-nickname">{nickname}</span>
          {game_name && (
            <span className="pc-game">{game_name}</span>
          )}
        </div>
      </div>

      {bio && (
        <p className="pc-bio">{bio.length > 80 ? bio.substring(0, 80) + "..." : bio}</p>
      )}

      <div className="pc-tags">
        {game_rank && (
          <span className="pc-tag pc-tag--rank">{game_rank}</span>
        )}
        {game_style && (
          <span className={`pc-tag pc-tag--style pc-tag--${game_style}`}>
            {game_style === "competitive" ? "Competitivo" : "Casual"}
          </span>
        )}
        {schedule_availability && (
          <span className="pc-tag pc-tag--schedule">🕐 {schedule_availability}</span>
        )}
      </div>

      <button className="pc-btn">Ver perfil</button>
    </div>
  );
}
