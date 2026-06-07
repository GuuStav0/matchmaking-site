import { useNavigate } from "react-router-dom";
import Header from "../assets/actions/header.jsx";
import Footer from "../assets/actions/footer.jsx";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      background: "#080810",
      color: "#f1f5f9",
      fontFamily: '"DM Sans", system-ui, sans-serif',
    }}>
      <Header />
      <main style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        textAlign: "center",
        gap: "1rem",
      }}>
        <p style={{ fontSize: "5rem", margin: 0, lineHeight: 1 }}>⚡</p>
        <h1 style={{
          fontFamily: '"Syne", sans-serif',
          fontSize: "clamp(3rem, 10vw, 6rem)",
          fontWeight: 800,
          margin: 0,
          background: "linear-gradient(135deg, #a855f7, #6366f1)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          letterSpacing: "-2px",
        }}>
          404
        </h1>
        <p style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0 }}>
          Página não encontrada
        </p>
        <p style={{ color: "#64748b", maxWidth: 380, margin: 0, fontSize: "0.9rem" }}>
          Parece que essa rota não existe. Talvez o link esteja errado ou a página foi removida.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: "10px 22px",
              borderRadius: 9,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.05)",
              color: "#94a3b8",
              fontFamily: '"DM Sans", sans-serif',
              fontSize: "0.9rem",
              cursor: "pointer",
            }}
          >
            ← Voltar
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            style={{
              padding: "10px 22px",
              borderRadius: 9,
              border: "none",
              background: "linear-gradient(135deg, #7c3aed, #6366f1)",
              color: "#fff",
              fontFamily: '"DM Sans", sans-serif',
              fontSize: "0.9rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Ir para o Dashboard
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}