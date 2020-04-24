import tl = require("azure-pipelines-task-lib/task");
import fs = require('fs');
import { PlanCommandBuilder } from '../common/terraformCommandBuilder'
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

        var planBuilder = new PlanCommandBuilder(workDir);
        var useVarFile = tl.getBoolInput('usevarsfile', true)
        if (useVarFile) {
            planBuilder.setVarsFile(tl.getInput('varsfile', true));
        }

        var useVars = tl.getBoolInput('usevars', true)
        if (useVars) {
            const varsMap = JSON.parse(tl.getInput('varsmap', true));
            Object.getOwnPropertyNames(varsMap).forEach(key => {
                planBuilder.addVar(key, varsMap[key]);
            });
        }

        let savePlanResult = tl.getBoolInput('savePlanResult', true);
        if (savePlanResult) {
            planBuilder.savePlan(tl.getInput('planOutput', true));
        }

        let tfRootPath = tl.getInput('tfrootpath', false);
        if (tfRootPath !== null) {
            planBuilder.setRootPath(tfRootPath);
        }

        planBuilder.execute();

        tl.setResult(tl.TaskResult.Succeeded, "Success");
    } catch (err) {
        tl.setResult(tl.TaskResult.Failed, err);
    }
}

run();