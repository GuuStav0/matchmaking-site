// statements.js — Inicializa o banco SQLite a partir do schema em db/statements.sql
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sqlite3 from "sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dirPath = path.join(__dirname, "db");
const dbPath = path.join(dirPath, "database.db");

if (!fs.existsSync(dirPath)) {
  fs.mkdirSync(dirPath, { recursive: true });
}

export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Erro ao abrir o banco de dados:", err.message);
  } else {
    console.log("SQLite conectado.");
    createTables();
  }
});

export function createTables() {
  const sqlPath = path.join(dirPath, "statements.sql");
  try {
    const sqlQueries = fs.readFileSync(sqlPath, "utf8").trim();
    db.exec(sqlQueries, (err) => {
      if (err) console.error("Erro ao executar statements.sql:", err.message);
      else console.log("Banco inicializado com sucesso.");
    });
  } catch (error) {
    console.error("Erro ao ler statements.sql:", error.message);
  }
}
