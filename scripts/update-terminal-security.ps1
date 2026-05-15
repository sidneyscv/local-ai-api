# ============================================
# 🔒 UPDATE TERMINAL SECURITY
# ============================================

Write-Host ""
Write-Host "🔒 Updating terminal security..."
Write-Host ""

$root = Get-Location

# ============================================
# TERMINAL SERVICE
# ============================================

@"
import { exec } from "child_process";

class TerminalService {

  allowedCommands = [
    "npm",
    "node",
    "git",
    "python",
    "pip"
  ];

  blockedPatterns = [
    "&&",
    "|",
    ";",
    ">",
    "<",
    "rm ",
    "del ",
    "format",
    "shutdown",
    "taskkill",
    "reg delete"
  ];

  isAllowed(command: string) {

    const isAllowedCommand =
      this.allowedCommands.some(cmd =>
        command.startsWith(cmd)
      );

    if (!isAllowedCommand) {
      return false;
    }

    const hasBlockedPattern =
      this.blockedPatterns.some(pattern =>
        command.includes(pattern)
      );

    return !hasBlockedPattern;
  }

  execute(command: string): Promise<any> {

    return new Promise((resolve, reject) => {

      if (!this.isAllowed(command)) {

        reject(
          new Error(
            "Blocked by security policy"
          )
        );

        return;
      }

      exec(
        command,
        {
          timeout: 15000
        },
        (error, stdout, stderr) => {

          if (error) {

            reject({
              success: false,
              error: error.message
            });

            return;
          }

          resolve({
            success: true,
            stdout,
            stderr
          });

        }
      );

    });

  }
}

export default new TerminalService();
"@ | Set-Content `
"$root/apps/api/src/services/terminal.service.ts"

# ============================================
# DONE
# ============================================

Write-Host ""
Write-Host "✅ Terminal security updated!"
Write-Host ""