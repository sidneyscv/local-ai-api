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
