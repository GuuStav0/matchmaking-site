// src/hooks/useApi.js
// Hook centralizado para chamadas à API Matchup.
//
// Uso:
//   const { request } = useApi();
//   const data = await request("/games");
//   const result = await request("/admin/users/1", { method: "DELETE" });

import { useCallback } from "react";
import { API_BASE_URL } from "../constants/index.js";

export function useApi() {
  const request = useCallback(async (path, options = {}) => {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers ?? {}),
      },
    });
    const json = await res.json();
    return { ok: res.ok, status: res.status, ...json };
  }, []);

  return { request };
}
