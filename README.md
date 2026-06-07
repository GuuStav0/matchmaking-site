# Guia de Desenvolvimento: Trabalho 2º Bimestre Laboratório

Este guia contém os passos essenciais para configurar seu ambiente, gerenciar o código com Git e rodar a aplicação localmente.


## 👾 Clonando o projeto e preparando Commits
Para iniciar, abra o terminal na pasta onde deseja salvar o projeto e faça o clone do repositório executando o comando `git clone https://github.com/dalaquamurilo804-sys/Trabalho2bimestrelab.git`. Assim que o download terminar, entre na pasta do projeto utilizando `cd Trabalho2bimestrelab`.

Com o projeto clonado, o próximo passo é realizar o build inicial instalando as dependências do Node.js. Para fazer isso, execute o comando `npm install`. Esse comando lerá o arquivo `package.json` e baixará automaticamente a pasta `node_modules` com todas as bibliotecas necessárias para a aplicação funcionar.

Para organizar o desenvolvimento e manter o código da branch principal seguro, é fundamental trabalhar com ramificações. Você pode criar e migrar para uma branch separada da main rodando o comando `git checkout -b nome-da-sua-branch`. Se precisar listar as branches existentes na sua máquina, use `git branch`, e para retornar a uma branch já existente, como a própria main, utilize `git checkout main`.

Antes de iniciar qualquer alteração no código ou criar novas funcionalidades, lembre-se de atualizar seu repositório local com as últimas mudanças do servidor remoto. Para isso, utilize o comando `git pull origin main` (ou substitua "main" pelo nome da branch que deseja atualizar).

Após fazer as modificações necessárias nos arquivos do projeto, você deve salvar seu progresso criando um commit. Primeiro, verifique quais arquivos foram alterados usando `git status`. Em seguida, adicione os arquivos que deseja salvar na área de preparação com o comando `git add .` para incluir todas as modificações (ou `git add caminho/do/arquivo` para um arquivo específico). Com os arquivos preparados, crie o commit executando `git commit -m "Sua mensagem explicativa aqui"`. Para enviar essas alterações para o GitHub, finalize com `git push origin nome-da-sua-branch`.

# 🎮 Matchmaking API

Esta é uma API REST robusta desenvolvida em Node.js utilizando o framework **Express** e integrada ao banco de dados **SQLite** (via driver `sqlite3`). O projeto foi arquitetado de forma modular, onde a estrutura e inicialização do banco de dados são gerenciadas isoladamente pelo arquivo `statements.js` (alimentado pelo script `statements.sql`), enquanto o arquivo `api.js` centraliza o recebimento de requisições e regras de rotas.

A API foi projetada para suportar um ecossistema completo de matchmaking, controlando usuários, perfis detalhados de jogadores, catálogos de jogos, níveis de habilidade e formação de grupos para partidas cooperativas ou competitivas.


Por fim, com todas as dependências instaladas e o código pronto, você pode iniciar o servidor de desenvolvimento local do Vite executando o comando `npm run dev`. O terminal exibirá o endereço local da aplicação, que geralmente é `http://localhost:5173/`. Basta abrir essa URL no seu navegador para visualizar o projeto rodando em tempo real com suporte a atualizações automáticas assim que os arquivos forem salvos.

---

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