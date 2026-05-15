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
