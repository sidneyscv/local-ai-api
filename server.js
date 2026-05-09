import { execSync } from "child_process";
import { spawn } from "child_process";
import express from "express";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import OpenAI from "openai";
import { runAgent } from "./agent/agent.js";
import { generateFileTree, detectProjectType, getProjectSummary, getDependencies } from "./utils.js";

dotenv.config();

const app = express();
app.use(express.json());

// 🔥 SERVIR ARQUIVOS ESTÁTICOS PARA INTERFACE WEB
app.use(express.static('public'));

const client = new OpenAI({
  "oooo"
});

const BASE_DIR = "./workspaces";
const envPort = Number(process.env.PORT);
const SERVER_PORT = Number.isInteger(envPort) && envPort > 0 ? envPort : 3000;

// 🔥 Criar pasta base se não existir
if (!fs.existsSync(BASE_DIR)) {
  fs.mkdirSync(BASE_DIR);
}

// 🔥 FUNÇÃO: GERAR DIFF VISUAL
function generateDiff(oldContent, newContent, filePath) {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');
  
  let diff = `--- ${filePath} (original)\n+++ ${filePath} (modificado)\n\n`;
  
  // Diff simples: comparar linha por linha
  const maxLines = Math.max(oldLines.length, newLines.length);
  
  for (let i = 0; i < maxLines; i++) {
    const oldLine = oldLines[i] || '';
    const newLine = newLines[i] || '';
    
    if (oldLine !== newLine) {
      if (oldLine && !newLine) {
        diff += `- ${oldLine}\n`;
      } else if (!oldLine && newLine) {
        diff += `+ ${newLine}\n`;
      } else {
        diff += `- ${oldLine}\n`;
        diff += `+ ${newLine}\n`;
      }
    }
  }
  
  return diff;
}

