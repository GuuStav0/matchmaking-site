import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../assets/actions/header.jsx";
import Footer from "../assets/actions/footer.jsx";

const API = "http://localhost:3000/api";

export default function PlayerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/players/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.status === "erro") throw new Error(data.mensagem);
        setPlayer(data.dados);
      })
      .catch((err) => setErro(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const getIniciais = (nick) => {
    if (!nick) return "?";
    const p = nick.trim().split(" ");
    return p.length > 1 ? (p[0][0] + p[1][0]).toUpperCase() : nick.substring(0, 2).toUpperCase();
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#080810", color: "#f1f5f9", fontFamily: '"DM Sans", system-ui, sans-serif' }}>
      <Header />

      <main style={{ flex: 1, maxWidth: 700, margin: "0 auto", padding: "3rem 1.5rem", width: "100%" }}>

        <button
          onClick={() => navigate("/players")}
          style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontFamily: '"DM Sans", sans-serif', fontSize: "0.875rem", marginBottom: "1.5rem", padding: 0, display: "flex", alignItems: "center", gap: "0.4rem" }}
        >
          ← Voltar para jogadores
        </button>

        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#64748b", padding: "4rem 0" }}>
            <span style={{ width: 20, height: 20, border: "2px solid rgba(124,58,237,0.2)", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
            Carregando perfil...
          </div>
        )}

        {erro && (
          <div style={{ padding: "1.25rem", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, color: "#fca5a5" }}>
            ⚠️ {erro}
          </div>
        )}

        {player && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

            {/* Card principal */}
            <div style={{ background: "rgba(15,15,24,0.9)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "2rem", display: "flex", gap: "1.5rem", alignItems: "flex-start", flexWrap: "wrap" }}>
              {/* Avatar */}
              <div style={{ flexShrink: 0 }}>
                {player.avatar_url ? (
                  <img src={player.avatar_url} alt={player.nickname} style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg, #7c3aed, #4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: '"Syne", sans-serif', fontWeight: 800, fontSize: "1.5rem", color: "#fff" }}>
                    {getIniciais(player.nickname)}
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 200 }}>
                <h1 style={{ fontFamily: '"Syne", sans-serif', fontSize: "1.6rem", fontWeight: 800, margin: "0 0 0.25rem", color: "#f1f5f9" }}>
                  {player.nickname}
                </h1>
                {player.schedule_availability && (
                  <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0 0 0.75rem" }}>
                    🕐 Disponível: {player.schedule_availability}
                  </p>
                )}
                {player.bio && (
                  <p style={{ fontSize: "0.9rem", color: "#94a3b8", margin: 0, lineHeight: 1.6 }}>
                    {player.bio}
                  </p>
                )}
              </div>
            </div>

            {/* Jogos */}
            {player.games && player.games.length > 0 && (
              <div style={{ background: "rgba(15,15,24,0.9)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "1.5rem" }}>
                <h2 style={{ fontFamily: '"Syne", sans-serif', fontSize: "1rem", fontWeight: 700, margin: "0 0 1rem", color: "#f1f5f9" }}>
                  Jogos
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {player.games.map((g, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10 }}>
                      <span style={{ fontWeight: 600, color: "#f1f5f9", fontSize: "0.9rem" }}>{g.game_name}</span>
                      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
                        {g.game_rank && (
                          <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 999, background: "rgba(168,85,247,0.15)", color: "#c084fc", fontWeight: 600 }}>
                            {g.game_rank}
                          </span>
                        )}
                        {g.game_style && (
                          <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 999, background: g.game_style === "competitive" ? "rgba(124,58,237,0.15)" : "rgba(14,165,233,0.15)", color: g.game_style === "competitive" ? "#c084fc" : "#38bdf8", fontWeight: 600 }}>
                            {g.game_style === "competitive" ? "Competitivo" : "Casual"}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}