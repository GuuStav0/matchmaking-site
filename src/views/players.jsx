import PlayerCard from "../components/PlayerCard.jsx";
import Header from "../assets/actions/header.jsx";
import Footer from "../assets/actions/footer.jsx";
import "../assets/css/players.css";

// Dados mockados para visualizar o card sem precisar da API
const MOCK_PLAYERS = [
  {
    id: 1,
    nickname: "GhostReaper",
    avatar_url: "",
    bio: "Jogador competitivo de FPS, foco total em ranked. Sempre com mic e callouts.",
    game_name: "Valorant",
    game_rank: "Diamante",
    game_style: "competitive",
    schedule_availability: "Seg,Qui,Sex 20:00-23:00",
  },
  {
    id: 2,
    nickname: "LunaStrike",
    avatar_url: "",
    bio: "Platina subindo. Prefiro jogar relaxado mas com comunicação.",
    game_name: "League of Legends",
    game_rank: "Platina",
    game_style: "casual",
    schedule_availability: "Sáb,Dom 14:00-18:00",
  },
  {
    id: 3,
    nickname: "IronVeil",
    avatar_url: "",
    bio: "Global Elite buscando time sério para torneios amadores.",
    game_name: "CS2",
    game_rank: "Global Elite",
    game_style: "competitive",
    schedule_availability: "Ter,Qua,Qui 21:00-00:00",
  },
  {
    id: 4,
    nickname: "SkyWarden",
    avatar_url: "",
    bio: "Jogador imortal buscando duo para ranked.",
    game_name: "Valorant",
    game_rank: "Imortal",
    game_style: "competitive",
    schedule_availability: "Seg,Sex 19:00-22:00",
  },
];

export default function Players() {
  return (
    <div className="players-page">
      <Header />
      <main className="players-main">
        <div className="players-hero">
          <h1 className="players-title">
            Encontre seu <span className="players-title-accent">parceiro</span>
          </h1>
          <p className="players-subtitle">
            {MOCK_PLAYERS.length} jogadores disponíveis agora
          </p>
        </div>

        <div className="players-grid">
          {MOCK_PLAYERS.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              onClick={() => console.log("Ver perfil de", player.nickname)}
            />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}