// 🔥 FUNÇÃO: LOGS ESTRUTURADOS
function logAction(workspace, action, details) {
  const logDir = path.join(BASE_DIR, workspace, 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  const logEntry = {
    timestamp: new Date().toISOString(),
    action,
    details
  };
  
  const logFile = path.join(logDir, 'actions.log');
  fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
}

// 🔥 FUNÇÃO: LOG PROMPT
function logPrompt(workspace, prompt, response) {
  const logDir = path.join(BASE_DIR, workspace, 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  const logEntry = {
    timestamp: new Date().toISOString(),
    prompt,
    response: typeof response === 'object' ? JSON.stringify(response) : response
  };
  
  const logFile = path.join(logDir, 'prompts.log');
  fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
}

function getProcessIdsByPort(port) {
  try {
    if (process.platform === "win32") {
      const output = execSync(`cmd /c netstat -ano | findstr :${port}`, { encoding: "utf8" });
      return output
        .split(/\r?\n/)
        .filter(line => line.trim())
        .map(line => line.trim().split(/\s+/).pop())
        .filter(Boolean);
    }

    const output = execSync(`lsof -i :${port} -t`, { encoding: "utf8" });
    return output.split(/\r?\n/).filter(Boolean);
  } catch {
    return [];
  }
}

function killProcessByPort(port) {
  const pids = getProcessIdsByPort(port);
  if (!pids.length) {
    return;
  }

  console.log(`⚠️ Porta ${port} está em uso pelos PIDs: ${pids.join(", ")}. Tentando derrubar...`);

  for (const pid of pids) {
    try {
      if (process.platform === "win32") {
        execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
      } else {
        process.kill(Number(pid), "SIGTERM");
      }
      console.log(`✅ Processo ${pid} derrubado com sucesso`);
    } catch (error) {
      console.error(`❌ Falha ao derrubar o processo ${pid}:`, error.message);
    }
  }
}

function ensurePortFree(port) {
  const pids = getProcessIdsByPort(port);
  if (pids.length > 0) {
    killProcessByPort(port);
  }
}


// 🔥 PATCH AVANÇADO COM FALLBACK
// 🔥 PATCH AVANÇADO COM FALLBACK (SEGURO)
function applyPatch(content, step) {

  if (!step.replace) {
    console.log("Replace inválido");
    return content;
  }

  // 1️⃣ tentativa: find
  if (step.find && content.includes(step.find)) {
    return content.replace(step.find, step.replace);
  }

  // 2️⃣ tentativa: regex segura
  if (step.regex) {
    let regex;

    try {
      regex = new RegExp(step.regex, "g");
    } catch {
      console.log("Regex inválido ignorado");
      regex = null;
    }

    if (regex && regex.test(content)) {
      return content.replace(regex, step.replace);
    }
  }

  // 3️⃣ fallback
  if (content.includes(step.replace)) {
    console.log("Conteúdo já existe no arquivo; pulando fallback");
    return content;
  }
  console.log("Fallback aplicado (append)");
  return content + "\n\n" + step.replace;
}

// 🔥 FUNÇÃO: Validar path para evitar path traversal (segurança)
function isPathSafe(basePath, filePath) {
  const absolute = path.resolve(basePath, filePath);
  const baseAbsolute = path.resolve(basePath);
  return absolute.startsWith(baseAbsolute);
}

//
// ==============================
// 🔥 FUNÇÃO: LER ARQUIVOS DO WORKSPACE
// ==============================
// Agora:
// - ignora node_modules e .git
// - lê apenas arquivos úteis
// - limita tamanho (evita erro de tokens)
//
// 🔥 FUNÇÃO: DETECTAR ARQUIVOS RELEVANTES
function detectRelevantFiles(basePath, instruction) {
  const allFiles = [];
  
  function walk(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const fullPath = path.join(dir, file);
      
      if (fs.statSync(fullPath).isDirectory()) {
        if (file !== "node_modules" && file !== ".git" && file !== "dist" && file !== "build") {
          walk(fullPath);
        }
      } else {
        const ext = path.extname(file);
        if ([".js", ".ts", ".jsx", ".tsx", ".py", ".json", ".md"].includes(ext)) {
          allFiles.push({
            path: path.relative(basePath, fullPath),
            fullPath,
            ext,
            name: file
          });
        }
      }
    }
  }
  
  walk(basePath);
  
  // Priorizar arquivos importantes
  const priorityFiles = [
    "package.json", "requirements.txt", "README.md", ".env",
    "index.js", "main.js", "app.js", "server.js", "index.ts", "main.ts"
  ];
  
  const priority = allFiles.filter(f => priorityFiles.includes(f.name));
  const others = allFiles.filter(f => !priorityFiles.includes(f.name));
  
  // Limitar contexto para evitar tokens excessivos
  const MAX_FILES = 20;
  const selectedFiles = [...priority, ...others.slice(0, MAX_FILES - priority.length)];
  
  return selectedFiles;
}

// 🔥 FUNÇÃO: EXTRAIR IMPORTS E DEPENDÊNCIAS
function extractImports(content, filePath) {
  const imports = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    // JavaScript/TypeScript imports
    const importMatch = line.match(/import\s+.*?\s+from\s+['"]([^'"]+)['"]/);
    if (importMatch) {
      imports.push(importMatch[1]);
    }
    
    const requireMatch = line.match(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/);
    if (requireMatch) {
      imports.push(requireMatch[1]);
    }
    
    // Python imports
    const pythonImportMatch = line.match(/^(?:from\s+([^\s]+)\s+)?import\s+([^\s,]+)/);
    if (pythonImportMatch) {
      if (pythonImportMatch[1]) {
        imports.push(pythonImportMatch[1]);
      }
      imports.push(pythonImportMatch[2]);
    }
  }
  
  return imports;
}

// 🔥 CORRIGIDO: lê arquivos relevantes com limite inteligente
function readWorkspaceFiles(basePath, instruction = "") {
  let filesData = "";
  const MAX_SIZE = 2000; // Reduzido para contexto inteligente
  
  const relevantFiles = detectRelevantFiles(basePath, instruction);
  
  for (const file of relevantFiles) {
    try {
      let content = fs.readFileSync(file.fullPath, "utf-8");
      
      // Extrair imports para contexto adicional
      const imports = extractImports(content, file.path);
      
      // Limitar tamanho
      if (content.length > MAX_SIZE) {
        content = content.substring(0, MAX_SIZE) + "\n... ARQUIVO TRUNCADO ...";
      }
      
      filesData += `
FILE: ${file.path}
IMPORTS: ${imports.join(', ')}
${content}
---------------------`;
    } catch (error) {
      filesData += `
FILE: ${file.path}
ERROR: Não foi possível ler o arquivo
---------------------`;
    }
  }
  
  return filesData;
}

