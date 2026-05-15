import fs from "fs";

class PreviewService {

  preview(actions: any[]) {

    return actions.map(action => {

      switch (action.type) {

        case "create_file":

          return {
            type: action.type,
            path: action.path,
            contentPreview:
              action.content
                ?.substring(0, 500)
          };

        case "delete_file":

          return {
            type: action.type,
            path: action.path
          };

        case "run_command":

          return {
            type: action.type,
            command: action.command
          };

        default:

          return {
            type: action.type,
            warning: "Unknown action"
          };

      }

    });

  }

}

export default new PreviewService();
