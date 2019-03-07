import * as tl from 'azure-pipelines-task-lib';
import fs = require('fs');
import { WorkspaceCommandBuilder } from "../common/terraformCommandBuilder";

async function run() {
    try {
        let workDir: string = tl.getInput('cwd', true);
        if (!fs.existsSync(workDir)) {
            throw new Error(`Directory ${workDir} does not exist.`);
        }

        let workspaceName: string = tl.getInput('workspacename', true);

        new WorkspaceCommandBuilder(workDir)
            .setSelect(workspaceName)
            .execute();

        tl.setResult(tl.TaskResult.Succeeded, "Success");
    } catch (err) {
        tl.setResult(tl.TaskResult.Failed, err);
    }
}

run();