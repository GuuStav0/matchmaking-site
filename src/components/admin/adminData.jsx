// src/components/admin/adminData.jsx
// Constantes, dados mock e definições de colunas do painel admin.

export const PER_PAGE = 10;

export const SECTIONS = [
  { id: "overview",      label: "Visão Geral",  icon: "▦" },
  { id: "users",         label: "Usuários",      icon: "👤" },
  { id: "profiles",      label: "Perfis",        icon: "🪪" },
  { id: "games",         label: "Jogos",         icon: "🎮" },
  { id: "groups",        label: "Salas",         icon: "🏠" },
  { id: "group_members", label: "Membros Salas", icon: "👥" },
];

export const GENRES = ["FPS", "MOBA", "Battle Royale", "Esporte", "Sandbox", "MMORPG", "RPG", "Estratégia", "Luta", "Outro"];

export const STAT_META = [
  { key: "users",         label: "Usuários", icon: "👤", color: "#7c3aed" },
  { key: "profiles",      label: "Perfis",   icon: "🪪", color: "#0ea5e9" },
  { key: "games",         label: "Jogos",    icon: "🎮", color: "#10b981" },
  { key: "groups",        label: "Salas",    icon: "🏠", color: "#f59e0b" },
  { key: "group_members", label: "Membros",  icon: "👥", color: "#ec4899" },
];

export const MOCK = {
  users: Array.from({ length: 8 }, (_, i) => ({
    id: `mock-user-${i + 1}`,
    email: `user${i + 1}@mail.com`,
    nickname: `Player${i + 1}`,
    created_at: `2025-0${(i % 9) + 1}-${String((i % 28) + 1).padStart(2, "0")}`,
  })),
  profiles: Array.from({ length: 8 }, (_, i) => ({
    id: `mock-user-${i + 1}`,
    nickname: ["GhostReaper","LunaStrike","SkyWarden","NovaPulse","IronVeil","CipherX","PixelStar","VoidHunter"][i % 8],
    bio: i % 2 === 0 ? "Jogador competitivo focado em rank." : null,
    schedule_availability: ["21h–00h", "Fins de semana", "Madrugada", "Qualquer horário"][i % 4],
    created_at: `2025-0${(i % 9) + 1}-${String((i % 28) + 1).padStart(2, "0")}`,
  })),
  games: [
    { id:1,  name:"Valorant",          genre:"FPS",           rooms_count:142 },
    { id:2,  name:"League of Legends", genre:"MOBA",          rooms_count:98  },
    { id:3,  name:"CS2",               genre:"FPS",           rooms_count:87  },
    { id:4,  name:"Apex Legends",      genre:"Battle Royale", rooms_count:63  },
    { id:5,  name:"Rainbow Six Siege", genre:"FPS",           rooms_count:55  },
    { id:6,  name:"Rocket League",     genre:"Esporte",       rooms_count:44  },
    { id:7,  name:"Dota 2",            genre:"MOBA",          rooms_count:39  },
    { id:8,  name:"Overwatch 2",       genre:"FPS",           rooms_count:36  },
    { id:9,  name:"Fortnite",          genre:"Battle Royale", rooms_count:31  },
    { id:10, name:"Minecraft",         genre:"Sandbox",       rooms_count:19  },
    { id:11, name:"FIFA 25",           genre:"Esporte",       rooms_count:17  },
    { id:12, name:"World of Warcraft", genre:"MMORPG",        rooms_count:15  },
  ],
  groups: Array.from({ length: 6 }, (_, i) => ({
    id: i + 1,
    name:         ["Rank até Imortal","Casual fins de semana","Trio Duelist","Full team 5v5","Noturno intenso","Aprendendo"][i],
    game_name:    ["Valorant","LoL","CS2","Apex","R6S","Minecraft"][i],
    creator_id:   `mock-user-${i + 1}`,
    max_slots:    5,
    members_count:(i % 4) + 1,
    created_at:   `2025-0${i + 1}-01`,
  })),
  group_members: Array.from({ length: 12 }, (_, i) => ({
    group_id:   (i % 6) + 1,
    profile_id: `mock-user-${(i % 8) + 1}`,
    nickname:   ["GhostReaper","LunaStrike","SkyWarden","NovaPulse","IronVeil","CipherX","PixelStar","VoidHunter"][i % 8],
    group_name: ["Rank até Imortal","Casual fins de semana","Trio Duelist","Full team 5v5","Noturno intenso","Aprendendo"][i % 6],
    role:       i % 5 === 0 ? "owner" : "member",
    joined_at:  `2025-0${(i % 9) + 1}-${String((i % 28) + 1).padStart(2, "0")}`,
  })),
};

export const COLS = {
  users: [
    { key: "id",         label: "#",        mono: true },
    { key: "email",      label: "E-mail" },
    { key: "nickname",   label: "Nickname" },
    { key: "created_at", label: "Criado em", render: (v) => <span className="tbl__date">{v}</span> },
  ],
  profiles: [
    { key: "id",                    label: "#",        mono: true },
    { key: "nickname",              label: "Nickname", render: (v) => <span className="tbl__nick"><span className="tbl__nick-av">{v?.[0] ?? "?"}</span>{v}</span> },
    { key: "schedule_availability", label: "Horário" },
    { key: "bio",                   label: "Bio",      render: (v) => v ? <span className="tbl__clamp">{v}</span> : <span className="tbl__null">—</span> },
    { key: "created_at",            label: "Criado em",render: (v) => <span className="tbl__date">{v}</span> },
  ],
  games: [
    { key: "id",          label: "#",      mono: true },
    { key: "name",        label: "Nome",   render: (v) => <strong style={{ color: "#f1f5f9" }}>{v}</strong> },
    { key: "genre",       label: "Gênero", render: (v) => <span className="tbl__genre">{v}</span> },
    { key: "rooms_count", label: "Salas",  render: (v) => <span className="tbl__num">{v}</span> },
  ],
  groups: [
    { key: "id",            label: "#",         mono: true },
    { key: "name",          label: "Nome" },
    { key: "game_name",     label: "Jogo" },
    { key: "members_count", label: "Membros",   render: (v, row) => <span className="tbl__num">{v}/{row.max_slots}</span> },
    { key: "created_at",    label: "Criado em", render: (v) => <span className="tbl__date">{v}</span> },
  ],
  group_members: [
    { key: "group_id",   label: "Sala ID",   mono: true },
    { key: "group_name", label: "Sala" },
    { key: "nickname",   label: "Jogador" },
    { key: "role",       label: "Papel",     render: (v) => <span className={`tbl__badge ${v === "owner" ? "tbl__badge--comp" : "tbl__badge--casual"}`}>{v === "owner" ? "👑 Dono" : "Membro"}</span> },
    { key: "joined_at",  label: "Entrou em", render: (v) => <span className="tbl__date">{v}</span> },
  ],
};
