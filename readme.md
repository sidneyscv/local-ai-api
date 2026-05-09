# 🚀 Projeto: Local AI Agent

## ✅ Visão Geral

Local AI Agent é uma plataforma de programação assistida por IA que combina:

- Backend Node.js com API REST
- Agente de planejamento e execução baseado em OpenAI
- Extensão VS Code para interface integrada
- Sistema de workspaces independentes
- Segurança de path traversal e comandos whitelist
- Logs e preview de mudanças antes da execução

## 🔧 O que já está implementado

- API local em `server.js`
- Gerenciamento de workspaces (`/workspace`, `/workspaces`)
- Análise de projeto e árvore de diretórios (`/analyze`, `/tree`)
- Listagem e leitura de arquivos (`/files`, `/file`)
- Execução de agente IA via `/agent`
- Criação automática de arquivos e patch com `find/replace`
- Delete, rename e criação de pastas pelo agente
- Comandos seguros com whitelist expandida
- Integração com extensão VS Code
- Logs de ações e prompts para auditoria

## ⚡ Como usar

### 1. Instalar dependências

```bash
# Na raiz do projeto
npm install

# Dentro de vscode-extension
cd vscode-extension
npm install
```

### 2. Configurar a chave OpenAI

Crie um arquivo `.env` na raiz:

```env
OPENAI_API_KEY=seu_api_key_aqui
```

### 3. Compilar a extensão

```bash
cd vscode-extension
npm run compile
```

### 4. Iniciar a API

```bash
cd ..
node server.js
```

### 5. Usar a extensão ou a API

- Via extensão: abra o comando `Local AI API: Abrir Painel`
- Via API: use os endpoints descritos abaixo

## 🚀 Endpoints principais

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/workspace` | Criar novo workspace |
| GET | `/workspaces` | Listar workspaces |
| POST | `/file` | Criar ou editar arquivo manualmente |
| GET | `/file?workspace=nome&filepath=...` | Ler conteúdo de arquivo |
| GET | `/files?workspace=nome` | Listar arquivos com contexto |
| GET | `/analyze?workspace=nome` | Analisar projeto e dependências |
| GET | `/tree?workspace=nome` | Exibir árvore de diretórios |
| POST | `/agent` | Executar agente IA no workspace |
| POST | `/generate` | Gerar código simples via prompt |

## 🔧 Como executar o agente

```bash
curl -X POST http://localhost:3000/agent \
  -H "Content-Type: application/json" \
  -d '{
    "workspace": "novo",
    "instruction": "Crie uma rota GET /api/users que retorna JSON"
  }'
```

## 📦 Exemplo de uso manual de arquivo

```bash
curl -X POST http://localhost:3000/file \
  -H "Content-Type: application/json" \
  -d '{
    "workspace": "novo",
    "filename": "test.js",
    "content": "console.log(\"Hello\")"
  }'
```

## 🌳 Inspeção do workspace

```bash
curl "http://localhost:3000/tree?workspace=novo"
curl "http://localhost:3000/analyze?workspace=novo"
```

## 💡 Principais recursos atuais

- Detecção de contexto do projeto antes de executar ações
- Validação de paths para evitar traversal
- Preview de mudanças antes da execução
- Logs estruturados para ações e prompts
- Suporte a workspaces múltiplos
- Extensão VS Code com painel e histórico

## 🧪 Recomendações rápidas

1. Crie um workspace novo com `POST /workspace`
2. Verifique a árvore com `GET /tree`
3. Execute instruções com `/agent`
4. Use `/analyze` para entender o projeto
5. Verifique logs e previas antes de aceitar alterações

## 📝 Atualização de documentação

Os conteúdos de `QUICKSTART.md`, `API.md` e `CHANGELOG.md` foram consolidados neste README.

## 📁 Estrutura relevante do projeto

```
local-ai-api/
├── server.js
├── agent/
│   └── agent.js
├── utils.js
├── vscode-extension/
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
├── workspaces/
│   ├── novo/
│   └── teste/
├── GPT.config/
└── .env
```

## 💾 Notas finais

- `GPT.config/` foi mantido pois contém documentos de análise e planejamento úteis.
- `QUICKSTART.md`, `API.md` e `CHANGELOG.md` serão removidos para evitar duplicação.
# local-ai-api
