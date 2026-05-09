# 🧪 Exemplos de Uso - Local AI API

## 1️⃣ Criar um projeto Node.js com Express

### Passo 1: Criar workspace
```bash
curl -X POST http://localhost:3000/workspace \
  -H "Content-Type: application/json" \
  -d '{
    "name": "api-express"
  }'
```

### Passo 2: Executar agente para criar estrutura
```bash
curl -X POST http://localhost:3000/agent \
  -H "Content-Type: application/json" \
  -d '{
    "workspace": "api-express",
    "instruction": "Crie uma API Express com:
      - Estrutura de pastas: src/, routes/, controllers/, models/
      - package.json com express, cors, dotenv
      - Arquivo .env
      - Arquivo src/index.js como entry point
      - Rota GET /api/health que retorna {status: ok}
      - Configurar CORS"
  }'
```

### Passo 3: Analisar resultado
```bash
curl "http://localhost:3000/analyze?workspace=api-express"
curl "http://localhost:3000/tree?workspace=api-express"
```

---

## 2️⃣ Adicionar nova funcionalidade

### Instrução: Adicionar rota de usuários
```bash
curl -X POST http://localhost:3000/agent \
  -H "Content-Type: application/json" \
  -d '{
    "workspace": "api-express",
    "instruction": "Adicione ao projeto:
      - Novo arquivo src/routes/users.js com rotas CRUD
      - Controlador src/controllers/userController.js
      - Array mock de usuários
      - Rotas:
        * GET /api/users - listar todos
        * GET /api/users/:id - obter por ID
        * POST /api/users - criar novo
        * PUT /api/users/:id - atualizar
        * DELETE /api/users/:id - deletar
      - Integrar as rotas no src/index.js"
  }'
```

---

## 3️⃣ Criar projeto React

```bash
# 1. Criar workspace
curl -X POST http://localhost:3000/workspace \
  -H "Content-Type: application/json" \
  -d '{"name": "app-react"}'

# 2. Setup do projeto
curl -X POST http://localhost:3000/agent \
  -H "Content-Type: application/json" \
  -d '{
    "workspace": "app-react",
    "instruction": "Crie uma estrutura React:
      - package.json com react, react-dom, react-router-dom
      - src/App.jsx como componente principal
      - src/index.jsx como entry point
      - Pasta src/components/ vazia
      - Pasta src/pages/ vazia
      - Arquivo .gitignore para Node.js
      - Arquivo README.md com instruções de setup"
  }'
```

---

## 4️⃣ Editar arquivo específico

### Ler arquivo primeiro
```bash
curl "http://localhost:3000/file?workspace=api-express&filepath=package.json"
```

### Fazer alteração
```bash
curl -X POST http://localhost:3000/agent \
  -H "Content-Type: application/json" \
  -d '{
    "workspace": "api-express",
    "instruction": "No arquivo src/index.js:
      - Mude a porta de 3000 para 5000
      - Adicione console.log quando servidor inicia
      - Implemente tratamento de erro"
  }'
```

---

## 5️⃣ Converter projeto para TypeScript

```bash
curl -X POST http://localhost:3000/agent \
  -H "Content-Type: application/json" \
  -d '{
    "workspace": "api-express",
    "instruction": "Converta o projeto para TypeScript:
      - Instale typescript, @types/express, @types/node
      - Crie arquivo tsconfig.json
      - Renomeie src/index.js para src/index.ts
      - Adicione type annotations
      - Configure scripts npm para build"
  }'
```

---

## 6️⃣ Adicionar testes

```bash
curl -X POST http://localhost:3000/agent \
  -H "Content-Type: application/json" \
  -d '{
    "workspace": "api-express",
    "instruction": "Adicione testes:
      - Instale jest e supertest
      - Crie arquivo jest.config.js
      - Crie pasta __tests__/
      - Escreva testes para as rotas de users
      - Configure script npm test"
  }'
```

