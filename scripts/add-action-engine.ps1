# ============================================
# ⚙️ ADD ACTION ENGINE
# ============================================

Write-Host ""
Write-Host "⚙️ Creating Action Engine..."
Write-Host ""

$root = Get-Location

# ============================================
# CREATE AGENT FOLDER
# ============================================

New-Item `
  -ItemType Directory `
  -Force `
  -Path "$root/apps/api/src/agent" | Out-Null

# ============================================
# ACTION EXECUTOR
# ============================================

@"
import fileService from "../services/file.service";
import terminalService from "../services/terminal.service";

class ActionExecutor {

  async execute(actions: any[]) {

    const results = [];

    for (const action of actions) {

      try {

        switch (action.type) {

          case "create_file":

            results.push(
              fileService.createFile(
                action.path,
                action.content || ""
              )
            );

            break;

          case "delete_file":

            results.push(
              fileService.deleteFile(
                action.path
              )
            );

            break;

          case "run_command":

            results.push(
              await terminalService.execute(
                action.command
              )
            );

            break;

          default:

            results.push({
              success: false,
              error:
                "Unknown action type: " +
                action.type
            });

        }

      } catch (error: any) {

        results.push({
          success: false,
          error: error.message
        });

      }

    }

    return results;
  }
}

export default new ActionExecutor();
"@ | Set-Content `
"$root/apps/api/src/agent/action-executor.ts"

# ============================================
# ACTION ROUTE
# ============================================

@"
import { Router } from "express";

import actionExecutor
from "../agent/action-executor";

const router = Router();

router.post("/execute", async (req, res) => {

  try {

    const { actions } = req.body;

    const results =
      await actionExecutor.execute(actions);

    res.json({
      success: true,
      results
    });

  } catch (error: any) {

    res.status(500).json({
      success: false,
      error: error.message
    });

  }

});

export default router;
"@ | Set-Content `
"$root/apps/api/src/routes/action.routes.ts"

# ============================================
# UPDATE APP
# ============================================

$appPath =
"$root/apps/api/src/app.ts"

$appContent =
Get-Content $appPath -Raw

if ($appContent -notmatch "actionRoutes") {

  $appContent =
  $appContent.Replace(
'import promptRoutes from "./routes/prompt.routes";',
'import promptRoutes from "./routes/prompt.routes";
import actionRoutes from "./routes/action.routes";'
  )

  $appContent =
  $appContent.Replace(
'app.use("/prompt", promptRoutes);',
'app.use("/prompt", promptRoutes);
app.use("/actions", actionRoutes);'
  )

  Set-Content `
    $appPath `
    $appContent
}

# ============================================
# DONE
# ============================================

Write-Host ""
Write-Host "✅ Action Engine created!"
Write-Host ""