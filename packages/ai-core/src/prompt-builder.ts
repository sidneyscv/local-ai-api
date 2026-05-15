import fs from "fs";
import path from "path";

class PromptBuilder {

  readPackageJson(workspacePath: string) {

    const packageJsonPath =
      path.join(workspacePath, "package.json");

    if (!fs.existsSync(packageJsonPath)) {
      return null;
    }

    return JSON.parse(
      fs.readFileSync(packageJsonPath, "utf-8")
    );
  }

  detectFramework(packageJson: any) {

    if (!packageJson) {
      return "unknown";
    }

    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };

    if (deps.react) {
      return "react";
    }

    if (deps.next) {
      return "nextjs";
    }

    if (deps.express) {
      return "express";
    }

    if (deps.vue) {
      return "vue";
    }

    return "node";
  }

  getProjectStructure(
    dir: string,
    depth = 2
  ) {

    if (depth <= 0) {
      return [];
    }

    if (!fs.existsSync(dir)) {
      return [];
    }

    const entries =
      fs.readdirSync(dir);

    return entries.map(entry => {

      const fullPath =
        path.join(dir, entry);

      const isDirectory =
        fs.statSync(fullPath).isDirectory();

      return {
        name: entry,
        type: isDirectory
          ? "folder"
          : "file",

        children: isDirectory
          ? this.getProjectStructure(
              fullPath,
              depth - 1
            )
          : []
      };

    });

  }

  buildContext(workspacePath: string) {

    const packageJson =
      this.readPackageJson(workspacePath);

    const framework =
      this.detectFramework(packageJson);

    const structure =
      this.getProjectStructure(workspacePath);

    return {
      framework,
      packageJson,
      structure
    };
  }

  buildPrompt(
    workspacePath: string,
    userPrompt: string
  ) {

    const context =
      this.buildContext(workspacePath);

    return [
      "You are an advanced software engineering assistant.",
      "",
      "Framework:",
      context.framework,
      "",
      "Project structure:",
      JSON.stringify(
        context.structure,
        null,
        2
      ),
      "",
      "User request:",
      userPrompt,
      "",
      "Generate:",
      "- implementation plan",
      "- file changes",
      "- commands",
      "- code modifications"
    ].join("\n");

  }

}

export default new PromptBuilder();