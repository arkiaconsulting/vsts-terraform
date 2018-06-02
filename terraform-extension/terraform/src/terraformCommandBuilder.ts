import tr, { ToolRunner } from "vsts-task-lib/toolrunner";
import * as tl from 'vsts-task-lib';
import os = require('os');
import path = require('path');
import fs = require('fs');

export class TerraformCommandBuilder {
    protected mainCommand: string;

    constructor(mainCommand: string) {
        this.mainCommand = mainCommand;
    }

    protected prepare(workingDirectory: string): ToolRunner {
        if (os.platform() == 'win32') {
            var executable = 'terraform.exe';
        } else {
            executable = 'terraform';
        }

        try {
            var toolPath = tl.which(executable, true);
        } catch {
            var toolPath = path.join(workingDirectory, executable);
            if (!fs.existsSync(toolPath)) {
                throw "Cannot find terraform executable";
            }
        }
        var tool = tl.tool(toolPath);

        tl.mkdirP(workingDirectory);
        tl.cd(workingDirectory);

        return tool;
    }

    protected handleExecResult(execResult: tr.IExecSyncResult) {
        if (execResult.code != 0) {
            tl.error(execResult.stderr);
            throw execResult.stderr;
        } else {
            console.log('Executable result is Ok');
            tl.debug(execResult.stdout);
        }
    }

    protected executeCommand(toolRunner: tr.ToolRunner, workingDir: string): tr.IExecSyncResult {
        let result = toolRunner.execSync(<any>{ silent: false, failOnStdErr: false, cwd: workingDir });
        this.handleExecResult(result);

        return result;
    }
}

export class WorkspaceCommandBuilder extends TerraformCommandBuilder {
    private workspaceName: string = '';
    private subCommand: string = '';

    constructor() {
        super('workspace')
    }

    public execute(workingDir: string) {
        var tr = super.prepare(workingDir)
            .arg(this.mainCommand)
            .arg(this.subCommand)
            .arg(this.workspaceName)
            .arg('-no-color');

        this.executeCommand(tr, workingDir);
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

    constructor() {
        super('plan')
    }

    public execute(workingDir: string) {
        var tr = super.prepare(workingDir)
            .arg(this.mainCommand);

        if (this.varsFile != '') {
            tr.arg(`-var-file=${this.varsFile}`);
        }

        if (this.planToSave != '') {
            tr.arg(`-out=${this.planToSave}`);
        }

        tr.arg('-no-color')
            .arg('-input=false');

        this.executeCommand(tr, workingDir);
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

    constructor() {
        super('init');
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

    public execute(workingDir: string) {
        var tr = super.prepare(workingDir)
            .arg(this.mainCommand);

        if (this.backend != undefined) {
            Object.getOwnPropertyNames(this.backend)
                .map(key => {
                    tr.arg(`-backend-config=${key}=${(<BackendDescriptor>this.backend)[key]}`);
                });
        }

        tr.arg('-no-color')
            .arg('-input=false');

        this.executeCommand(tr, workingDir);
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

    constructor() {
        super('apply');
    }

    public setOutput(planName: string): ApplyCommandBuilder {
        this.planName = planName;
        return this;
    }

    public setVarsFile(varsFile: string): ApplyCommandBuilder {
        this.varsFile = varsFile;

        return this;
    }

    public execute(workingDir: string) {
        var tr = super.prepare(workingDir)
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

        this.executeCommand(tr, workingDir);
    }
}

export class StoreOutputCommandBuilder extends TerraformCommandBuilder {
    private outputName: string = '';
    constructor() {
        super('output');
    }

    public setOutputName(outputName: string): StoreOutputCommandBuilder {
        this.outputName = outputName;
        return this;
    }

    public execute(workingDir: string, taskVar: string) {
        var tr = super.prepare(workingDir)
            .arg(this.mainCommand)
            .arg('-json')
            .arg(this.outputName);

        let result = this.executeCommand(tr, workingDir);
        let output = JSON.parse(result.stdout);

        tl.setTaskVariable(taskVar, output.value, output.sensitive);
    }
}