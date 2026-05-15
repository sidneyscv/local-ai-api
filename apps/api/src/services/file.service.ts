import fs from "fs";
import path from "path";

class FileService {
  createFile(filePath: string, content = "") {
    const dir = path.dirname(filePath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, {
        recursive: true
      });
    }

    fs.writeFileSync(filePath, content);

    return {
      success: true,
      path: filePath
    };
  }

  readFile(filePath: string) {
    return fs.readFileSync(filePath, "utf-8");
  }

  deleteFile(filePath: string) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return {
      success: true
    };
  }
}

export default new FileService();
