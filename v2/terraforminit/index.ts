import tr from "azure-pipelines-task-lib/toolrunner";
import * as tl from 'azure-pipelines-task-lib';
import fs = require('fs');
import { InitCommandBuilder } from '../common/terraformCommandBuilder'
import { loginAzure } from '../common/utilities';

async function run() {
    try {
        let workDir: string = tl.getInput('cwd', true);
        if (!fs.existsSync(workDir)) {
            throw new Error(`Directory ${workDir} does not exist.`);
        }

        if (tl.getBoolInput('useazurerm', true)) {
            loginAzure();
        }

        let initBuilder = new InitCommandBuilder(workDir);
        if (tl.getBoolInput('initbackend', true)) {
            initBuilder.setBackend(
                tl.getInput('backendrg', true),
                tl.getInput('backendstorage', true),
                tl.getInput('backendcontainer', true),
                tl.getInput('backendkey', true));
        }

        let tfRootPath = tl.getInput('tfrootpath', false);
        if (tfRootPath !== undefined) {
            initBuilder.setCustomCommandLine(tfRootPath);
        }

        initBuilder.execute();

        tl.setResult(tl.TaskResult.Succeeded, 'Terraform was downloaded successfully.');
    } catch (err) {
        tl.setResult(tl.TaskResult.Failed, err);
    }
}

run();