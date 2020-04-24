import * as tl from 'azure-pipelines-task-lib';
import fs = require('fs');
import { StoreOutputCommandBuilder } from '../common/terraformCommandBuilder'
import { loginAzure, setAzureCloudBasedOnServiceEndpoint } from "../common/utilities";

async function run() {
    try {
        let workDir: string = tl.getInput('cwd', true);
        if (!fs.existsSync(workDir)) {
            throw new Error(`Directory ${workDir} does not exist.`);
        }

        if (tl.getBoolInput('useazurerm', true)) {
            setAzureCloudBasedOnServiceEndpoint();
            loginAzure();
        }

        let variables = JSON.parse(tl.getInput('outputvars', true));
        Object.getOwnPropertyNames(variables).forEach(key => {
            let taskVariableName = variables[key];
            new StoreOutputCommandBuilder(workDir)
                .setOutputName(key, taskVariableName)
                .execute();
        });

        tl.setResult(tl.TaskResult.Succeeded, "Success");
    } catch (err) {
        tl.setResult(tl.TaskResult.Failed, err);
    }
}

run();