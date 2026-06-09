// src/hooks/useApi.js
// Hook centralizado para chamadas autenticadas à API Matchup.
//
// Uso:
//   const { request } = useApi();
//   const data = await request("/games");
//   const result = await request("/admin/users/1", { method: "DELETE" });

import { useCallback } from "react";
import { API_BASE_URL } from "../constants/index.js";

function getAuthToken() {
  return (
    JSON.parse(localStorage.getItem("@Matchup:user") || "{}").token ||
    localStorage.getItem("@Matchup:token") ||
    ""
  );
}

/**
 * Retorna { request } para chamadas à API com Content-Type e Authorization automáticos.
 * A resposta é o JSON parseado mesclado com { ok, status } do Response.
 */
export function useApi() {
  const request = useCallback(async (path, options = {}) => {
    const token = getAuthToken();
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers ?? {}),
      },
    });
    const json = await res.json();
    return { ok: res.ok, status: res.status, ...json };
  }, []);

  return { request };
}
