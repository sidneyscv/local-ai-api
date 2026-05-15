import express from "express";
import workspaceRoutes from "./routes/workspace.routes";
import fileRoutes from "./routes/file.routes";
import terminalRoutes from "./routes/terminal.routes";
import promptRoutes from "./routes/prompt.routes";
import actionRoutes from "./routes/action.routes";
import previewRoutes from "./routes/preview.routes";


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
app.use("/terminal", terminalRoutes);
app.use("/prompt", promptRoutes);
app.use("/actions", actionRoutes);
app.use("/preview", previewRoutes);

export default app;



