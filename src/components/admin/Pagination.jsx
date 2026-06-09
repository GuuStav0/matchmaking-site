// src/components/admin/Pagination.jsx
import { IChevL, IChevR } from "./AdminIcons.jsx";

export default function Pagination({ page, total, perPage, onChange }) {
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }

  return (
    <div className="pagination">
      <span className="pagination__info">
        {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} de {total}
      </span>
      <div className="pagination__btns">
        <button className="pg-btn" onClick={() => onChange(page - 1)} disabled={page === 1}><IChevL /></button>
        {pages.map((p, i) =>
          p === "…"
            ? <span key={`d${i}`} className="pg-dots">…</span>
            : <button key={p} className={`pg-btn ${page === p ? "pg-btn--on" : ""}`} onClick={() => onChange(p)}>{p}</button>
        )}
        <button className="pg-btn" onClick={() => onChange(page + 1)} disabled={page === totalPages}><IChevR /></button>
      </div>
    </div>
  );
}
