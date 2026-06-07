
## 🚀 Como Iniciar a API Corretamente

Siga o passo a passo abaixo para configurar o ambiente e colocar o servidor online.

### 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado em sua máquina:
* **Node.js** (Recomendado v18 ou superior)
* **npm** (Gerenciador de pacotes padrão do Node)

### 🔧 1. Instalação de Dependências

Abra o terminal na pasta raiz do servidor (`/server`) e execute o comando abaixo para instalar todos os módulos necessários mapeados no `package.json`:

```bash
npm install
```

### ⚡ Inicialização da API (`npm run start`)

O comando `npm run start` é o ponto de entrada principal do ciclo de vida da aplicação. Ele é responsável por colocar o servidor Express online e garantir que toda a infraestrutura e conexão com o banco de dados SQLite estejam prontas para o uso.

#### O que o comando faz na prática?

Ao executar `npm run start` no terminal dentro do diretório `/server`, o Node.js interpreta o ficheiro `api.js`, o que dispara uma reação em cadeia automatizada dividida em 4 etapas cruciais:

1. **Validação de Diretórios:** O script verifica se a pasta física `db/` existe na raiz do servidor. Caso ela não seja encontrada, o Node.js cria-a dinamicamente para evitar falhas de gravação.
2. **Conexão com o SQLite:** É aberta uma conexão segura e persistente com o arquivo físico `database.db`. Se o arquivo ainda não existir dentro da pasta `db/`, o driver do SQLite encarrega-se de o criar imediatamente.
3. **Mapeamento da Estrutura (Build):** Com o banco aberto, o script lê o arquivo estrutural `statements.sql`, analisa todas as tabelas (como `users`, `profiles`, `games`, etc.) e cria-as de forma segura apenas se elas ainda não existirem no catálogo.
4. **Disponibilidade da API:** O servidor Express conclui a inicialização e passa a escutar conexões externas através da porta local `3000` (`http://localhost:3000`), libertando todos os endpoints de CRUD para receber as requisições do sistema ou do frontend.

#### Como Executar

Abra o terminal do seu sistema operacional, certifique-se de estar na pasta raiz do servidor e digite:

```bash
npm run start
```
