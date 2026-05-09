import fs from "fs";
import path from "path";

// 🔥 PLANNER: Cria plano de ações
export async function runPlanner(client, instruction, context) {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `
Você é o PLANNER de um sistema de programação autônomo.
Sua tarefa é ANALISAR a instrução e CRIAR UM PLANO DETALHADO de ações.

INSTRUÇÕES:
- Analise a instrução do usuário
- Examine o contexto do projeto
- Crie um plano sequencial de ações
- Seja específico e seguro

AÇÕES DISPONÍVEIS:
1. create_file - Criar arquivo novo
2. patch_file - Editar arquivo existente (find/replace ou regex)
3. delete_file - Remover arquivo/pasta
4. rename_file - Renomear arquivo
5. create_folder - Criar pasta
6. run_command - Executar comando terminal

REGRAS DE SEGURANÇA:
- NUNCA use caminhos com .. 
- Sempre valide paths
- Prefira comandos seguros da whitelist
- Seja conservador com deletes

IMPORTANTE: Responda APENAS com JSON puro, sem markdown, sem code blocks, sem explicações. Apenas o JSON.
`
      },
      {
        role: "user",
        content: `
INSTRUÇÃO: ${instruction}

CONTEXTO: ${context}
`
      }
    ]
  });

  try {
    let content = response.choices[0].message.content.trim();
    
    // 🔥 Limpar markdown code blocks se presente
    if (content.startsWith('```json')) {
      content = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (content.startsWith('```')) {
      content = content.replace(/^```\w*\s*/, '').replace(/\s*```$/, '');
    }
    
    const plan = JSON.parse(content);
    return plan;
  } catch (error) {
    return { error: "Erro ao parsear plano", details: error.message };
  }
}

// 🔥 VALIDATOR: Valida plano antes da execução
export function validatePlan(plan) {
  if (!plan.steps || !Array.isArray(plan.steps)) {
    return { valid: false, error: "Plano deve ter array 'steps'" };
  }

  const allowedActions = [
    "create_file", "patch_file", "delete_file", "rename_file",
    "create_folder", "run_command"
  ];

  for (const step of plan.steps) {
    if (!step.action || !allowedActions.includes(step.action)) {
      return { valid: false, error: `Ação inválida: ${step.action}` };
    }

    // Validações específicas
    if (step.action === "create_file" && (!step.path || !step.content)) {
      return { valid: false, error: "create_file precisa de path e content" };
    }

    if (step.action === "patch_file" && !step.path) {
      return { valid: false, error: "patch_file precisa de path" };
    }

    if (step.action === "patch_file" && !step.find && !step.regex) {
      return { valid: false, error: "patch_file precisa de find ou regex" };
    }

    if (step.action === "run_command" && !step.command) {
      return { valid: false, error: "run_command precisa de command" };
    }

    // Segurança: bloquear paths perigosos
    if (step.path && (step.path.includes("..") || step.path.startsWith("/"))) {
      return { valid: false, error: `Path perigoso detectado: ${step.path}` };
    }
  }

  return { valid: true };
}

// 🔥 EXECUTOR: Executa plano validado (placeholder - lógica movida para server.js)
export function executePlan(plan, basePath) {
  // Esta função será chamada do server.js após validação
  return { message: "Plano pronto para execução", steps: plan.steps.length };
}

// 🔥 AGENTE PRINCIPAL: Coordena planner + validator
export async function runAgent(client, instruction) {
  // O contexto já vem preparado do server.js
  const context = instruction; // instruction já inclui contexto

  // 1. PLANNER cria plano
  const plan = await runPlanner(client, instruction, context);
  if (plan.error) return plan;

  // 2. VALIDATOR verifica plano
  const validation = validatePlan(plan);
  if (!validation.valid) {
    return { error: "Plano inválido", details: validation.error };
  }

  // 3. Retornar plano validado para execução
  return plan;
}