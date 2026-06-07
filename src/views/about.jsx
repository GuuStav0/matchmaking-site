import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../assets/actions/header";
import Footer from "../assets/actions/footer";
import '../assets/css/about.css';

const PLAYERS = [
  { id: 1, name: "GhostReaper", game: "Valorant", rank: "Diamante", style: "Competitivo", status: "online" },
  { id: 2, name: "LunaStrike", game: "League of Legends", rank: "Platina", style: "Casual", status: "online" },
  { id: 3, name: "IronVeil", game: "CS2", rank: "Global Elite", style: "Competitivo", status: "away" },
  { id: 4, name: "SkyWarden", game: "Valorant", rank: "Imortal", style: "Competitivo", status: "online" },
  { id: 5, name: "NovaPulse", game: "Apex Legends", rank: "Predador", style: "Casual", status: "online" },
];

const TAGS = ["Competitivo", "Casual", "Sem tilt", "Com voz", "Noturno", "Focado em rank"];
const GAMES = ["Valorant", "League of Legends", "CS2", "Apex Legends", "R6 Siege"];

function StatusDot({ status }) {
  const colors = { online: "#22c55e", away: "#f59e0b", offline: "#6b7280" };
  return (
    <span
      className="status-dot"
      style={{ background: colors[status] || colors.offline }}
    />
  );
}

function PlayerCard({ player, delay }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  const isCompetitive = player.style === "Competitivo";

  return (
    <div
      className="player-card"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)"
      }}
    >
      <div className={`player-card-stripe ${isCompetitive ? "competitive" : "casual"}`} />
      <div className="player-card-header">
        <div className={`player-card-avatar ${isCompetitive ? "competitive" : "casual"}`}>
          {player.name[0]}
        </div>
        <div className="player-card-info">
          <div className="player-card-name-wrapper">
            <StatusDot status={player.status} />
            <span className="player-card-name">{player.name}</span>
          </div>
          <div className="player-card-game">{player.game}</div>
        </div>
      </div>
      <div className="player-card-tags">
        <span className="badge-rank">{player.rank}</span>
        <span className="badge-style">{player.style}</span>
      </div>
    </div>
  );
}

function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const step = Math.ceil(value / 40);
    let current = 0;
    const t = setInterval(() => {
      current = Math.min(current + step, value);
      setDisplay(current);
      if (current >= value) clearInterval(t);
    }, 30);
    return () => clearInterval(t);
  }, [value]);
  return <>{display.toLocaleString("pt-BR")}</>;
}

