# ============================================
# 🚀 LOCAL AI AGENT BOOTSTRAP
# ============================================

Write-Host ""
Write-Host "🚀 Bootstrapping Local AI Agent..."
Write-Host ""

# ============================================
# ROOT
# ============================================

$root = Get-Location

# ============================================
# CREATE FOLDERS
# ============================================

$folders = @(
    "apps/api/src/routes",
    "apps/api/src/services",
    "apps/api/src/middleware",
    "apps/api/src/agent",
    "apps/api/src/utils",

    "apps/web/src/components",
    "apps/web/src/pages",
    "apps/web/src/hooks",

    "apps/desktop",

    "packages/ai-core/src",
    "packages/shared/src",
    "packages/ui/src/components",
    "packages/database/src",

    "configs/typescript",
    "configs/eslint",
    "configs/docker",

    "scripts",
    "docs",
    "logs",
    "workspaces",
    "snapshots"
)

foreach ($folder in $folders) {
    New-Item `
        -ItemType Directory `
        -Force `
        -Path "$root/$folder" | Out-Null
}

# ============================================
# PACKAGE.JSON
# ============================================

@"
{
  "name": "local-ai-agent",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "tsx apps/api/src/server.ts",
    "start": "tsx apps/api/src/server.ts"
  }
}
"@ | Set-Content "$root/package.json"

# ============================================
# TSCONFIG
# ============================================

@"
{
  "extends": "./configs/typescript/tsconfig.base.json"
}
"@ | Set-Content "$root/tsconfig.json"

@"
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
"@ | Set-Content "$root/configs/typescript/tsconfig.base.json"

# ============================================
# GITIGNORE
# ============================================

@"
node_modules/
dist/
.env
logs/
workspaces/
snapshots/
*.zip
"@ | Set-Content "$root/.gitignore"

# ============================================
# APP
# ============================================

@"
import express from "express";
import workspaceRoutes from "./routes/workspace.routes";
import fileRoutes from "./routes/file.routes";

const app = express();

app.use(express.json());

app.get("/", (_, res) => {
  res.json({
    status: "ok",
    name: "Local AI Agent"
  });
});

app.use("/workspace", workspaceRoutes);
app.use("/file", fileRoutes);

export default app;
"@ | Set-Content "$root/apps/api/src/app.ts"

# ============================================
# SERVER
# ============================================

@"
import app from "./app";

const PORT = 3000;

app.listen(PORT, () => {
  console.log(
    "🚀 Local AI Agent API running on port " + PORT
  );
});
"@ | Set-Content "$root/apps/api/src/server.ts"

# ============================================
# WORKSPACE ROUTES
# ============================================

@"
import { Router } from "express";
import workspaceService from "../services/workspace.service";

const router = Router();

router.post("/", (req, res) => {
  const { name } = req.body;

  const workspace =
    workspaceService.createWorkspace(name);

  res.json({
    success: true,
    workspace
  });
});

export default router;
"@ | Set-Content "$root/apps/api/src/routes/workspace.routes.ts"

# ============================================
# FILE ROUTES
# ============================================

@"
import { Router } from "express";
import fileService from "../services/file.service";

const router = Router();

router.post("/create", (req, res) => {
  const { path, content } = req.body;

  const result =
    fileService.createFile(path, content);

  res.json(result);
});

export default router;
"@ | Set-Content "$root/apps/api/src/routes/file.routes.ts"

# ============================================
# WORKSPACE SERVICE
# ============================================

@"
import fs from "fs";
import path from "path";

class WorkspaceService {
  basePath: string;

  constructor() {
    this.basePath = path.join(
      path.resolve(__dirname, "../../../../"),
      "workspaces"
    );

    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, {
        recursive: true
      });
    }
  }

  createWorkspace(name: string) {
    const workspacePath =
      path.join(this.basePath, name);

    if (!fs.existsSync(workspacePath)) {
      fs.mkdirSync(workspacePath, {
        recursive: true
      });
    }

    return workspacePath;
  }
}

export default new WorkspaceService();
"@ | Set-Content "$root/apps/api/src/services/workspace.service.ts"

# ============================================
# FILE SERVICE
# ============================================

@"
import fs from "fs";
import path from "path";

class FileService {
  createFile(filePath: string, content = "") {
    const dir = path.dirname(filePath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, {
        recursive: true
      });
    }

    fs.writeFileSync(filePath, content);

    return {
      success: true,
      path: filePath
    };
  }

  readFile(filePath: string) {
    return fs.readFileSync(filePath, "utf-8");
  }

  deleteFile(filePath: string) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return {
      success: true
    };
  }
}

export default new FileService();
"@ | Set-Content "$root/apps/api/src/services/file.service.ts"

# ============================================
# TERMINAL SERVICE
# ============================================

@"
class TerminalService {
  allowedCommands = [
    "npm",
    "node",
    "git",
    "python",
    "pip"
  ];

  isAllowed(command: string) {
    return this.allowedCommands.some(cmd =>
      command.startsWith(cmd)
    );
  }

  async execute(command: string) {
    if (!this.isAllowed(command)) {
      throw new Error("Command not allowed");
    }

    return {
      success: true,
      command
    };
  }
}

export default new TerminalService();
"@ | Set-Content "$root/apps/api/src/services/terminal.service.ts"

# ============================================
# PROMPT BUILDER
# ============================================

@"
class PromptBuilder {
  build(projectContext: string, userPrompt: string) {
    return `
You are an advanced software engineering assistant.

Project context:
${projectContext}

User request:
${userPrompt}

Generate:
- implementation plan
- file changes
- commands
- code modifications
`;
  }
}

export default new PromptBuilder();
"@ | Set-Content "$root/packages/ai-core/src/prompt-builder.ts"

# ============================================
# WEB APP
# ============================================

@"
import React from "react";

export default function App() {
  return (
    <div>
      <h1>🚀 Local AI Agent</h1>
    </div>
  );
}
"@ | Set-Content "$root/apps/web/src/App.tsx"

# ============================================
# INSTALL DEPENDENCIES
# ============================================

Write-Host ""
Write-Host "📦 Installing dependencies..."
Write-Host ""

npm install express react react-dom

npm install -D `
typescript `
ts-node `
tsx `
nodemon `
@types/node `
@types/express `
@types/react `
@types/react-dom

# ============================================
# DONE
# ============================================

Write-Host ""
Write-Host "✅ Bootstrap completed!"
Write-Host ""

Write-Host "🚀 Run:"
Write-Host "npm run dev"
Write-Host ""