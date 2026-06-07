// src/database.js
// Abre a conexão com SQLite, cria as tabelas e aplica o seed de jogos.
// Usa ESM puro ("type": "module" no package.json).

import sqlite3   from "sqlite3";
import { readFileSync, mkdirSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join }  from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const DB_DIR  = join(__dirname, "..", "db");
const DB_PATH = join(DB_DIR, "database.db");
const SQL_PATH = join(__dirname, "statements.sql");

// Garante que a pasta db/ existe
if (!existsSync(DB_DIR)) mkdirSync(DB_DIR, { recursive: true });

// Abre (ou cria) o arquivo do banco
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error("❌  Falha ao conectar ao SQLite:", err.message);
    process.exit(1);
  }
  console.log(`✅  SQLite conectado → ${DB_PATH}`);
});

// Ativa WAL e foreign keys
db.run("PRAGMA journal_mode = WAL;");
db.run("PRAGMA foreign_keys = ON;");

/**
 * Lê o statements.sql e executa todas as instruções DDL + seed.
 * Retorna uma Promise que resolve quando o banco estiver pronto.
 */
export function initDatabase() {
  return new Promise((resolve, reject) => {
    const sql = readFileSync(SQL_PATH, "utf8");

    db.exec(sql, (err) => {
      if (err) {
        console.error("❌  Erro ao inicializar banco:", err.message);
        return reject(err);
      }
      console.log("✅  Tabelas criadas e seed aplicado.");
      resolve();
    });
  });
}

export { db };
