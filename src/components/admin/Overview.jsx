// src/components/admin/Overview.jsx
import StatCard from "./StatCard.jsx";
import { STAT_META } from "./adminData.jsx";

export default function Overview({ data, stats }) {
  const recentGroups = (data.groups ?? []).slice(0, 5);
  const recentUsers  = (data.users  ?? []).slice(0, 5);

  return (
    <div className="overview">
      <div className="overview__stats">
        {STAT_META.map((meta, i) => (
          <StatCard key={meta.key} meta={meta} value={stats[meta.key] ?? 0} index={i} />
        ))}
      </div>

      <div className="overview__grid">
        {/* Salas recentes */}
        <div className="ov-panel">
          <div className="ov-panel__title">Salas recentes</div>
          <div className="ov-list">
            {recentGroups.length === 0
              ? <div className="ov-empty">Nenhuma sala ainda.</div>
              : recentGroups.map((g, i) => (
                <div key={g.id ?? i} className="ov-row">
                  <div className="ov-row__icon" style={{ background: "rgba(124,58,237,.2)" }}>🏠</div>
                  <div className="ov-row__info">
                    <span className="ov-row__name">{g.name}</span>
                    <span className="ov-row__sub">{g.game_name} · {g.members_count}/{g.max_slots}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Usuários recentes */}
        <div className="ov-panel">
          <div className="ov-panel__title">Usuários recentes</div>
          <div className="ov-list">
            {recentUsers.length === 0
              ? <div className="ov-empty">Nenhum usuário ainda.</div>
              : recentUsers.map((u, i) => (
                <div key={u.id ?? i} className="ov-row">
                  <div className="ov-row__icon" style={{ background: "rgba(124,58,237,.2)", color: "#c084fc", fontSize: 12, fontWeight: 700 }}>
                    {String(u.nickname?.[0] ?? "#").toUpperCase()}
                  </div>
                  <div className="ov-row__info">
                    <span className="ov-row__name">{u.email}</span>
                    <span className="ov-row__sub">{u.nickname} · {u.created_at}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Jogos por salas */}
        <div className="ov-panel">
          <div className="ov-panel__title">Jogos por salas ativas</div>
          <div className="ov-bars">
            {(data.games ?? []).slice(0, 6).map((g) => {
              const max = Math.max(...(data.games ?? [{ rooms_count: 1 }]).map((x) => x.rooms_count), 1);
              return (
                <div key={g.id} className="ov-bar-row">
                  <span className="ov-bar-label">{g.name}</span>
                  <div className="ov-bar-track">
                    <div className="ov-bar-fill" style={{ width: `${(g.rooms_count / max) * 100}%` }} />
                  </div>
                  <span className="ov-bar-val">{g.rooms_count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Distribuição de papéis */}
        <div className="ov-panel">
          <div className="ov-panel__title">Distribuição de papéis</div>
          <div className="ov-donut-wrap">
            <div className="ov-donut">
              <div className="ov-donut__inner">
                <span className="ov-donut__num">{(data.group_members ?? []).length}</span>
                <span className="ov-donut__lbl">total</span>
              </div>
            </div>
            <div className="ov-donut-legend">
              {[
                { label: "Donos",   count: (data.group_members ?? []).filter((m) => m.role === "owner").length,  color: "#7c3aed" },
                { label: "Membros", count: (data.group_members ?? []).filter((m) => m.role === "member").length, color: "#0ea5e9" },
              ].map((item) => (
                <div key={item.label} className="ov-legend-row">
                  <span className="ov-legend-dot" style={{ background: item.color }} />
                  <span className="ov-legend-label">{item.label}</span>
                  <span className="ov-legend-val">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
