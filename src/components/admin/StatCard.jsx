// src/components/admin/StatCard.jsx
import { useState, useEffect } from "react";

export default function StatCard({ meta, value, index }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let c = 0;
    const step = Math.max(1, Math.ceil(value / 30));
    const t = setInterval(() => {
      c = Math.min(c + step, value);
      setCount(c);
      if (c >= value) clearInterval(t);
    }, 40);
    return () => clearInterval(t);
  }, [value]);

  return (
    <div className="stat-card" style={{ "--accent": meta.color, animationDelay: `${index * 80}ms` }}>
      <div className="stat-card__glow" />
      <div className="stat-card__top">
        <span className="stat-card__icon">{meta.icon}</span>
      </div>
      <div className="stat-card__value">{count.toLocaleString("pt-BR")}</div>
      <div className="stat-card__label">{meta.label}</div>
      <div className="stat-card__bar">
        <div className="stat-card__bar-fill" style={{ background: meta.color }} />
      </div>
    </div>
  );
}
