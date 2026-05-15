import fileService from "../services/file.service";
import terminalService from "../services/terminal.service";

class ActionExecutor {

  async execute(actions: any[]) {

    const results = [];

    for (const action of actions) {

      try {

        switch (action.type) {

          case "create_file":

            results.push(
              fileService.createFile(
                action.path,
                action.content || ""
              )
            );

            break;

          case "delete_file":

            results.push(
              fileService.deleteFile(
                action.path
              )
            );

            break;

          case "run_command":

            results.push(
              await terminalService.execute(
                action.command
              )
            );

            break;

          default:

            results.push({
              success: false,
              error:
                "Unknown action type: " +
                action.type
            });

        }

      } catch (error: any) {

        results.push({
          success: false,
          error: error.message
        });

      }

    }

    return results;
  }
}

export default new ActionExecutor();
