# 🚀 Local AI Agent

Uma IDE orientada por agente para o VS Code.

O projeto transforma o VS Code em um ambiente inteligente de desenvolvimento assistido, utilizando:

* ChatGPT Go,
* GitHub Copilot,
* Codex,
* execução local segura,
* gerenciamento automático de workspaces,
* automação de arquivos,
* terminal integrado,
* preview e rollback.

O foco do projeto NÃO é criar um modelo de IA local.

O foco é construir:

# 👉 um orquestrador inteligente de desenvolvimento dentro do VS Code.

---

# ✨ Objetivo

Construir uma extensão VS Code capaz de:

* criar projetos completos,
* gerar estrutura de pastas,
* criar e modificar arquivos,
* executar comandos,
* automatizar desenvolvimento,
* gerenciar workspaces,
* trabalhar com prompts inteligentes,
* integrar ChatGPT Go ao fluxo de desenvolvimento.

Tudo isso:

* localmente,
* com baixo consumo de recursos,
* sem necessidade de modelos locais pesados.

---

# 🧠 Filosofia do projeto

O projeto NÃO pretende competir com modelos de IA.

O diferencial é:

# 👉 o ambiente inteligente de execução.

O sistema atua como:

* executor,
* workspace manager,
* prompt engine,
* diff engine,
* rollback system,
* terminal orchestrator.

A IA pode vir de:

* ChatGPT Go,
* GitHub Copilot,
* Codex,
* modelos externos.

---

# 🧠 Arquitetura

```txt
VSCode Extension
        ↓
Workspace Manager
        ↓
Prompt Builder
        ↓
Planner / Validator
        ↓
Executor Local
        ↓
Workspace
```

---

# 🔥 Funcionalidades atuais

## ✅ Backend Express

* API REST local
* gerenciamento de workspaces
* leitura de arquivos
* análise automática de projetos
* geração de contexto inteligente
* preview de ações
* snapshots automáticos
* rollback

---

## ✅ Agente executor

O sistema já suporta:

* create_file
* patch_file
* delete_file
* rename_file
* create_folder
* run_command

---

## ✅ Segurança

Implementações atuais:

* proteção contra path traversal
* sandbox por workspace
* whitelist de comandos
* bloqueio de operadores perigosos
* snapshots automáticos
* preview obrigatório

---

## ✅ Contexto inteligente

O sistema:

* detecta arquivos relevantes,
* extrai imports,
* reduz consumo de tokens,
* evita enviar projetos inteiros,
* prepara prompts inteligentes.

---

## ✅ VSCode Extension

Estrutura inicial implementada:

* sidebar
* webview
* integração backend
* painel de prompt
* comunicação com agente

---

# 🚀 Fluxo do sistema

```txt
Usuário escreve prompt
        ↓
Extensão gera contexto inteligente
        ↓
Prompt Builder monta instrução
        ↓
Usuário usa ChatGPT Go/Codex
        ↓
Plano retorna para extensão
        ↓
Executor aplica mudanças
        ↓
Preview + Diff + Rollback
```

---

# 📁 Estrutura do projeto

```txt
local-ai-api/
│
├── agent/
├── public/
├── vscode-extension/
├── workspaces/
├── snapshots/
├── logs/
├── GPT.config/
├── server.js
├── utils.js
└── package.json
```

---

# ⚡ Instalação

## 1. Clone o projeto

```bash
git clone https://github.com/sidneyscv/local-ai-api.git
```

---

## 2. Entre na pasta

```bash
cd local-ai-api
```

---

## 3. Instale dependências

```bash
npm install
```

---

## 4. Inicie servidor

```bash
npm start
```

---

# 🌐 Objetivo da extensão VSCode

A extensão deverá funcionar como:

# 👉 uma IDE assistida por agente.

Com:

* prompt inteligente,
* criação automática de projetos,
* gerenciamento de workspaces,
* preview visual,
* terminal integrado,
* rollback,
* logs,
* snapshots,
* automação de código.

---

# 🔍 Tecnologias utilizadas

## Backend

* Node.js
* Express
* OpenAI SDK

---

## VSCode Extension

* TypeScript
* VSCode API
* Webview API

---

# 🔐 Segurança

O projeto implementa:

* sandbox por workspace,
* validação de paths,
* whitelist de comandos,
* preview obrigatório,
* snapshots automáticos,
* rollback.

---

# 🚀 Roadmap

## Backend

* [ ] Modularização completa
* [ ] Serviços separados
* [ ] Sistema de jobs
* [ ] Streaming em tempo real
* [ ] AST parsing
* [ ] Diff engine avançado

---

## VSCode

* [ ] Sidebar completa
* [ ] Histórico visual
* [ ] Logs em tempo real
* [ ] Preview interativo
* [ ] Aprovação de execução
* [ ] Painel de workspaces

---

## Inteligência

* [ ] Prompt Builder avançado
* [ ] Contexto semântico
* [ ] Planejamento multi-step
* [ ] Auto-fix
* [ ] Integração Git avançada

---

# 📌 Visão futura

O objetivo do projeto é evoluir para:

# 👉 uma plataforma pessoal de desenvolvimento assistido por IA

integrada ao VS Code.

Sem depender de:

* GPUs,
* modelos locais gigantes,
* infraestrutura pesada.

O foco será:

* automação segura,
* velocidade,
* produtividade,
* execução local,
* experiência semelhante a Cursor/Codex.

---

# ⚠️ Importante

Nunca envie para o GitHub:

* `.env`
* API keys
* tokens
* segredos

Use sempre:

```txt
.env.example
```

---

# 📄 Licença

MIT

---

# 🙌 Contribuição

Contribuições são bem-vindas.

Especialmente em:

* modularização,
* segurança,
* UX,
* VSCode integration,
* diff engine,
* parsing inteligente,
* automação.

---

# ⭐ Status do projeto

🚧 Em desenvolvimento ativo.

A arquitetura principal do agente já está funcional e em evolução contínua.

Mas a arquitetura principal do agente já está funcional e em evolução contínua.
