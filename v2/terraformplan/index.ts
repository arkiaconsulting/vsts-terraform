import tr from "azure-pipelines-task-lib/toolrunner";
import * as tl from 'azure-pipelines-task-lib';
import fs = require('fs');
import { PlanCommandBuilder } from '../common/terraformCommandBuilder'
import { loginAzure } from "../common/utilities";

async function run() {
    try {
        let workDir: string = tl.getInput('cwd', true);
        if (!fs.existsSync(workDir)) {
            throw new Error(`Directory ${workDir} does not exist.`);
        }

        if (tl.getBoolInput('useazurerm', true)) {
            loginAzure();
        }

        var planBuilder = new PlanCommandBuilder(workDir);
        var varsFile = tl.getInput('varsfile', false)
        if (varsFile) {
            planBuilder.setVarsFile(varsFile);
        }
        let savePlanResult = tl.getBoolInput('savePlanResult', true);
        if (savePlanResult) {
            planBuilder.savePlan(tl.getInput('planOutput', true));
        }
        planBuilder.execute();

        tl.setResult(tl.TaskResult.Succeeded, "Success");
    } catch (err) {
        tl.setResult(tl.TaskResult.Failed, err);
    }
}

run();