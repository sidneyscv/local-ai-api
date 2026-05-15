import fs from "fs";
import path from "path";

class WorkspaceService {
  basePath: string;

  constructor() {
    this.basePath = path.join(
      path.resolve(__dirname, "../../../../"),
      "workspaces"
    );

    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, {
        recursive: true
      });
    }
  }

  createWorkspace(name: string) {
    const workspacePath =
      path.join(this.basePath, name);

    if (!fs.existsSync(workspacePath)) {
      fs.mkdirSync(workspacePath, {
        recursive: true
      });
    }

    return workspacePath;
  }
}

export default new WorkspaceService();
