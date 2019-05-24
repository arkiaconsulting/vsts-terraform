import path from 'path'
import * as tmrm from 'vsts-task-lib/mock-run';
import * as ma from 'vsts-task-lib/mock-answer'

let taskPath = path.join(__dirname, '..', 'index.js');
let tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

tmr.setInput('cwd', path.join(__dirname, '..', '..', '..', 'samples', 'nobackend'));
tmr.setInput('init', 'True');
tmr.setInput('download', 'False');
tmr.setInput('useazurerm', 'False');
tmr.setInput('initbackend', 'False');
tmr.setInput('useworkspace', 'False');
tmr.setInput('cmdtype', 'none');
tmr.setInput('storeoutput', 'False');

let a: ma.TaskLibAnswers = <ma.TaskLibAnswers>{
    "which": {
        "terraform": "/mocked/tools/terraform"
    },
    "exec": {
        "/mocked/tools/terraform init -no-color -input=false": {
            "code": 0,
            "stdout": "init",
            "stderr": ""
        }
    },
    "osType": {
        "osType": "Linux"
    }
};
tmr.setAnswers(a);

// mock a specific module function called in task 
// tmr.registerMock('node-fetch', {
//     fetch: function () {
//         console.log('fetch mock');
//     }
// });

tmr.run();