export default function AboutUs() {
  const [selectedGame, setSelectedGame] = useState("Todos");
  const [selectedStyle, setSelectedStyle] = useState("Todos");
  const [glowPos, setGlowPos] = useState({ x: 50, y: 30 });

  const navigate = useNavigate();

  const navAuth = () => {
    navigate("/auth");
  }

  useEffect(() => {
    let angle = 0;
    const interval = setInterval(() => {
      angle += 0.3;
      setGlowPos({
        x: 50 + 30 * Math.cos((angle * Math.PI) / 180),
        y: 30 + 20 * Math.sin((angle * Math.PI) / 180),
      });
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const filtered = PLAYERS.filter((p) => {
    const gameOk = selectedGame === "Todos" || p.game === selectedGame;
    const styleOk = selectedStyle === "Todos" || p.style === selectedStyle;
    return gameOk && styleOk;
  });

  return (
    <div className="about-page-container">
      {/* Background animado permanece aqui por ser exclusivo desta seção */}
      <div className="about-bg-layer">
        <div className="about-glow-primary" style={{ left: `${glowPos.x}%`, top: `${glowPos.y}%` }} />
        <div className="about-glow-secondary" />
        <svg width="100%" height="100%" className="about-grid-svg">
          <defs>
            <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <Header />

      {/* HERO */}
      <section className="hero-section">
        <div>
          <div className="hero-tag">
            <span className="hero-tag-bullet" />
            Plataforma de Matchmaking
          </div>
          <h1 className="hero-title">
            Encontre seu <span className="hero-title-gradient">time ideal.</span><br />Jogue no seu nível.
          </h1>
          <p className="hero-description">
            Chega de Solo Queue frustrante. O Matchup conecta jogadores por perfil de jogo,
            objetivos e disponibilidade de horário — formando equipes que realmente funcionam.
          </p>
          <div className="hero-actions">
            <button className="cta-primary">Criar perfil gratuito</button>
            <button className="cta-secondary">Ver jogadores →</button>
          </div>
          <div className="hero-stats-container">
            {[
              { label: "Jogadores ativos", value: 12400 },
              { label: "Grupos formados", value: 3800 },
              { label: "Jogos suportados", value: 18 },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="hero-stat-number">
                  <AnimatedNumber value={stat.value} />
                  <span className="hero-stat-plus">+</span>
                </div>
                <div className="hero-stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="hero-preview-column">
          <div className="hero-preview-title">// jogadores online agora</div>
          {PLAYERS.map((p, i) => (
            <PlayerCard key={p.id} player={p} delay={300 + i * 120} />
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="features-section">
        <div className="section-header-centered">
          <h2>Por que o Matchup é diferente?</h2>
          <p>Sistemas nativos dos jogos medem apenas MMR. Nós medimos compatibilidade real.</p>
        </div>
        <div className="features-grid">
          {[
            { icon: "🎯", title: "Filtros inteligentes", desc: "Filtre por jogo, rank, horário e estilo. Encontre parceiros que combinam com você de verdade." },
            { icon: "🛡️", title: "Ambiente sem toxicidade", desc: "Grupos fechados eliminam comportamento antidesportivo e criam canais de comunicação eficientes." },
            { icon: "👥", title: "Grupos pre-made", desc: "Saia da Solo Queue e forme equipes estáveis com sinergia estratégica desde o começo." },
            { icon: "📊", title: "Perfil multidimensional", desc: "Cadastre múltiplos títulos, estilos de jogo e objetivos — não somos só mais um ranking de MMR." },
          ].map((f) => (
            <div key={f.title} className="stat-card">
              <div className="stat-card-icon">{f.icon}</div>
              <div className="stat-card-title">{f.title}</div>
              <div className="stat-card-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SEARCH DEMO */}
      <section className="demo-section">
        <div className="demo-box">
          <div className="demo-header">
            <h2>Explore jogadores agora</h2>
            <p>Prévia do mecanismo de filtragem — sem precisar criar conta.</p>
          </div>
          <div className="demo-filters-container">
            <div>
              <div className="filter-group-title">Jogo</div>
              <div className="filter-buttons-list">
                {["Todos", ...GAMES].map((g) => (
                  <button key={g} className={`pill-btn ${selectedGame === g ? "active" : ""}`} onClick={() => setSelectedGame(g)}>{g}</button>
                ))}
              </div>
            </div>
            <div>
              <div className="filter-group-title">Estilo</div>
              <div className="filter-buttons-list">
                {["Todos", "Competitivo", "Casual"].map((s) => (
                  <button key={s} className={`pill-btn ${selectedStyle === s ? "active" : ""}`} onClick={() => setSelectedStyle(s)}>{s}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="demo-results-grid">
            {filtered.length > 0 ? (
              filtered.map((p, i) => <PlayerCard key={p.id} player={p} delay={i * 80} />)
            ) : (
              <div className="demo-empty-state">Nenhum jogador encontrado com esses filtros.</div>
            )}
          </div>
        </div>
      </section>

      {/* TAGS */}
      <section className="tags-section">
        <div className="tags-list-wrapper">
          {TAGS.map((tag) => (
            <span key={tag} className="hash-tag-badge">#{tag}</span>
          ))}
        </div>
      </section>

      <section className="final-cta-section">
        <div className="final-cta-box">
          <div className="final-cta-glow" />
          <div className="final-cta-content">
            <h2>Pronto para sair da Solo Queue?</h2>
            <p>Crie seu perfil, defina seus critérios e encontre parceiros que elevam seu jogo.</p>
            <button onClick={navAuth} className="cta-primary" style={{ padding: "16px 40px", fontSize: 16 }}>
              Criar conta gratuita ⚡
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}