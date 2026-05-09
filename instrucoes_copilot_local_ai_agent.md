# 🚀 Instruções para GitHub Copilot — Evolução do Projeto Local AI Agent

## Objetivo

Modificar o projeto atual para transformá-lo em um agente pessoal de programação integrado ao VS Code, utilizando apenas OpenAI API.

O sistema deve:

- funcionar localmente,
- usar OpenAI API,
- gerenciar workspaces,
- criar/editar/deletar arquivos,
- executar comandos seguros,
- integrar-se ao VS Code,
- ser leve e otimizado para baixo uso de SSD.

---

# ✅ Requisitos principais

## Backend Node.js

Manter:
- Express API,
- sistema de workspaces,
- execução de agente,
- integração OpenAI.

Melhorar:
- segurança,
- performance,
- UX,
- controle de contexto.

---

# 🔥 Tarefas prioritárias

# 1. Criar sistema de Diff Visual

Antes de aplicar:
- create_file,
- patch_file,
- delete_file,
- rename_file,

mostrar:

```diff
- código antigo
+ código novo
```

Criar:
- endpoint de preview,
- aprovação manual do usuário.

---

# 2. Implementar logs estruturados

Criar:
- logs por workspace,
- histórico de prompts,
- histórico de alterações,
- histórico de comandos executados.

Estrutura:

```txt
logs/
  workspace-name/
    actions.log
    prompts.log
```

---

# 3. Melhorar sistema de contexto

Atualmente:
- todos os arquivos são enviados ao modelo.

Modificar para:
- enviar apenas arquivos relevantes,
- limitar contexto,
- usar análise de imports,
- usar busca inteligente.

Criar:
- detectRelevantFiles()
- extractImports()
- prioritizeFiles()

---

# 4. Melhorar segurança

Implementar:
- sandbox por workspace,
- validação rígida de paths,
- confirmação obrigatória para delete,
- confirmação obrigatória para comandos perigosos.

Bloquear:
- comandos encadeados,
- redirecionamentos,
- pipes,
- execução externa.

---

# 5. Melhorar execução de terminal

Substituir:
- execSync()

Por:
- spawn()
- exec()

assíncronos.

Adicionar:
- streaming de logs,
- timeout,
- cancelamento.

---

# 6. Criar painel VS Code

Criar extensão com:
- webview,
- prompt box,
- histórico,
- logs,
- status,
- preview de alterações.

Fluxo:
- usuário envia prompt,
- backend processa,
- exibe plano,
- usuário aprova,
- backend executa.

---

# 7. Criar sistema de aprovação

Antes de:
- deletar arquivos,
- sobrescrever,
- executar comandos,

mostrar:
- preview,
- diff,
- confirmação.

---

# 8. Melhorar arquitetura do agente

Separar:
- Planner
- Executor
- Validator

Fluxo:

1. IA cria plano
2. Sistema valida plano
3. Usuário aprova
4. Executor aplica mudanças
5. Validator verifica erros

---

# 9. Adicionar rollback

Antes de alterar:
- criar snapshot automático.

Permitir:
- desfazer alterações,
- restaurar estado anterior.

---

# 10. Melhorar UX

Adicionar:
- loading states,
- progresso em tempo real,
- notificações,
- histórico visual.

---

# 🚨 NÃO IMPLEMENTAR AGORA

Evitar:
- IA local,
- Docker pesado,
- Kubernetes,
- multi-agente,
- vector database,
- embeddings gigantes.

O foco deve ser:
- leveza,
- segurança,
- estabilidade,
- integração VS Code,
- OpenAI API.

---

# 📦 Meta final

Criar um agente pessoal semelhante a:
- Cursor AI,
- CodeGPT,
- Claude Code,

mas:
- leve,
- local,
- simples,
- seguro,
- controlado pelo usuário.

---

# ✅ Prioridade absoluta

1. Segurança
2. Diff visual
3. Logs
4. Contexto inteligente
5. Painel VSCode
6. Execução assíncrona
7. Rollback
