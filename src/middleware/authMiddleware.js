// src/middleware/authMiddleware.js
// Bridge: re-exporta o middleware de autenticação de src/models/authMiddleware.js.
// Os routes em src/routes/ importam daqui via "../middleware/authMiddleware.js".
export { criarSessao, removerSessao, requireAuth } from "../models/authMiddleware.js";
