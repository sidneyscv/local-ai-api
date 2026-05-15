import { Router } from "express";
import terminalService from "../services/terminal.service";

const router = Router();

router.post("/execute", async (req, res) => {

  try {

    const { command } = req.body;

    const result =
      await terminalService.execute(command);

    res.json(result);

  } catch (error: any) {

    res.status(500).json({
      success: false,
      error: error.message
    });

  }

});

export default router;