//
// ==============================
// 📁 ROTA: CRIAR WORKSPACE
// ==============================
app.post("/workspace", (req, res) => {
  if (!req.body || !req.body.name) {
    return res.json({ error: "Envie { name: 'nome' }" });
  }

  const { name } = req.body;
  const dir = path.join(BASE_DIR, name);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
    return res.json({ message: "Workspace criado!" });
  }

  res.json({ message: "Já existe." });
});

//
// ==============================
// � ROTA: LISTAR ARQUIVOS DO WORKSPACE
// ==============================
app.get("/files", (req, res) => {
  const { workspace } = req.query;

  if (!workspace) {
    return res.json({ error: "Envie ?workspace=nome" });
  }

  const basePath = path.join(BASE_DIR, workspace);

  if (!fs.existsSync(basePath)) {
    return res.json({ error: "Workspace não existe" });
  }

  try {
    const files = readWorkspaceFiles(basePath);
    res.json({ workspace, files });
  } catch (error) {
    res.json({ error: "Erro ao listar arquivos" });
  }
});

//
// ==============================
// 🌳 ROTA: ÁRVORE DE DIRETÓRIOS
// ==============================
app.get("/tree", (req, res) => {
  const { workspace } = req.query;

  if (!workspace) {
    return res.json({ error: "Envie ?workspace=nome" });
  }

  const basePath = path.join(BASE_DIR, workspace);

  if (!fs.existsSync(basePath)) {
    return res.json({ error: "Workspace não existe" });
  }

  try {
    const tree = generateFileTree(basePath, "", 4);
    res.json({ workspace, tree });
  } catch (error) {
    res.json({ error: "Erro ao gerar árvore", details: error?.message });
  }
});

//
app.get("/workspaces", (req, res) => {
  try {
    const workspaces = fs.readdirSync(BASE_DIR).filter(item => {
      const fullPath = path.join(BASE_DIR, item);
      return fs.statSync(fullPath).isDirectory();
    });
    res.json(workspaces);
  } catch (error) {
    res.json({ error: "Erro ao listar workspaces" });
  }
});

//
// ==============================
// 📄 ROTA: LISTAR ARQUIVOS DO WORKSPACE
// ==============================
app.get("/files", (req, res) => {
  const { workspace } = req.query;

  if (!workspace) {
    return res.json({ error: "Envie ?workspace=nome" });
  }

  const basePath = path.join(BASE_DIR, workspace);

  if (!fs.existsSync(basePath)) {
    return res.json({ error: "Workspace não existe" });
  }

  try {
    const files = readWorkspaceFiles(basePath);
    res.json({ files });
  } catch (error) {
    res.json({ error: "Erro ao listar arquivos" });
  }
});

//
// ==============================
// ✏️ ROTA: CRIAR/EDITAR ARQUIVO MANUAL
// ==============================
app.post("/file", (req, res) => {
  const { workspace, filename, content } = req.body;

  const filePath = path.join(BASE_DIR, workspace, filename);

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);

  res.json({ message: "Arquivo salvo!" });
});

//
// ==============================
// 🤖 ROTA: GERAR CÓDIGO SIMPLES
// ==============================
app.post("/generate", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== "string") {
    return res.json({ error: "Envie { prompt }" });
  }

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Você é um programador especialista." },
        { role: "user", content: prompt }
      ]
    });

    res.json({
      code: completion.choices[0].message.content
    });
  } catch (error) {
    console.error("Erro ao gerar código:", error);
    res.json({ error: "Falha ao gerar código", details: error?.message || String(error) });
  }
});

