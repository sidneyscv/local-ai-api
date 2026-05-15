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
