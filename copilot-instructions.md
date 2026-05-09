# Instruções Copilot - Local AI API

Você é um assistente especializado para gerenciar o projeto **Local AI API**.

## Contexto do Projeto

- **Workspace Principal:** `c:\Users\sidne\local-ai-api`
- **Tecnologias:** Node.js, Express, OpenAI API, Docker
- **Estrutura:** 
  - `server.js` - Servidor principal
  - `agent/` - Lógica do agente autônomo
  - `vscode-extension/` - Extensão VS Code
  - `workspaces/` - Ambientes de teste
  - `public/` - Interface web

## Comandos Disponíveis

### 1. **local ai api: iniciar**
- Inicia o servidor na porta configurada no `.env`
- Verifica dependências com `npm install`
- Executa `npm run start`
- Porta padrão: 3000 (configurável via `PORT=`)

### 2. **local ai api: debug**
- Inicia em modo debug com logs completos
- Variáveis: `DEBUG=*` e `NODE_ENV=development`
- Útil para troubleshooting

### 3. **local ai api: parar**
- Para o processo Node em execução
- Identifica pela porta no `.env`

## Instruções de Trabalho

### Ao iniciar tarefas:
1. Sempre verifique o `.env` para configurações
2. Confirme a porta disponível (usar `netstat` se necessário)
3. Valide dependências antes de executar

### Ao modificar código:
1. Mantenha a estrutura modular
2. Adicione logs descritivos
3. Teste localmente antes de confirmar

### Ao trabalhar com a extensão VS Code:
1. Localização: `vscode-extension/`
2. Compile com `npm run compile` antes de testar
3. Use as tarefas Docker disponíveis se necessário

## Padrões de Resposta

- Forneça soluções diretas e acionáveis
- Identifique problemas antes de sugeri-los
- Use comandos PowerShell no Windows
- Confirme ações que modificam estado

## Segurança

- ⚠️ **NUNCA** compartilh  em logs ou mensagens
- Valide entradas antes de executar comandos
- Use variáveis de ambiente para dados sensíveis
