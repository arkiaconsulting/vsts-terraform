import * as tl from 'azure-pipelines-task-lib';
import fs = require('fs');
import { downloadTerraform, isVersionValid } from '../common/utilities';

async function run() {
    try {
        let workDir: string = tl.getInput('cwd', true);
        if (!fs.existsSync(workDir)) {
            throw new Error(`Directory ${workDir} does not exist.`);
        }

        let tfVersion: string = tl.getInput('tfversion', true);
        if (!isVersionValid(tfVersion)) {
            throw new Error(`Version ${tfVersion} is not an acceptable Terraform version number`);
        }
        await downloadTerraform(workDir, tfVersion);

        tl.setResult(tl.TaskResult.Succeeded, 'Terraform was downloaded successfully.');
    } catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}

run();