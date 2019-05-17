"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const os = require("os");
const path = require("path");
const tl = __importStar(require("azure-pipelines-task-lib"));
const toolrunner_1 = __importDefault(require("azure-pipelines-task-lib/toolrunner"));
function downloadTerraform(workingDirectory, version) {
    return __awaiter(this, void 0, void 0, function* () {
        let osType = tl.osType() == 'Windows_NT' ? "windows_amd64" : 'linux_amd64';
        let downloadUrl = `https://releases.hashicorp.com/terraform/${version}/terraform_${version}_${osType}.zip`;
        let filename = path.join(workingDirectory, 'terraform.zip');
        yield download(downloadUrl, filename);
        unzip(filename, workingDirectory);
        fs.unlinkSync(filename);
    });
}
exports.downloadTerraform = downloadTerraform;
function handleExecResult(execResult) {
    if (execResult.code != 0) {
        throw execResult.stderr;
    }
}
function download(url, filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield node_fetch_1.default(url);
        yield new Promise((resolve, reject) => {
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
    });
}
function unzip(file, destinationFolder) {
    if (os.platform() == 'win32') {
        sevenZipExtract(file, destinationFolder);
    }
    else {
        unzipExtract(file, destinationFolder);
    }
}
function unzipExtract(file, destinationFolder) {
    const zip = new toolrunner_1.default.ToolRunner(tl.which("unzip", true));
    zip.arg("-o"); // overwrite all
    zip.arg("-d"); // redirect output to
    zip.arg(destinationFolder); // output directory
    zip.arg(file); // file to extract
    var result = zip.execSync();
    handleExecResult(result);
    const bash = new toolrunner_1.default.ToolRunner(tl.which('bash', true))
        .arg('--noprofile')
        .arg('--norc')
        .arg('-c')
        .arg('chmod +x terraform');
    var result = bash.execSync({ cwd: destinationFolder, failOnStdErr: true });
    handleExecResult(result);
}
function sevenZipExtract(file, destinationFolder) {
    tl.debug('Extracting file: ' + file);
    const sevenZip = require('7zip-bin-win');
    const zip = new toolrunner_1.default.ToolRunner(sevenZip.path7za);
    zip.arg("x");
    zip.arg(file); // file to extract
    zip.arg(`-o${destinationFolder}`); // redirect output to dir
    zip.arg("-y"); // assume yes on all queries
    zip.arg("-spd"); // disable wildcards
    zip.arg("-aoa"); // overwrite all
    let result = zip.execSync();
}
function loginAzure() {
    var connectedService = tl.getInput("connectedServiceNameARM", true);
    loginAzureRM(connectedService);
}
exports.loginAzure = loginAzure;
function loginAzureRM(connectedService) {
    var servicePrincipalId = tl.getEndpointAuthorizationParameter(connectedService, "serviceprincipalid", false);
    var servicePrincipalKey = tl.getEndpointAuthorizationParameter(connectedService, "serviceprincipalkey", false);
    var tenantId = tl.getEndpointAuthorizationParameter(connectedService, "tenantid", false);
    var subscriptionName = tl.getEndpointDataParameter(connectedService, "SubscriptionName", true);
    var subscriptionId = tl.getEndpointDataParameter(connectedService, "SubscriptionId", true);
    throwIfError(tl.execSync("az", "login --service-principal -u \"" + servicePrincipalId + "\" -p \"" + servicePrincipalKey + "\" --tenant \"" + tenantId + "\""));
    throwIfError(tl.execSync("az", "account set --subscription \"" + subscriptionName + "\""));
    process.env.ARM_CLIENT_ID = servicePrincipalId;
    process.env.ARM_CLIENT_SECRET = servicePrincipalKey;
    process.env.ARM_TENANT_ID = tenantId;
    process.env.ARM_SUBSCRIPTION_ID = subscriptionId;
}
function throwIfError(resultOfToolExecution) {
    if (resultOfToolExecution.stderr) {
        throw resultOfToolExecution;
    }
}
function isVersionValid(version) {
    let re = /^\d+\.\d+\.\d+-*[a-z]*\d*$/g;
    let match = version.match(re);
    return match != null;
}
exports.isVersionValid = isVersionValid;
