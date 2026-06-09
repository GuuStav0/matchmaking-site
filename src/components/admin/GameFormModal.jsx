// src/components/admin/GameFormModal.jsx
import { useState } from "react";
import { useApi } from "../../hooks/useApi.js";
import { GENRES } from "./adminData.jsx";
import { IClose } from "./AdminIcons.jsx";

export default function GameFormModal({ game, onSave, onClose }) {
  const { request } = useApi();
  const [form,    setForm]    = useState({ name: game?.name || "", genre: game?.genre || "", cover_url: game?.cover_url || "" });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.genre.trim()) {
      setError("Nome e gênero são obrigatórios.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const body = JSON.stringify({ name: form.name, genre: form.genre, cover_url: form.cover_url || null });
      const result = game
        ? await request(`/admin/games/${game.id}`, { method: "PUT",  body })
        : await request("/admin/games",             { method: "POST", body });

      if (!result.ok) {
        setError(result.mensagem || "Erro ao salvar jogo.");
        setLoading(false);
        return;
      }
      onSave(game ? { ...game, ...form } : { id: result.id, ...form, rooms_count: 0 });
    } catch {
      setError("Erro de conexão com a API.");
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--form" onClick={(e) => e.stopPropagation()}>
        <div className="modal__hdr">
          <span className="modal__title">{game ? "✏️ Editar Jogo" : "🎮 Novo Jogo"}</span>
          <button className="modal__x" onClick={onClose}><IClose /></button>
        </div>
        <form className="modal__body" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nome do jogo *</label>
            <input
              className="form-input"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Ex: Valorant"
              maxLength={100}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Gênero *</label>
            <select
              className="form-input"
              value={form.genre}
              onChange={(e) => setForm((p) => ({ ...p, genre: e.target.value }))}
            >
              <option value="">Selecionar gênero…</option>
              {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">URL da capa (opcional)</label>
            <input
              className="form-input"
              value={form.cover_url}
              onChange={(e) => setForm((p) => ({ ...p, cover_url: e.target.value }))}
              placeholder="https://..."
            />
          </div>
          {error && <div className="form-error">⚠️ {error}</div>}
          <div className="modal__footer" style={{ marginTop: 8 }}>
            <button type="button" className="btn-sec" onClick={onClose} disabled={loading}>Cancelar</button>
            <button type="submit" className="btn-add" disabled={loading}>
              {loading ? "Salvando…" : game ? "Salvar alterações" : "Cadastrar jogo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
