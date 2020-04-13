import * as tl from 'azure-pipelines-task-lib';
import fs = require('fs');
import { ApplyCommandBuilder } from '../common/terraformCommandBuilder'
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

        var applyBuilder = new ApplyCommandBuilder(workDir);

        let planOrPath = tl.getInput('planOrPath', false);
        if (planOrPath !== null) {
            applyBuilder.setExecutionPlan(planOrPath);
        }

        applyBuilder.execute();

        tl.setResult(tl.TaskResult.Succeeded, "Success");
    } catch (err) {
        tl.setResult(tl.TaskResult.Failed, err);
    }
}

run();