//
// ==============================
// 📊 ROTA: ANÁLISE DO PROJETO
// ==============================
app.get("/analyze", (req, res) => {
  const { workspace } = req.query;

  if (!workspace) {
    return res.json({ error: "Envie ?workspace=nome" });
  }

  const basePath = path.join(BASE_DIR, workspace);

  if (!fs.existsSync(basePath)) {
    return res.json({ error: "Workspace não existe" });
  }

  try {
    const summary = getProjectSummary(basePath);
    const deps = getDependencies(basePath);

    res.json({
      workspace,
      analysis: summary,
      dependencies: deps,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.json({ error: "Erro ao analisar projeto", details: error?.message });
  }
});

//
// ==============================
// 📄 ROTA: LER ARQUIVO COMPLETO
// ==============================
app.get("/file", (req, res) => {
  const { workspace, filepath } = req.query;

  if (!workspace || !filepath) {
    return res.json({ error: "Envie ?workspace=nome&filepath=arquivo.js" });
  }

  const basePath = path.join(BASE_DIR, workspace);
  const fullPath = path.join(basePath, filepath);

  if (!isPathSafe(basePath, filepath)) {
    return res.json({ error: "Acesso negado: path traversal detectado" });
  }

  if (!fs.existsSync(fullPath)) {
    return res.json({ error: "Arquivo não encontrado" });
  }

  try {
    const content = fs.readFileSync(fullPath, "utf-8");
    const lines = content.split("\n");

    res.json({
      workspace,
      file: filepath,
      size: content.length,
      lines: lines.length,
      content,
      preview: lines.slice(0, 20).join("\n") + (lines.length > 20 ? "\n... (" + (lines.length - 20) + " linhas omitidas)" : "")
    });
  } catch (error) {
    res.json({ error: "Erro ao ler arquivo", details: error?.message });
  }
});

//
// ==============================
// � ROTA: PREVIEW DO AGENTE (DIFF VISUAL)
// ==============================
app.post("/agent/preview", async (req, res) => {
  // 🔥 validação de entrada
  if (!req.body || !req.body.workspace || !req.body.instruction) {
    return res.json({
      error: "Envie { workspace, instruction }"
    });
  }

  const { workspace, instruction } = req.body;
  const basePath = path.join(BASE_DIR, workspace);

  if (!fs.existsSync(basePath)) {
    return res.json({ error: "Workspace não existe" });
  }

  // 🔥 NOVO: ler arquivos existentes
  const filesContext = readWorkspaceFiles(basePath);

  // 🔥 Analisar projeto para contexto adicional
  let projectContext = "";
  try {
    const summary = getProjectSummary(basePath);
    const deps = getDependencies(basePath);
    
    projectContext = `
ANÁLISE DO PROJETO:
- Tipo: ${summary.type}
- Total de arquivos: ${summary.files.total}
- Tipos: ${JSON.stringify(summary.files.byType, null, 2)}
- Com testes: ${summary.hasTests ? "✅ Sim" : "❌ Não"}
- Com documentação: ${summary.hasDocs ? "✅ Sim" : "❌ Não"}
- Com CI/CD: ${summary.hasCI ? "✅ Sim" : "❌ Não"}

ESTRUTURA DO PROJETO:
${summary.structure}

DEPENDÊNCIAS:
${JSON.stringify(deps, null, 2)}
`;
  } catch (e) {
    console.error("Erro ao analisar projeto:", e.message);
  }

  // 🔥 Enviar instrução + contexto + análise
  let plan;
  try {
    plan = await runAgent(client, `
INSTRUÇÃO:
${instruction}

CONTEXTO DO PROJETO:
${projectContext}

ARQUIVOS ATUAIS:
${filesContext}
`);
  } catch (error) {
    console.error("Erro interno ao executar agente:", error);
    return res.json({ error: "Erro interno ao executar agente", details: error?.message || String(error) });
  }

  if (plan.error) return res.json(plan);

  // 🔥 validar plano
  if (!plan.steps || !Array.isArray(plan.steps)) {
    return res.json({ error: "Plano inválido da IA", plan });
  }

  // 🔥 GERAR DIFFS PARA PREVIEW
  const preview = [];
  for (const step of plan.steps) {
    if (step.action === "create_file") {
      preview.push({
        action: "create_file",
        path: step.path,
        diff: `--- ${step.path} (não existe)\n+++ ${step.path} (novo)\n\n${step.content.split('\n').map(line => `+ ${line}`).join('\n')}`
      });
    } else if (step.action === "patch_file") {
      const filePath = path.join(basePath, step.path);
      if (fs.existsSync(filePath)) {
        const oldContent = fs.readFileSync(filePath, "utf-8");
        const newContent = applyPatch(oldContent, step);
        const diff = generateDiff(oldContent, newContent, step.path);
        preview.push({
          action: "patch_file",
          path: step.path,
          diff
        });
      } else {
        preview.push({
          action: "patch_file",
          path: step.path,
          error: "Arquivo não encontrado"
        });
      }
    } else if (step.action === "delete_file") {
      preview.push({
        action: "delete_file",
        path: step.path,
        diff: `--- ${step.path} (será deletado)\n+++ ${step.path} (removido)`
      });
    } else {
      preview.push(step);
    }
  }

  // 🔥 LOG PROMPT
  logPrompt(workspace, instruction, plan);

  res.json({
    workspace,
    instruction,
    plan,
    preview,
    timestamp: new Date().toISOString()
  });
});

//
// ==============================
// 🧠 ROTA: EXECUTAR PLANO APROVADO
// ==============================
app.post("/agent/execute", async (req, res) => {
  // 🔥 validação de entrada
  if (!req.body || !req.body.workspace || !req.body.plan) {
    return res.json({
      error: "Envie { workspace, plan }"
    });
  }

  const { workspace, plan } = req.body;
  const basePath = path.join(BASE_DIR, workspace);

  if (!fs.existsSync(basePath)) {
    return res.json({ error: "Workspace não existe" });
  }

  if (!plan.steps || !Array.isArray(plan.steps)) {
    return res.json({ error: "Plano inválido" });
  }

  // 🔥 CRIAR SNAPSHOT PARA ROLLBACK
  const snapshotDir = path.join(basePath, 'snapshots', new Date().toISOString().replace(/[:.]/g, '-'));
  fs.mkdirSync(snapshotDir, { recursive: true });
  
  function createSnapshot(filePath) {
    const relativePath = path.relative(basePath, filePath);
    const snapshotPath = path.join(snapshotDir, relativePath);
    fs.mkdirSync(path.dirname(snapshotPath), { recursive: true });
    fs.copyFileSync(filePath, snapshotPath);
  }

  // 🔁 Executar plano
  const results = [];
  for (const step of plan.steps) {
    try {
      // 📁 criar arquivo
      if (step.action === "create_file") {
        const filePath = path.join(basePath, step.path);

        if (!isPathSafe(basePath, step.path)) {
          results.push({ step, error: "Path traversal detectado" });
          continue;
        }

        if (!step.content || typeof step.content !== "string") {
          results.push({ step, error: "Conteúdo inválido" });
          continue;
        }

        // 🔥 Snapshot se arquivo existir
        if (fs.existsSync(filePath)) {
          createSnapshot(filePath);
        }

        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, step.content);
        logAction(workspace, "create_file", { path: step.path, size: step.content.length });
        results.push({ step, success: true });
      }

      // 🔥 PATCH AVANÇADO
      else if (step.action === "patch_file") {
        const filePath = path.join(basePath, step.path);

        if (!isPathSafe(basePath, step.path)) {
          results.push({ step, error: "Path traversal detectado" });
          continue;
        }

        if (!fs.existsSync(filePath)) {
          results.push({ step, error: "Arquivo não encontrado" });
          continue;
        }

        // 🔥 Snapshot
        createSnapshot(filePath);

        let content = fs.readFileSync(filePath, "utf-8");
        const newContent = applyPatch(content, step);
        fs.writeFileSync(filePath, newContent);
        logAction(workspace, "patch_file", { path: step.path, changes: Math.abs(newContent.length - content.length) });
        results.push({ step, success: true });
      }

      // 🗑️ DELETE FILE
      else if (step.action === "delete_file") {
        const filePath = path.join(basePath, step.path);

        if (!isPathSafe(basePath, step.path)) {
          results.push({ step, error: "Path traversal detectado" });
          continue;
        }

        if (!fs.existsSync(filePath)) {
          results.push({ step, error: "Arquivo/pasta não encontrado" });
          continue;
        }

        // 🔥 Snapshot
        createSnapshot(filePath);

        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
          fs.rmSync(filePath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(filePath);
        }
        logAction(workspace, "delete_file", { path: step.path, type: stats.isDirectory() ? "directory" : "file" });
        results.push({ step, success: true });
      }

      // ✏️ RENAME FILE
      else if (step.action === "rename_file") {
        const oldPath = path.join(basePath, step.oldPath);
        const newPath = path.join(basePath, step.newPath);

        if (!isPathSafe(basePath, step.oldPath) || !isPathSafe(basePath, step.newPath)) {
          results.push({ step, error: "Path traversal detectado" });
          continue;
        }

        if (!fs.existsSync(oldPath)) {
          results.push({ step, error: "Arquivo não encontrado" });
          continue;
        }

        // 🔥 Snapshot
        createSnapshot(oldPath);

        fs.mkdirSync(path.dirname(newPath), { recursive: true });
        fs.renameSync(oldPath, newPath);
        logAction(workspace, "rename_file", { oldPath: step.oldPath, newPath: step.newPath });
        results.push({ step, success: true });
      }

      // 📁 CREATE FOLDER
      else if (step.action === "create_folder" || step.action === "mkdir") {
        const folderPath = path.join(basePath, step.path);

        if (!isPathSafe(basePath, step.path)) {
          results.push({ step, error: "Path traversal detectado" });
          continue;
        }

        fs.mkdirSync(folderPath, { recursive: true });
        logAction(workspace, "create_folder", { path: step.path });
        results.push({ step, success: true });
      }

      // ⚙️ Executar comandos (ASSÍNCRONO)
      else if (step.action === "run_command") {
        if (!step.command || typeof step.command !== "string") {
          results.push({ step, error: "Comando inválido" });
          continue;
        }

        // 🔥 whitelist de comandos permitidos (expandida)
        const allowed = [
          "npm install", "npm init", "npm run", "npm start", "npm test",
          "yarn add", "yarn install",
          "git init", "git add", "git commit", "git status", "git log",
          "node", "python", "pip install"
        ];
        const isAllowed = allowed.some(cmd => step.command.toLowerCase().startsWith(cmd));

        if (!isAllowed) {
          results.push({ step, error: "Comando não permitido" });
          continue;
        }

        // 🔥 bloquear comandos perigosos
        if (
          step.command.includes("&&") ||
          step.command.includes("|") ||
          step.command.includes(";") ||
          step.command.includes(">") ||
          step.command.includes("<") ||
          step.command.includes("rm") ||
          step.command.includes("del")
        ) {
          results.push({ step, error: "Comando perigoso bloqueado" });
          continue;
        }

        // 🔥 Executar assíncrono
        await new Promise((resolve, reject) => {
          const child = spawn(step.command, [], {
            cwd: basePath,
            shell: true,
            stdio: ['pipe', 'pipe', 'pipe']
          });

          let stdout = '';
          let stderr = '';

          child.stdout.on('data', (data) => { stdout += data.toString(); });
          child.stderr.on('data', (data) => { stderr += data.toString(); });

          child.on('close', (code) => {
            if (code === 0) {
              logAction(workspace, "run_command", { command: step.command, output: stdout });
              results.push({ step, success: true, output: stdout });
              resolve();
            } else {
              results.push({ step, error: `Comando falhou: ${stderr}` });
              reject(new Error(stderr));
            }
          });

          child.on('error', (err) => {
            results.push({ step, error: err.message });
            reject(err);
          });
        });
      }

      else {
        results.push({ step, error: "Ação desconhecida" });
      }

    } catch (error) {
      results.push({ step, error: error.message });
    }
  }

  res.json({
    message: "✅ Plano executado",
    workspace,
    results,
    timestamp: new Date().toISOString(),
    snapshot: snapshotDir
  });
});

app.post("/agent", async (req, res) => {

  // 🔥 validação de entrada
  if (!req.body || !req.body.workspace || !req.body.instruction) {
    return res.json({
      error: "Envie { workspace, instruction }"
    });
  }

  const { workspace, instruction } = req.body;

  const basePath = path.join(BASE_DIR, workspace);

  if (!fs.existsSync(basePath)) {
    return res.json({ error: "Workspace não existe" });
  }

  // 🔥 NOVO: ler arquivos existentes
  const filesContext = readWorkspaceFiles(basePath);

  // 🔥 Analisar projeto para contexto adicional
  let projectContext = "";
  try {
    const summary = getProjectSummary(basePath);
    const deps = getDependencies(basePath);
    
    projectContext = `
ANÁLISE DO PROJETO:
- Tipo: ${summary.type}
- Total de arquivos: ${summary.files.total}
- Tipos: ${JSON.stringify(summary.files.byType, null, 2)}
- Com testes: ${summary.hasTests ? "✅ Sim" : "❌ Não"}
- Com documentação: ${summary.hasDocs ? "✅ Sim" : "❌ Não"}
- Com CI/CD: ${summary.hasCI ? "✅ Sim" : "❌ Não"}

ESTRUTURA DO PROJETO:
${summary.structure}

DEPENDÊNCIAS:
${JSON.stringify(deps, null, 2)}
`;
  } catch (e) {
    console.error("Erro ao analisar projeto:", e.message);
  }

  // 🔥 Enviar instrução + contexto + análise
  let plan;
  try {
    plan = await runAgent(client, `
INSTRUÇÃO:
${instruction}

CONTEXTO DO PROJETO:
${projectContext}

ARQUIVOS ATUAIS:
${filesContext}
`);
  } catch (error) {
    console.error("Erro interno ao executar agente:", error);
    return res.json({ error: "Erro interno ao executar agente", details: error?.message || String(error) });
  }

  if (plan.error) return res.json(plan);

  // 🔥 validar plano
  if (!plan.steps || !Array.isArray(plan.steps)) {
    return res.json({ error: "Plano inválido da IA", plan });
  }

  // 🔁 Executar plano
 for (const step of plan.steps) {

  // 📁 criar arquivo
// 📁 criar arquivo (seguro)
if (step.action === "create_file") {
  const filePath = path.join(basePath, step.path);

  if (!isPathSafe(basePath, step.path)) {
    console.log("⚠️ Path inválido bloqueado (path traversal):", step.path);
    continue;
  }

  if (!step.content || typeof step.content !== "string") {
    console.log("Conteúdo inválido para create_file:", step);
    continue;
  }

  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, step.content);
    console.log("✅ Arquivo criado:", step.path);
  } catch (error) {
    console.error("❌ Erro ao criar arquivo:", step.path, error.message);
  }
}

 
 // 🔥 PATCH AVANÇADO
if (step.action === "patch_file") {
  const filePath = path.join(basePath, step.path);

  if (!isPathSafe(basePath, step.path)) {
    console.log("⚠️ Path inválido bloqueado (path traversal):", step.path);
    continue;
  }

  if (!fs.existsSync(filePath)) {
    console.log("❌ Arquivo não encontrado:", step.path);
    continue;
  }

  try {
    let content = fs.readFileSync(filePath, "utf-8");
    const newContent = applyPatch(content, step);
    fs.writeFileSync(filePath, newContent);
    console.log("✅ Arquivo editado:", step.path);
  } catch (error) {
    console.error("❌ Erro ao editar arquivo:", step.path, error.message);
  }
}

// 🗑️ DELETE FILE (nova ação)
if (step.action === "delete_file") {
  const filePath = path.join(basePath, step.path);

  if (!isPathSafe(basePath, step.path)) {
    console.log("⚠️ Path inválido bloqueado (path traversal):", step.path);
    continue;
  }

  if (!fs.existsSync(filePath)) {
    console.log("❌ Arquivo/pasta não encontrado:", step.path);
    continue;
  }

  try {
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      fs.rmSync(filePath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(filePath);
    }
    console.log("✅ Deletado:", step.path);
  } catch (error) {
    console.error("❌ Erro ao deletar:", step.path, error.message);
  }
}

// ✏️ RENAME FILE (nova ação)
if (step.action === "rename_file") {
  const oldPath = path.join(basePath, step.oldPath);
  const newPath = path.join(basePath, step.newPath);

  if (!isPathSafe(basePath, step.oldPath) || !isPathSafe(basePath, step.newPath)) {
    console.log("⚠️ Path inválido bloqueado (path traversal)");
    continue;
  }

  if (!fs.existsSync(oldPath)) {
    console.log("❌ Arquivo não encontrado:", step.oldPath);
    continue;
  }

  try {
    fs.mkdirSync(path.dirname(newPath), { recursive: true });
    fs.renameSync(oldPath, newPath);
    console.log("✅ Renomeado de", step.oldPath, "para", step.newPath);
  } catch (error) {
    console.error("❌ Erro ao renomear:", error.message);
  }
}

// 📁 CREATE FOLDER (nova ação)
if (step.action === "create_folder" || step.action === "mkdir") {
  const folderPath = path.join(basePath, step.path);

  if (!isPathSafe(basePath, step.path)) {
    console.log("⚠️ Path inválido bloqueado (path traversal):", step.path);
    continue;
  }

  try {
    fs.mkdirSync(folderPath, { recursive: true });
    console.log("✅ Pasta criada:", step.path);
  } catch (error) {
    console.error("❌ Erro ao criar pasta:", error.message);
  }
}
    // ⚙️ Executar comandos
    if (step.action === "run_command") {

      if (!step.command || typeof step.command !== "string") {
        console.log("❌ Comando inválido:", step.command);
        continue;
      }

      // 🔥 whitelist de comandos permitidos (expandida)
      const allowed = [
        "npm install",
        "npm init",
        "npm run",
        "npm start",
        "npm test",
        "node",
        "yarn add",
        "yarn install",
        "git init",
        "git add",
        "git commit"
      ];
      const isAllowed = allowed.some(cmd => step.command.toLowerCase().startsWith(cmd));

      if (!isAllowed) {
        console.log("❌ Comando bloqueado (não está na whitelist):", step.command);
        continue;
      }

      // 🔥 bloquear comandos perigosos
      if (
        step.command.includes("&&") ||
        step.command.includes("|") ||
        step.command.includes(";") ||
        step.command.includes(">") ||
        step.command.includes("<")
      ) {
        console.log("❌ Comando perigoso bloqueado (operadores não permitidos):", step.command);
        continue;
      }

      try {
        console.log("⚡ Executando comando:", step.command);
        execSync(step.command, {
          cwd: basePath,
          stdio: "inherit"
        });
        console.log("✅ Comando executado com sucesso");
      } catch (err) {
        console.error("❌ Erro ao executar comando:", step.command, err.message);
      }
    }
  }

  res.json({
    message: "✅ Projeto modificado com sucesso",
    summary: {
      steps_executed: plan.steps.length,
      workspace: workspace,
      timestamp: new Date().toISOString()
    },
    plan
  });
});

