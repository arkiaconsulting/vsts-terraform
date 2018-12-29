"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const tl = __importStar(require("vsts-task-lib/task"));
const path = require("path");
const fs = require("fs");
let terraformToolPath = '';
class TerraformCommandBuilder {
    constructor(mainCommand, workingDirectory) {
        this.mainCommand = mainCommand;
        this.workingDirectory = workingDirectory;
    }
    prepare() {
        if (terraformToolPath == '') {
            tl.debug('os type is ' + tl.osType());
            if (tl.osType() != 'Linux') {
                var executable = 'terraform.exe';
            }
            else {
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
    handleExecResult(execResult) {
        if (execResult.code != 0) {
            throw execResult.stderr;
        }
        else {
            console.log('Executable result is Ok');
            tl.debug(execResult.stdout);
        }
    }
    executeCommand(toolRunner) {
        let result = toolRunner.execSync({ silent: false, failOnStdErr: false, cwd: this.workingDirectory });
        this.handleExecResult(result);
        return result;
    }
}
exports.TerraformCommandBuilder = TerraformCommandBuilder;
class WorkspaceCommandBuilder extends TerraformCommandBuilder {
    constructor(workingDirectory) {
        super('workspace', workingDirectory);
        this.workspaceName = '';
        this.subCommand = '';
    }
    execute() {
        var tr = super.prepare()
            .arg(this.mainCommand)
            .arg(this.subCommand)
            .arg(this.workspaceName)
            .arg('-no-color');
        this.executeCommand(tr);
    }
    setSelect(workspaceName) {
        this.workspaceName = workspaceName;
        this.subCommand = 'select';
        return this;
    }
    setNew(workspaceName) {
        this.workspaceName = workspaceName;
        this.subCommand = 'new';
        return this;
    }
}
exports.WorkspaceCommandBuilder = WorkspaceCommandBuilder;
class PlanCommandBuilder extends TerraformCommandBuilder {
    constructor(workingDirectory) {
        super('plan', workingDirectory);
        this.workspaceName = '';
        this.varsFile = '';
        this.planToSave = '';
    }
    execute() {
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
    setVarsFile(varsFile) {
        this.varsFile = varsFile;
        return this;
    }
    savePlan(planName) {
        this.planToSave = planName;
        return this;
    }
}
exports.PlanCommandBuilder = PlanCommandBuilder;
class InitCommandBuilder extends TerraformCommandBuilder {
    constructor(workingDirectory) {
        super('init', workingDirectory);
        this.backend = undefined;
    }
    setBackend(resourceGroupName, storageName, containerName, key) {
        this.backend = {
            resource_group_name: resourceGroupName,
            storage_account_name: storageName,
            container_name: containerName,
            key: key
        };
        return this;
    }
    setCustomCommandLine(customCommandLine) {
        this.customCommandLine = customCommandLine;
    }
    execute() {
        var tr = super.prepare()
            .arg(this.mainCommand);
        if (this.backend != undefined) {
            Object.getOwnPropertyNames(this.backend)
                .map(key => {
                tr.arg(`-backend-config=${key}=${this.backend[key]}`);
            });
        }
        if (this.customCommandLine != undefined) {
            tr.arg(this.customCommandLine);
        }
        tr.arg('-no-color')
            .arg('-input=false');
        this.executeCommand(tr);
    }
}
exports.InitCommandBuilder = InitCommandBuilder;
class ApplyCommandBuilder extends TerraformCommandBuilder {
    constructor(workingDirectory) {
        super('apply', workingDirectory);
        this.planName = '';
        this.varsFile = '';
    }
    setOutput(planName) {
        this.planName = planName;
        return this;
    }
    setVarsFile(varsFile) {
        this.varsFile = varsFile;
        return this;
    }
    execute() {
        var tr = super.prepare()
            .arg(this.mainCommand);
        if (this.varsFile != '') {
            tr.arg(`-var-file=${this.varsFile}`);
        }
        tr.arg('-no-color')
            .arg('-input=false')
            .arg('-auto-approve');
        if (this.planName != '') {
            tr.arg(this.planName);
        }
        this.executeCommand(tr);
    }
}
exports.ApplyCommandBuilder = ApplyCommandBuilder;
class StoreOutputCommandBuilder extends TerraformCommandBuilder {
    constructor(workingDirectory, taskVariableName) {
        super('output', workingDirectory);
        this.outputName = '';
        this.taskVariableName = '';
    }
    setOutputName(outputName, taskVariableName) {
        this.outputName = outputName;
        this.taskVariableName = taskVariableName;
        return this;
    }
    execute() {
        var tr = super.prepare()
            .arg(this.mainCommand)
            .arg('-json')
            .arg(this.outputName);
        let result = this.executeCommand(tr);
        let output = JSON.parse(result.stdout);
        tl.setTaskVariable(this.taskVariableName, output.value, output.sensitive);
    }
}
exports.StoreOutputCommandBuilder = StoreOutputCommandBuilder;
