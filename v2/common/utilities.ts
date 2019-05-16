import * as fs from 'fs';
import fetch from 'node-fetch';
import os = require('os');
import path = require('path');
import * as tl from 'azure-pipelines-task-lib';
import tr, { IExecOptions } from 'azure-pipelines-task-lib/toolrunner';

export async function downloadTerraform(workingDirectory: string, version: string) {
    let osType = tl.osType() == 'Windows_NT' ? "windows_amd64" : 'linux_amd64'

    let downloadUrl = `https://releases.hashicorp.com/terraform/${version}/terraform_${version}_${osType}.zip`;
    let filename = path.join(workingDirectory, 'terraform.zip');
    await download(downloadUrl, filename);
    unzip(filename, workingDirectory);
    fs.unlinkSync(filename);
}

function handleExecResult(execResult: tr.IExecSyncResult) {
    if (execResult.code != 0) {
        throw execResult.stderr;
    }
}

async function download(url: string, filePath: string) {
    const res = await fetch(url);
    await new Promise((resolve, reject) => {
        const fileStream = fs.createWriteStream(filePath);
        res.body.pipe(fileStream);
        res.body.on("error", (err) => {
            reject(err);
        });
        fileStream.on("finish", function () {
            fileStream.close();
            resolve();
        });
    });
}

function unzip(file: string, destinationFolder: string): void {
    if (os.platform() == 'win32') {
        sevenZipExtract(file, destinationFolder);
    } else {
        unzipExtract(file, destinationFolder);
    }
}

function unzipExtract(file: string, destinationFolder: string): void {
    const zip = new tr.ToolRunner(tl.which("unzip", true));
    zip.arg("-o");           // overwrite all
    zip.arg("-d");           // redirect output to
    zip.arg(destinationFolder);         // output directory
    zip.arg(file);          // file to extract
    var result = zip.execSync();
    handleExecResult(result);

    const bash = new tr.ToolRunner(tl.which('bash', true))
        .arg('--noprofile')
        .arg('--norc')
        .arg('-c')
        .arg('chmod +x terraform');
    var result = bash.execSync(<IExecOptions>{ cwd: destinationFolder, failOnStdErr: true });
    handleExecResult(result);
}

function sevenZipExtract(file: string, destinationFolder: string): void {
    tl.debug('Extracting file: ' + file);
    const sevenZip = require('7zip-bin-win');
    const zip = new tr.ToolRunner(sevenZip.path7za);
    zip.arg("x");
    zip.arg(file);          // file to extract
    zip.arg(`-o${destinationFolder}`);  // redirect output to dir
    zip.arg("-y");           // assume yes on all queries
    zip.arg("-spd");         // disable wildcards
    zip.arg("-aoa");         // overwrite all
    let result = zip.execSync();
}

export function loginAzure() {
    var connectedService: string = tl.getInput("connectedServiceNameARM", true);
    loginAzureRM(connectedService);
}

function loginAzureRM(connectedService: string): void {
    var servicePrincipalId: string = tl.getEndpointAuthorizationParameter(connectedService, "serviceprincipalid", false);
    var servicePrincipalKey: string = tl.getEndpointAuthorizationParameter(connectedService, "serviceprincipalkey", false);
    var tenantId: string = tl.getEndpointAuthorizationParameter(connectedService, "tenantid", false);
    var subscriptionName: string = tl.getEndpointDataParameter(connectedService, "SubscriptionName", true);
    var subscriptionId: string = tl.getEndpointDataParameter(connectedService, "SubscriptionId", true);
    throwIfError(tl.execSync("az", "login --service-principal -u \"" + servicePrincipalId + "\" -p \"" + servicePrincipalKey + "\" --tenant \"" + tenantId + "\""));
    throwIfError(tl.execSync("az", "account set --subscription \"" + subscriptionName + "\""));
    process.env.ARM_CLIENT_ID = servicePrincipalId;
    process.env.ARM_CLIENT_SECRET = servicePrincipalKey;
    process.env.ARM_TENANT_ID = tenantId;
    process.env.ARM_SUBSCRIPTION_ID = subscriptionId;
}

function throwIfError(resultOfToolExecution): void {
    if (resultOfToolExecution.stderr) {
        throw resultOfToolExecution;
    }
}

export function isVersionValid(version: string): boolean {
    let re = /^\d+\.\d+\.\d+-[a-z]+\d+$/g;
    let match = version.match(re);

    return match != null;
}