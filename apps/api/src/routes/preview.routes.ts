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
