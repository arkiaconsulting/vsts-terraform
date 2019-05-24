import tr from "azure-pipelines-task-lib/toolrunner";
export declare class TerraformCommandBuilder {
    protected mainCommand: string;
    protected workingDirectory: string;
    constructor(mainCommand: string, workingDirectory: string);
    protected prepare(): tr.ToolRunner;
    protected handleExecResult(execResult: tr.IExecSyncResult): void;
    protected executeCommand(toolRunner: tr.ToolRunner): tr.IExecSyncResult;
}
export declare class WorkspaceCommandBuilder extends TerraformCommandBuilder {
    private workspaceName;
    private subCommand;
    constructor(workingDirectory: string);
    execute(): void;
    setSelect(workspaceName: string): WorkspaceCommandBuilder;
    setNew(workspaceName: string): WorkspaceCommandBuilder;
}
export declare class PlanCommandBuilder extends TerraformCommandBuilder {
    private workspaceName;
    private varsFile;
    private planToSave;
    private rootPath;
    private varsMap;
    constructor(workingDirectory: string);
    execute(): void;
    setVarsFile(varsFile: string): PlanCommandBuilder;
    setRootPath(rootPath: string): PlanCommandBuilder;
    addVar(varName: string, varValue: string): PlanCommandBuilder;
    savePlan(planName: string): PlanCommandBuilder;
}
export declare class InitCommandBuilder extends TerraformCommandBuilder {
    private backend?;
    private customCommandLine?;
    constructor(workingDirectory: string);
    setBackend(resourceGroupName: string, storageName: string, containerName: string, key: string): InitCommandBuilder;
    setCustomCommandLine(customCommandLine: string): void;
    execute(): void;
}
export interface BackendDescriptor {
    resource_group_name?: string;
    storage_account_name?: string;
    container_name?: string;
    key?: string;
}
export declare class ApplyCommandBuilder extends TerraformCommandBuilder {
    private planName;
    private varsFile;
    constructor(workingDirectory: string);
    setExecutionPlan(planName: string): ApplyCommandBuilder;
    setVarsFile(varsFile: string): ApplyCommandBuilder;
    execute(): void;
}
export declare class StoreOutputCommandBuilder extends TerraformCommandBuilder {
    private outputName;
    private taskVariableName;
    constructor(workingDirectory: string);
    setOutputName(outputName: string, taskVariableName: string): StoreOutputCommandBuilder;
    execute(): void;
}
export declare class DestroyCommandBuilder extends TerraformCommandBuilder {
    private tfRootPath;
    constructor(workingDirectory: string);
    setRootPath(tfRootPath: string): DestroyCommandBuilder;
    execute(): void;
}
