// statements.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Defina o caminho completo para a pasta e para o arquivo do banco
const dirPath = path.join(__dirname, 'db');
const dbPath = path.join(dirPath, 'database.db');

// 2. GARANTIA: Se a pasta 'db' não existir, o Node cria ela agora
if (!fs.existsSync(dirPath)) {
    console.log("Pasta 'db' não encontrada. Criando pasta...");
    fs.mkdirSync(dirPath, { recursive: true });
}

// 3. Conecta ao Banco de Dados SQLite usando o caminho absoluto garantido
export const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erro ao abrir o banco de dados:', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite com sucesso.');
        createTables(); // Executa a inicialização das tabelas automaticamente
    }
});

// Função para Criar/Resetar as Tabelas com base no seu statements.sql
export function createTables() {
    console.log("Iniciando a criação das tabelas via arquivo .sql...");
    
    // Garantindo também o caminho absoluto correto para o arquivo .sql
    const sqlPath = path.join(dirPath, 'statements.sql');
    
    try {
        const sqlQueries = fs.readFileSync(sqlPath, 'utf8').trim();
        
        db.exec(sqlQueries, (err) => {
            if (err) {
                console.error("Erro ao executar o arquivo SQL:", err.message);
            } else {
                console.log("-> Banco de dados inicializado e tabelas criadas com sucesso! [Matchmaking]");
            }
        });
    } catch (error) {
        console.error(`Erro ao ler o arquivo statements.sql em ${sqlPath}:`, error.message);
    }
}