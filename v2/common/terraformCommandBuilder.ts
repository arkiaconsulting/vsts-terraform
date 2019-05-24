import tr from "azure-pipelines-task-lib/toolrunner";
import * as tl from 'azure-pipelines-task-lib';
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

    protected prepare(): tr.ToolRunner {
        if (terraformToolPath == '') {
            tl.debug('os type is ' + tl.osType())
            if (tl.osType() != 'Linux') {
                var executable = 'terraform.exe';
            } else {
                executable = 'terraform';
            }

            terraformToolPath = path.join(this.workingDirectory, executable);
            if (!fs.existsSync(terraformToolPath)) {
                terraformToolPath = tl.which(executable);
                if (terraformToolPath == '' || !fs.existsSync(terraformToolPath)) {
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
    private rootPath: string = '';
    private varsMap: InputVar[] = [];

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

        this.varsMap.forEach(item => {
            tr.arg(['-var', `${item.name}=${item.value}`]);
        });

        tr.arg('-no-color')
            .arg('-input=false');

        if (this.rootPath != '') {
            tr.arg(`${this.rootPath}`);
        }

        this.executeCommand(tr);
    }

    public setVarsFile(varsFile: string): PlanCommandBuilder {
        this.varsFile = varsFile;

        return this;
    }

    public setRootPath(rootPath: string): PlanCommandBuilder {
        this.rootPath = rootPath;

        return this;
    }

    public addVar(varName: string, varValue: string): PlanCommandBuilder {
        this.varsMap.push({
            name: varName,
            value: varValue
        });

        return this;
    }

    public savePlan(planName: string): PlanCommandBuilder {
        this.planToSave = planName;

        return this;
    }
}

interface InputVar {
    name: string,
    value: string;
}

export class InitCommandBuilder extends TerraformCommandBuilder {
    private backend?: BackendDescriptor = undefined;
    private customCommandLine?: string;

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

    public setCustomCommandLine(customCommandLine: string) {
        this.customCommandLine = customCommandLine;
    }

    public execute() {
        var tr = super.prepare()
            .arg(this.mainCommand);

        if (this.backend != undefined) {
            Object.getOwnPropertyNames(this.backend)
                .map(key => {
                    if ((<BackendDescriptor>this.backend)[key] !== null)
                        tr.arg(`-backend-config=${key}=${(<BackendDescriptor>this.backend)[key]}`);
                });
        }

        tr.arg('-no-color')
            .arg('-input=false');

        if (this.customCommandLine != undefined) {
            tr.arg(this.customCommandLine);
        }

        this.executeCommand(tr);
    }
}

export interface BackendDescriptor {
    resource_group_name?: string;
    storage_account_name?: string;
    container_name?: string,
    key?: string;
}

export class ApplyCommandBuilder extends TerraformCommandBuilder {
    private planName: string = '';
    private varsFile: string = '';

    constructor(workingDirectory: string) {
        super('apply', workingDirectory);
    }

    public setExecutionPlan(planName: string): ApplyCommandBuilder {
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

    constructor(workingDirectory: string) {
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

        tl.setVariable(this.taskVariableName, output.value, output.sensitive);
    }
}

export class DestroyCommandBuilder extends TerraformCommandBuilder {
    private tfRootPath: string = '';

    constructor(workingDirectory: string) {
        super('destroy', workingDirectory);
    }

    public setRootPath(tfRootPath: string): DestroyCommandBuilder {
        this.tfRootPath = tfRootPath;
        return this;
    }

    public execute() {
        var tr = super.prepare()
            .arg(this.mainCommand);

        tr.arg('-no-color')
            .arg('-force');

        if (this.tfRootPath != '') {
            tr.arg(this.tfRootPath);
        }

        this.executeCommand(tr);
    }
}