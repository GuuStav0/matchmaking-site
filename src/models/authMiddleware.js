// src/middleware/authMiddleware.js
// Gerencia sessões em memória via token opaco.
// Para produção, substituir por JWT (jsonwebtoken).

/** @type {Map<string, string>}  token → userId */
const sessions = new Map();

/** Cria uma sessão para o usuário e retorna o token gerado. */
export function criarSessao(userId) {
  const token = `${userId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  sessions.set(token, userId);
  return token;
}

/** Invalida o token (logout). */
export function removerSessao(token) {
  sessions.delete(token);
}

/**
 * Middleware Express: valida o header Authorization: Bearer <token>.
 * Injeta req.userId e req.token quando autenticado.
 */
export function requireAuth(req, res, next) {
  const header = req.headers["authorization"] ?? "";
  if (!header.startsWith("Bearer ")) {
    return res.status(401).json({
      status: "erro",
      mensagem: "Não autorizado. Faça login primeiro.",
    });
  }

  const token  = header.slice(7);
  const userId = sessions.get(token);

  if (!userId) {
    return res.status(401).json({
      status: "erro",
      mensagem: "Sessão inválida ou expirada. Faça login novamente.",
    });
  }

  req.userId = userId;
  req.token  = token;
  next();
}
