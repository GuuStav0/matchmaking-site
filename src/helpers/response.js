// src/helpers/response.js
// Funções padronizadas de resposta para as rotas Express.

/**
 * Resposta de sucesso.
 * @param {import('express').Response} res
 * @param {object} payload  campos extras mesclados no body (dados, mensagem, id, etc.)
 * @param {number} statusCode  padrão 200
 */
export function sendSuccess(res, payload = {}, statusCode = 200) {
  return res.status(statusCode).json({ status: "sucesso", ...payload });
}

/**
 * Resposta de erro.
 * @param {import('express').Response} res
 * @param {string} mensagem
 * @param {number} statusCode  padrão 500
 */
export function sendError(res, mensagem, statusCode = 500) {
  return res.status(statusCode).json({ status: "erro", mensagem });
}
