import tr, { ToolRunner } from "vsts-task-lib/toolrunner";
import * as tl from 'vsts-task-lib/task';
import os = require('os');
import path = require('path');
import fs = require('fs');

let terraformToolPath: string = '';

export class TerraformCommandBuilder {
    protected mainCommand: string;
    protected workingDirectory: string;

    constructor(
        mainCommand: string,
        workingDirectory: string) {
        this.mainCommand = mainCommand;
        this.workingDirectory = workingDirectory;
    }

    protected prepare(): ToolRunner {
        if (terraformToolPath == '') {
            tl.debug('os type is ' + tl.osType())
            if (tl.osType() != 'Linux') {
                var executable = 'terraform.exe';
            } else {
                executable = 'terraform';
            }

            terraformToolPath = tl.which(executable);
            if (terraformToolPath == '') {
                terraformToolPath = path.join(this.workingDirectory, executable);
                if (!fs.existsSync(terraformToolPath)) {
                    throw "Cannot find terraform executable";
                }
            }
        }

        var tool = tl.tool(terraformToolPath);

        tl.mkdirP(this.workingDirectory);
        tl.cd(this.workingDirectory);

        return tool;
    }

    protected handleExecResult(execResult: tr.IExecSyncResult) {
        if (execResult.code != 0) {
            throw execResult.stderr;
        } else {
            console.log('Executable result is Ok');
            tl.debug(execResult.stdout);
        }
    }

    protected executeCommand(toolRunner: tr.ToolRunner): tr.IExecSyncResult {
        let result = toolRunner.execSync(<any>{ silent: false, failOnStdErr: false, cwd: this.workingDirectory });
        this.handleExecResult(result);

        return result;
    }
}

export class WorkspaceCommandBuilder extends TerraformCommandBuilder {
    private workspaceName: string = '';
    private subCommand: string = '';

    constructor(workingDirectory: string) {
        super('workspace', workingDirectory)
    }

    public execute() {
        var tr = super.prepare()
            .arg(this.mainCommand)
            .arg(this.subCommand)
            .arg(this.workspaceName)
            .arg('-no-color');

        this.executeCommand(tr);
    }

    public setSelect(workspaceName: string): WorkspaceCommandBuilder {
        this.workspaceName = workspaceName;
        this.subCommand = 'select';

        return this;
    }

    public setNew(workspaceName: string): WorkspaceCommandBuilder {
        this.workspaceName = workspaceName;
        this.subCommand = 'new';

        return this;
    }
}

export class PlanCommandBuilder extends TerraformCommandBuilder {
    private workspaceName: string = '';
    private varsFile: string = '';
    private planToSave: string = '';

    constructor(workingDirectory: string) {
        super('plan', workingDirectory)
    }

    public execute() {
        var tr = super.prepare()
            .arg(this.mainCommand);

        if (this.varsFile != '') {
            tr.arg(`-var-file=${this.varsFile}`);
        }

        if (this.planToSave != '') {
            tr.arg(`-out=${this.planToSave}`);
        }

        tr.arg('-no-color')
            .arg('-input=false');

        this.executeCommand(tr);
    }

    public setVarsFile(varsFile: string): PlanCommandBuilder {
        this.varsFile = varsFile;

        return this;
    }

    public savePlan(planName: string): PlanCommandBuilder {
        this.planToSave = planName;

        return this;
    }
}

export class InitCommandBuilder extends TerraformCommandBuilder {
    private backend?: BackendDescriptor = undefined;

    constructor(workingDirectory: string) {
        super('init', workingDirectory);
    }

    public setBackend(
        resourceGroupName: string,
        storageName: string,
        containerName: string,
        key: string): InitCommandBuilder {
        this.backend = <BackendDescriptor>{
            resource_group_name: resourceGroupName,
            storage_account_name: storageName,
            container_name: containerName,
            key: key
        }

        return this;
    }

    public execute() {
        var tr = super.prepare()
            .arg(this.mainCommand);

        if (this.backend != undefined) {
            Object.getOwnPropertyNames(this.backend)
                .map(key => {
                    tr.arg(`-backend-config=${key}=${(<BackendDescriptor>this.backend)[key]}`);
                });
        }

        tr.arg('-no-color')
            .arg('-input=false');

        this.executeCommand(tr);
    }
}

export interface BackendDescriptor {
    resource_group_name: string;
    storage_account_name: string;
    container_name: string,
    key: string;
}

export class ApplyCommandBuilder extends TerraformCommandBuilder {
    private planName: string = '';
    private varsFile: string = '';

    constructor(workingDirectory: string) {
        super('apply', workingDirectory);
    }

    public setOutput(planName: string): ApplyCommandBuilder {
        this.planName = planName;
        return this;
    }

    public setVarsFile(varsFile: string): ApplyCommandBuilder {
        this.varsFile = varsFile;

        return this;
    }

    public execute() {
        var tr = super.prepare()
            .arg(this.mainCommand);

        if (this.varsFile != '') {
            tr.arg(`-var-file=${this.varsFile}`);
        }

        tr.arg('-no-color')
            .arg('-input=false')
            .arg('-auto-approve')

        if (this.planName != '') {
            tr.arg(this.planName);
        }

        this.executeCommand(tr);
    }
}

export class StoreOutputCommandBuilder extends TerraformCommandBuilder {
    private outputName: string = '';
    private taskVariableName: string = '';

    constructor(workingDirectory: string, taskVariableName: string) {
        super('output', workingDirectory);
    }

    public setOutputName(outputName: string, taskVariableName: string): StoreOutputCommandBuilder {
        this.outputName = outputName;
        this.taskVariableName = taskVariableName;

        return this;
    }

    public execute() {
        var tr = super.prepare()
            .arg(this.mainCommand)
            .arg('-json')
            .arg(this.outputName);

        let result = this.executeCommand(tr);
        let output = JSON.parse(result.stdout);

        tl.setTaskVariable(this.taskVariableName, output.value, output.sensitive);
    }
}