//
// ==============================
// 🧠 ROTA: AGENTE AUTÔNOMO (LEGACY - REDIRECIONA PARA PREVIEW)
// ==============================
app.post("/agent", async (req, res) => {
  return res.json({
    error: "Use /agent/preview primeiro para ver o plano, depois /agent/execute para executar"
  });
});

//
// ==============================
// 🔄 ROTA: ROLLBACK
// ==============================
app.post("/rollback", (req, res) => {
  const { workspace, snapshot } = req.body;
  
  if (!workspace || !snapshot) {
    return res.json({ error: "Envie { workspace, snapshot }" });
  }
  
  const basePath = path.join(BASE_DIR, workspace);
  const snapshotPath = path.join(basePath, snapshot);
  
  if (!fs.existsSync(snapshotPath)) {
    return res.json({ error: "Snapshot não encontrado" });
  }
  
  try {
    // Restaurar arquivos do snapshot
    function restoreFromSnapshot(dir) {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const relativePath = path.relative(snapshotPath, itemPath);
        const targetPath = path.join(basePath, relativePath);
        
        const stats = fs.statSync(itemPath);
        if (stats.isDirectory()) {
          fs.mkdirSync(targetPath, { recursive: true });
          restoreFromSnapshot(itemPath);
        } else {
          fs.mkdirSync(path.dirname(targetPath), { recursive: true });
          fs.copyFileSync(itemPath, targetPath);
        }
      }
    }
    
    restoreFromSnapshot(snapshotPath);
    
    logAction(workspace, "rollback", { snapshot });
    
    res.json({ 
      message: "✅ Rollback realizado com sucesso",
      workspace,
      snapshot
    });
  } catch (error) {
    res.json({ error: "Erro ao fazer rollback", details: error.message });
  }
});