---

## 7️⃣ Setup de Docker

```bash
curl -X POST http://localhost:3000/agent \
  -H "Content-Type: application/json" \
  -d '{
    "workspace": "api-express",
    "instruction": "Adicione Docker:
      - Crie arquivo Dockerfile
      - Crie arquivo docker-compose.yml
      - Configure para Node.js
      - Exponha porta 5000
      - Use node:18-alpine como base"
  }'
```

---

## 8️⃣ Melhorar código existente

```bash
curl -X POST http://localhost:3000/agent \
  -H "Content-Type: application/json" \
  -d '{
    "workspace": "api-express",
    "instruction": "Melhore o código:
      - Adicione tratamento de erro em todas as rotas
      - Adicione validação de inputs
      - Adicione logging com winston
      - Implemente middleware de autenticação
      - Adicione variáveis de ambiente"
  }'
```

---

## 📊 Verificar Progresso

Depois de cada passo, verifique:

```bash
# Ver estrutura
curl "http://localhost:3000/tree?workspace=api-express"

# Ler arquivo específico
curl "http://localhost:3000/file?workspace=api-express&filepath=src/index.js"

# Analisar projeto completo
curl "http://localhost:3000/analyze?workspace=api-express"

# Listar todos os arquivos com contexto
curl "http://localhost:3000/files?workspace=api-express"
```

---

## 🎯 Casos de Uso Avançados

### A. Refatorar estrutura de pasta
```bash
curl -X POST http://localhost:3000/agent \
  -H "Content-Type: application/json" \
  -d '{
    "workspace": "api-express",
    "instruction": "Reorganize o projeto:
      - Mova todos os arquivos JS para src/
      - Crie estrutura: src/api/, src/config/, src/utils/
      - Mantenha rotas em src/api/routes/
      - Mantenha controllers em src/api/controllers/
      - Crie arquivo src/config/database.js
      - Crie arquivo src/utils/logger.js"
  }'
```

### B. Adicionar autenticação
```bash
curl -X POST http://localhost:3000/agent \
  -H "Content-Type: application/json" \
  -d '{
    "workspace": "api-express",
    "instruction": "Implemente autenticação JWT:
      - Instale jsonwebtoken, bcryptjs
      - Crie arquivo src/middleware/auth.js
      - Crie rota POST /api/auth/login
      - Crie rota POST /api/auth/register
      - Proteja rotas de usuários com JWT
      - Adicione refresh token"
  }'
```

### C. Integração com banco de dados
```bash
curl -X POST http://localhost:3000/agent \
  -H "Content-Type: application/json" \
  -d '{
    "workspace": "api-express",
    "instruction": "Configure MongoDB:
      - Instale mongoose
      - Crie arquivo src/config/database.js
      - Crie modelo User em src/models/User.js
      - Conecte ao MongoDB no startup
      - Substitua mock array por queries ao MongoDB
      - Adicione validações de schema"
  }'
```

---

## 💡 Dicas

1. **Instruções Claras**: Seja específico sobre o que quer. Ex: em vez de "Adicione autenticação", diga "Implemente JWT com refresh tokens"

2. **Contexto**: A IA lê os arquivos existentes, então pode fazer edições inteligentes

3. **Iterativo**: Você pode dar múltiplas instruções. A IA entenderá o progresso

4. **Verificar Sempre**: Após cada instrução, verifique com `/tree` ou `/file`

5. **Combinar Ações**: A IA pode criar, editar, deletar, renomear e executar comandos em uma única instrução

---

## ✅ Próximas Melhorias Planejadas

- [ ] Endpoint para review de código
- [ ] Endpoint para gerar testes automaticamente
- [ ] Suporte a múltiplas linguagens de programação
- [ ] Integração com GitHub
- [ ] Histórico de mudanças (git integration)
- [ ] Sugestões de melhorias baseadas em análise de código
