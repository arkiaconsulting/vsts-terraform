import * as path from 'path';
import * as ttm from 'vsts-task-lib/mock-test';
import { expect } from 'chai';
import { isVersionValid } from '../utilities';
import * as tl from 'vsts-task-lib/task';

let parent_dir = path.normalize(path.join(__dirname, '..'));
tl.debug("dir: " + parent_dir);

describe('download', () => {
    before(() => { });
    beforeEach(() => { });
    after(() => { });

    it('wrong version should fail', (done: MochaDone) => {
        let wrongVersion = '0.11.6.7';
        let workingDirectory = path.join(parent_dir, '..', '..', 'samples');
        process.env['INPUT_CWD'] = workingDirectory;
        process.env['INPUT_DOWNLOAD'] = 'True';
        process.env['INPUT_TFVERSION'] = wrongVersion;
        let tp = path.join(__dirname, 'init-nobackend-success.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tr.run();

        expect(tr.errorIssues.length).to.eq(1, 'should have at least one error');
        expect(tr.errorIssues[0]).to.equal(`Version ${wrongVersion} is not an acceptable Terraform version number`);

        done();
    });

    it('unzip should pass', async (done: MochaDone) => {
        let wrongVersion = '0.11.6';
        let tp = path.join(__dirname, 'init-nobackend-success.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);
        process.env['INPUT_DOWNLOAD'] = 'True';

        await tr.run();

        expect(tr.errorIssues.length).to.eq(0, 'should have no error');

        done();
    });

    it('version should be valid', (done: MochaDone) => {
        var result = isVersionValid('0.11.6');
        expect(result).to.true;

        result = isVersionValid('0.11.6.6');
        expect(result).to.false;

        result = isVersionValid('');
        expect(result).to.false;

        result = isVersionValid('hi');
        expect(result).to.false;

        done();
    })
})