// src/components/admin/SectionView.jsx
import { useState, useCallback } from "react";
import { useApi } from "../../hooks/useApi.js";
import { COLS, PER_PAGE } from "./adminData.jsx";
import { ISearch, IPlus } from "./AdminIcons.jsx";
import Table from "./Table.jsx";
import Pagination from "./Pagination.jsx";
import GameFormModal from "./GameFormModal.jsx";

export default function SectionView({ id, data, isMock, onRefresh }) {
  const { request } = useApi();
  const [page,     setPage]     = useState(1);
  const [search,   setSearch]   = useState("");
  const [gameForm, setGameForm] = useState(null); // null | "new" | { ...gameObj }

  const handleDelete = useCallback(async (row) => {
    try {
      let path;
      if (id === "users")              path = `/admin/users/${row.id}`;
      else if (id === "profiles")      path = `/admin/profiles/${row.id}`;
      else if (id === "games")         path = `/admin/games/${row.id}`;
      else if (id === "groups")        path = `/admin/groups/${row.id}`;
      else if (id === "group_members") path = `/admin/group-members/${row.group_id}/${row.profile_id}`;

      if (!path) return;
      await request(path, { method: "DELETE" });
      onRefresh(id);
    } catch {
      // mantém mock data em caso de falha de conexão
    }
  }, [id, onRefresh, request]);

  const handleSaveGame = useCallback(() => {
    setGameForm(null);
    onRefresh("games");
  }, [onRefresh]);

  const rows     = data[id] ?? [];
  const filtered = rows.filter((row) =>
    Object.values(row).some((v) => String(v ?? "").toLowerCase().includes(search.toLowerCase()))
  );
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="section-view">
      {gameForm && (
        <GameFormModal
          game={gameForm === "new" ? null : gameForm}
          onSave={handleSaveGame}
          onClose={() => setGameForm(null)}
        />
      )}

      <div className="section-view__controls">
        <div className="sv-search">
          <span className="sv-search__icon"><ISearch /></span>
          <input
            className="sv-search__input"
            placeholder="Filtrar registros..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          {search && <button className="sv-search__clear" onClick={() => setSearch("")}>✕</button>}
        </div>
        <div className="sv-meta">
          <span className="sv-meta__total">{filtered.length} registro{filtered.length !== 1 ? "s" : ""}</span>
          {id === "games" && (
            <button className="btn-add btn-add--sm" onClick={() => setGameForm("new")}>
              <IPlus /> Novo jogo
            </button>
          )}
        </div>
      </div>

      <Table
        columns={COLS[id] || []}
        data={paginated}
        isMock={isMock}
        onDelete={handleDelete}
        onEdit={id === "games" ? (row) => setGameForm(row) : null}
      />

      <Pagination page={page} total={filtered.length} perPage={PER_PAGE} onChange={setPage} />
    </div>
  );
}
