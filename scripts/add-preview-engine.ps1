# ============================================
# 👁️ ADD PREVIEW ENGINE
# ============================================

Write-Host ""
Write-Host "👁️ Creating Preview Engine..."
Write-Host ""

$root = Get-Location

# ============================================
# PREVIEW SERVICE
# ============================================

@"
import fs from "fs";

class PreviewService {

  preview(actions: any[]) {

    return actions.map(action => {

      switch (action.type) {

        case "create_file":

          return {
            type: action.type,
            path: action.path,
            contentPreview:
              action.content
                ?.substring(0, 500)
          };

        case "delete_file":

          return {
            type: action.type,
            path: action.path
          };

        case "run_command":

          return {
            type: action.type,
            command: action.command
          };

        default:

          return {
            type: action.type,
            warning: "Unknown action"
          };

      }

    });

  }

}

export default new PreviewService();
"@ | Set-Content `
"$root/apps/api/src/services/preview.service.ts"

# ============================================
# PREVIEW ROUTE
# ============================================

@"
import { Router } from "express";

import previewService
from "../services/preview.service";

const router = Router();

router.post("/", (req, res) => {

  const { actions } = req.body;

  const preview =
    previewService.preview(actions);

  res.json({
    success: true,
    preview
  });

});

export default router;
"@ | Set-Content `
"$root/apps/api/src/routes/preview.routes.ts"

# ============================================
# UPDATE APP
# ============================================

$appPath =
"$root/apps/api/src/app.ts"

$appContent =
Get-Content $appPath -Raw

if ($appContent -notmatch "previewRoutes") {

  $appContent =
  $appContent.Replace(
'import actionRoutes from "./routes/action.routes";',
'import actionRoutes from "./routes/action.routes";
import previewRoutes from "./routes/preview.routes";'
  )

  $appContent =
  $appContent.Replace(
'app.use("/actions", actionRoutes);',
'app.use("/actions", actionRoutes);
app.use("/preview", previewRoutes);'
  )

  Set-Content `
    $appPath `
    $appContent
}

# ============================================
# DONE
# ============================================

Write-Host ""
Write-Host "✅ Preview Engine created!"
Write-Host ""