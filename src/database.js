// src/database.js
// Bridge: re-exporta o banco de dados centralizado em src/models/database.js.
// Os routes em src/routes/ importam daqui via "../database.js".
export { db, initDatabase } from "./models/database.js";
