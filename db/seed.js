// db/seed.js
import { db } from "../statements.js";
import bcrypt from "bcrypt";

// Transforma o db.run tradicional em Promise para podermos usar async/await de forma limpa
const executar = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

async function runSeed() {
  console.log("─────────────────────────────────────────────");
  console.log("🔄 Sincronizando com o banco database.db da API...");
  console.log("─────────────────────────────────────────────");

  try {
    // 1. Desativa temporariamente as chaves estrangeiras para limpar as tabelas sem conflitos
    await executar("PRAGMA foreign_keys = OFF;");

    // 2. Lista exata de tabelas presentes no teu statements.sql para reset completo
    const tabelas = [
      "room_messages",
      "group_members",
      "game_groups",
      "user_games",
      "admins",
      "password_resets",
      "profiles",
      "users",
      "games",
      "genres",
    ];

    console.log("🗑️  Limpando dados antigos de todas as tabelas...");
    for (const tabela of tabelas) {
      await executar(`DELETE FROM ${tabela};`);
      // Zera o contador AUTOINCREMENT do SQLite para esta tabela
      await executar(`DELETE FROM sqlite_sequence WHERE name = ?;`, [tabela]);
    }
    console.log("✅ Todas as tabelas foram zeradas com sucesso!");

    // 3. Reativa as restrições de Chaves Estrangeiras
    await executar("PRAGMA foreign_keys = ON;");

    console.log("🌱 Inserindo dados de teste válidos...");

    // 4. Inserir Gêneros (genres)
    await executar(
      "INSERT INTO genres (id, name) VALUES (1, 'FPS'), (2, 'MOBA'), (3, 'RPG');",
    );

    // 5. Inserir Jogos (games) - mapeando o genre_id correto e os ranks disponíveis
    await executar(
      "INSERT INTO games (id, name, genre_id, image_url, ranks_tags, game_style) VALUES (1, 'Counter-Strike 2', 1, 'https://cdn.cloudflare.steamstatic.com/steam/apps/730/header.jpg', 'Prata,Ouro Nova,Ouro,Ouro Elite,Ouro Elite Mestre,Platina,Diamante,Mestre,Grão-Mestre,Global Elite', 2);",
    );
    await executar(
      "INSERT INTO games (id, name, genre_id, image_url, ranks_tags, game_style) VALUES (2, 'League of Legends', 2, 'https://cdn.communitydragon.org/latest/assets/images/lobby/lol-logo-rendered-hi-res.png', 'Ferro,Bronze,Prata,Ouro,Platina,Esmeralda,Diamante,Mestre,Grão-Mestre,Desafiante', 3);",
    );
    await executar(
      "INSERT INTO games (id, name, genre_id, image_url, ranks_tags, game_style) VALUES (3, 'Valorant', 1, 'https://cdn.communitydragon.org/latest/assets/images/lobby/valorant-logo-rendered-hi-res.png', 'Ferro,Bronze,Prata,Ouro,Platina,Diamante,Ascendente,Imortal,Radiante', 2);",
    );

    // 6. Encriptação da senha padrão 'Usuario123' usando o bcrypt da sua API
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash("Usuario123", saltRounds);

    // 7. Inserir Usuários (users) -> O primeiro inserido terá o ID 1 obrigatoriamente
    await executar(
      "INSERT INTO users (id, email, password) VALUES (1, 'admin@matchup.com', ?);",
      [passwordHash],
    );
    await executar(
      "INSERT INTO users (id, email, password) VALUES (2, 'jogador1@gmail.com', ?);",
      [passwordHash],
    );
    await executar(
      "INSERT INTO users (id, email, password) VALUES (3, 'jogador2@gmail.com', ?);",
      [passwordHash],
    );

    // 8. Inserir Perfis (profiles) vinculados aos IDs dos usuários
    await executar(`
      INSERT INTO profiles (id, user_id, nickname, bio, avatar_url, schedule_availability) 
      VALUES (1, 1, 'ChefaoAdmin', 'Administrador do sistema Matchup', 'https://api.dicebear.com/7.x/bottts/svg?seed=admin', 'Noite');
    `);
    await executar(`
      INSERT INTO profiles (id, user_id, nickname, bio, avatar_url, schedule_availability) 
      VALUES (2, 2, 'FallenFilho', 'Procurando duo focado para subir de elo.', 'https://api.dicebear.com/7.x/bottts/svg?seed=j1', 'Tarde, Noite');
    `);
    await executar(`
      INSERT INTO profiles (id, user_id, nickname, bio, avatar_url, schedule_availability) 
      VALUES (3, 3, 'MonoYasuo', 'Jogo para me divertir, sem rage por favor!', 'https://api.dicebear.com/7.x/bottts/svg?seed=j2', 'Madrugada');
    `);

    // 9. Vincular perfis aos jogos que eles jogam (user_games)
    await executar(
      "INSERT INTO user_games (profile_id, game_id, game_style, game_rank) VALUES (1, 1, 'competitive', 'Global Elite');",
    ); // Admin joga CS2
    await executar(
      "INSERT INTO user_games (profile_id, game_id, game_style, game_rank) VALUES (2, 1, 'competitive', 'Prata');",
    ); // Jogador 1 joga CS2
    await executar(
      "INSERT INTO user_games (profile_id, game_id, game_style, game_rank) VALUES (2, 3, 'casual', 'Ferro');",
    ); // Jogador 1 joga Valorant
    await executar(
      "INSERT INTO user_games (profile_id, game_id, game_style, game_rank) VALUES (3, 2, 'casual', 'Bronze');",
    ); // Jogador 2 joga LoL

    // 10. 👑 DEFINIR O USUÁRIO DE ID 1 COMO ADMIN (tabela admins)
    // Conforme o seu schema: user_id unificado, level=2 (Super Admin)
    await executar("INSERT INTO admins (id, user_id, level) VALUES (1, 1, 2);");

    // 11. Criar Grupos de Lobby ativos para testes (game_groups)
    await executar(`
      INSERT INTO game_groups (id, creator_id, game_id, name, bio, max_slots, game_style, rank_min, rank_max, schedule, language, mic_required, tags) 
      VALUES (1, 2, 1, 'Lobby do Fallen', 'Fechando time comp hoje à noite, cola!', 5, 'Competitivo', 'Prata', 'Ouro Elite', 'Noite', 'PT-BR', 1, 'Competitivo,SemRage,FocoNoObjectivo');
    `);
    await executar(`
      INSERT INTO game_groups (id, creator_id, game_id, name, bio, max_slots, game_style, rank_min, rank_max, schedule, language, mic_required, tags) 
      VALUES (2, 3, 2, 'Ranked LoL casual', 'Subindo de elo sem stress, venha jogar!', 4, 'Casual', 'Bronze', 'Ouro', 'Tarde', 'PT-BR', 0, 'Casual,SemTilt,Divertido');
    `);

    // Adiciona membros aos grupos (group_members)
    await executar(
      "INSERT INTO group_members (group_id, profile_id, role) VALUES (1, 2, 'owner');",
    );
    await executar(
      "INSERT INTO group_members (group_id, profile_id, role) VALUES (2, 3, 'owner');",
    );
    await executar(
      "INSERT INTO group_members (group_id, profile_id, role) VALUES (2, 1, 'member');",
    );

    // 12. Inserir mensagens nas salas dos grupos (room_messages)
    await executar(
      "INSERT INTO room_messages (group_id, profile_id, content) VALUES (1, 2, 'E aí, alguém on pra fechar a squad agora?');",
    );
    await executar(
      "INSERT INTO room_messages (group_id, profile_id, content) VALUES (1, 1, 'Tô dentro! Já entro na call.');",
    );
    await executar(
      "INSERT INTO room_messages (group_id, profile_id, content) VALUES (2, 3, 'Boa tarde gente, bora uma ranked relaxada?');",
    );
    await executar(
      "INSERT INTO room_messages (group_id, profile_id, content) VALUES (2, 1, 'Vou junto, sem stress hoje haha');",
    );


    console.log("─────────────────────────────────────────────");
    console.log("✅ Banco de dados RESETADO e POPULADO com sucesso!");
    console.log("─────────────────────────────────────────────");
    console.log("Dados de Acesso criados:");
    console.log(" 👑 Admin: admin@matchup.com | Senha: Usuario123");
    console.log(" 🎮 Player: jogador1@gmail.com | Senha: Usuario123");
    console.log(" 🎮 Player: jogador2@gmail.com | Senha: Usuario123");
    console.log("─────────────────────────────────────────────");
  } catch (error) {
    console.error("❌ Erro crítico executando o banco seed:", error.message);
  } finally {
    // Fecha a conexão com o banco com segurança
    db.close((err) => {
      if (err) console.error("Erro ao fechar conexão do banco:", err.message);
      process.exit(0);
    });
  }
}

// Pequeno delay para garantir que o banco em statements.js terminou de ler o arquivo SQL antes de rodar o seed
setTimeout(() => {
  runSeed();
}, 600);