//
// ==============================
// 📊 ROTA: LOGS
// ==============================
app.get("/logs", (req, res) => {
  const { workspace } = req.query;
  
  if (!workspace) {
    return res.json({ error: "Envie ?workspace=nome" });
  }
  
  const logDir = path.join(BASE_DIR, workspace, 'logs');
  
  if (!fs.existsSync(logDir)) {
    return res.json({ logs: [] });
  }
  
  try {
    const actionsLog = fs.existsSync(path.join(logDir, 'actions.log')) 
      ? fs.readFileSync(path.join(logDir, 'actions.log'), 'utf-8').split('\n').filter(line => line.trim())
      : [];
      
    const promptsLog = fs.existsSync(path.join(logDir, 'prompts.log'))
      ? fs.readFileSync(path.join(logDir, 'prompts.log'), 'utf-8').split('\n').filter(line => line.trim())
      : [];
    
    res.json({
      workspace,
      logs: {
        actions: actionsLog.map(line => JSON.parse(line)),
        prompts: promptsLog.map(line => JSON.parse(line))
      }
    });
  } catch (error) {
    res.json({ error: "Erro ao ler logs", details: error.message });
  }
});

//
// ==============================
// 🚀 INICIAR SERVIDOR
// ==============================
app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

ensurePortFree(SERVER_PORT);
app.listen(SERVER_PORT, () => {
  console.log(`API rodando em http://localhost:${SERVER_PORT}`);
});