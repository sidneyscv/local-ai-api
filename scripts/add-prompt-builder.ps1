# ============================================
# 🧠 ADD PROMPT BUILDER
# ============================================

Write-Host ""
Write-Host "🧠 Creating Prompt Builder..."
Write-Host ""

$root = Get-Location

# ============================================
# CREATE AI-CORE FILES
# ============================================

New-Item `
  -ItemType Directory `
  -Force `
  -Path "$root/packages/ai-core/src" | Out-Null

# ============================================
# PROMPT BUILDER
# ============================================

@"
import fs from "fs";
import path from "path";

class PromptBuilder {

  readPackageJson(workspacePath: string) {

    const packageJsonPath =
      path.join(workspacePath, "package.json");

    if (!fs.existsSync(packageJsonPath)) {
      return null;
    }

    return JSON.parse(
      fs.readFileSync(packageJsonPath, "utf-8")
    );
  }

  detectFramework(packageJson: any) {

    if (!packageJson) {
      return "unknown";
    }

    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };

    if (deps.react) {
      return "react";
    }

    if (deps.next) {
      return "nextjs";
    }

    if (deps.express) {
      return "express";
    }

    if (deps.vue) {
      return "vue";
    }

    return "node";
  }

  getProjectStructure(dir: string, depth = 2) {

    if (depth <= 0) {
      return [];
    }

    if (!fs.existsSync(dir)) {
      return [];
    }

    const entries = fs.readdirSync(dir);

    return entries.map(entry => {

      const fullPath =
        path.join(dir, entry);

      const isDirectory =
        fs.statSync(fullPath).isDirectory();

      return {
        name: entry,
        type: isDirectory ? "folder" : "file",
        children: isDirectory
          ? this.getProjectStructure(
              fullPath,
              depth - 1
            )
          : []
      };

    });

  }

  buildContext(workspacePath: string) {

    const packageJson =
      this.readPackageJson(workspacePath);

    const framework =
      this.detectFramework(packageJson);

    const structure =
      this.getProjectStructure(workspacePath);

    return {
      framework,
      packageJson,
      structure
    };
  }

  buildPrompt(
    workspacePath: string,
    userPrompt: string
  ) {

    const context =
      this.buildContext(workspacePath);

    return `
You are an advanced software engineering assistant.

Framework:
${context.framework}

Project structure:
${JSON.stringify(context.structure, null, 2)}

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
"@ | Set-Content `
"$root/packages/ai-core/src/prompt-builder.ts"

# ============================================
# PROMPT ROUTE
# ============================================

New-Item `
  -ItemType Directory `
  -Force `
  -Path "$root/apps/api/src/routes" | Out-Null

@"
import { Router } from "express";
import path from "path";

import promptBuilder from "../../../../packages/ai-core/src/prompt-builder";

const router = Router();

router.post("/generate", (req, res) => {

  const {
    workspace,
    prompt
  } = req.body;

  const workspacePath =
    path.join(
      process.cwd(),
      "workspaces",
      workspace
    );

  const result =
    promptBuilder.buildPrompt(
      workspacePath,
      prompt
    );

  res.json({
    success: true,
    prompt: result
  });

});

export default router;
"@ | Set-Content `
"$root/apps/api/src/routes/prompt.routes.ts"

# ============================================
# UPDATE APP
# ============================================

$appPath =
"$root/apps/api/src/app.ts"

$appContent =
Get-Content $appPath -Raw

if ($appContent -notmatch "promptRoutes") {

  $appContent =
  $appContent.Replace(
'import terminalRoutes from "./routes/terminal.routes";',
'import terminalRoutes from "./routes/terminal.routes";
import promptRoutes from "./routes/prompt.routes";'
  )

  $appContent =
  $appContent.Replace(
'app.use("/terminal", terminalRoutes);',
'app.use("/terminal", terminalRoutes);
app.use("/prompt", promptRoutes);'
  )

  Set-Content `
    $appPath `
    $appContent
}

# ============================================
# DONE
# ============================================

Write-Host ""
Write-Host "✅ Prompt Builder created!"
Write-Host ""