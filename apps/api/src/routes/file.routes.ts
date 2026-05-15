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
