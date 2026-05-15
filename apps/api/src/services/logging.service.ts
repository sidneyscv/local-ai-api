import fs from "fs";
import path from "path";

class LoggingService {
  logsDir: string;

  constructor() {
    this.logsDir =
      path.join(process.cwd(), "logs");

    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, {
        recursive: true
      });
    }
  }

  log(type: string, data: any) {
    const file =
      path.join(this.logsDir, type + ".log");

    const content =
      "[" + new Date().toISOString() + "] " +
      JSON.stringify(data) +
      "\n";

    fs.appendFileSync(file, content);
  }
}

export default new LoggingService();
