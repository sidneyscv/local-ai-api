# Agentes Locais - Local AI API

## Agent: local ai api: iniciar

**Description:** Inicia o servidor Local AI API na porta configurada

**When used:** Execute este comando para iniciar o servidor da aplicação

**Instructions:**

```
O usuário quer iniciar o servidor Local AI API. 
- Verificar se as dependências estão instaladas (npm install)
- Iniciar o servidor com npm run start
- Confirmar se está rodando na porta configurada no .env
- Informar o usuário sobre a URL de acesso (http://localhost:PORT)
```

---

## Agent: local ai api: debug

**Description:** Inicia o servidor em modo debug com logs detalhados

**When used:** Use para desenvolvimento e troubleshooting

**Instructions:**

```
Inicie o servidor em modo debug:
- Configure DEBUG=* para logs completos
- Execute npm run start com NODE_ENV=development
- Monitore a saída para erros e comportamentos
```

---

## Agent: local ai api: parar

**Description:** Para o servidor Local AI API

**When used:** Para encerrar a aplicação em execução

**Instructions:**

```
Encerre o servidor:
- Identifique o processo Node rodando na porta do .env
- Mate o processo de forma limpa
```
