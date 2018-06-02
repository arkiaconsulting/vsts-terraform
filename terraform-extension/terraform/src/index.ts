import * as tl from 'vsts-task-lib';

import {
    ApplyCommandBuilder,
    InitCommandBuilder,
    PlanCommandBuilder,
    WorkspaceCommandBuilder,
    StoreOutputCommandBuilder,
} from './terraformCommandBuilder';
import { downloadTerraform, loginAzure } from './utilities';

async function run() {
    try {
        let workDir: string = tl.getInput('cwd', true);
        let tfVersion: string = tl.getInput('tfversion');
        let download = tl.getBoolInput('download', true);
        if (download) {
            await downloadTerraform(workDir, tfVersion);
        }

        if (tl.getBoolInput('useazurerm', true)) {
            loginAzure();
        }

        if (tl.getBoolInput('init', true)) {
            new InitCommandBuilder()
                .setBackend(
                    tl.getInput('backendrg', true),
                    tl.getInput('backendstorage', true),
                    tl.getInput('backendcontainer', true),
                    tl.getInput('backendkey', true)
                ).execute(workDir);
        }

        if (tl.getBoolInput('useworkspace', true)) {
            let workspace = tl.getInput('workspace', true);
            try {
                new WorkspaceCommandBuilder()
                    .setSelect(workspace)
                    .execute(workDir);
            } catch {
                new WorkspaceCommandBuilder()
                    .setNew(workspace)
                    .execute(workDir);
            }
        }

        let cmdType: string = tl.getInput('cmdType', true);
        switch (cmdType) {
            case "plan":
                var planBuilder = new PlanCommandBuilder();
                var varsFile = tl.getInput('varsfile', false)
                if (varsFile) {
                    planBuilder.setVarsFile(varsFile);
                }
                let savePlanResult = tl.getBoolInput('savePlanResult', true);
                if (savePlanResult) {
                    planBuilder.savePlan(tl.getInput('planOutput', true));
                }
                planBuilder.execute(workDir);
                break;
            case 'apply':
                var applyBuilder = new ApplyCommandBuilder();
                var varsFile = tl.getInput('varsfile', false)
                if (varsFile) {
                    applyBuilder.setVarsFile(varsFile);
                }
                let usePlanResult = tl.getBoolInput('usePlanResult', true);
                if (usePlanResult) {
                    applyBuilder.setOutput(tl.getInput('applyInput', true));
                }
                applyBuilder.execute(workDir);
                break;
            default:
                break;
        }

        if (tl.getBoolInput('storeoutput', true)) {
            new StoreOutputCommandBuilder()
                .setOutputName(tl.getInput('tfoutputname', true))
                .execute(workDir, tl.getInput('taskoutputname', true));
        }

        tl.setResult(tl.TaskResult.Succeeded, "Ok !")
    }
    catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}

run();
