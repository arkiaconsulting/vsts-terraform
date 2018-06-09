import * as path from 'path';
import * as ttm from 'vsts-task-lib/mock-test';
import { expect } from 'chai';

describe('terraform', () => {
    before(() => { });
    beforeEach(() => { });
    after(() => { });

    it('working directory should exist', (done: MochaDone) => {
        let wrongPath = 'idonotexist';
        process.env['INPUT_CWD'] = path.join(wrongPath);
        let tp = path.join(__dirname, '..', 'index.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tr.run();

        expect(tr.errorIssues.length).to.eq(1, 'should have at least one error');
        expect(tr.errorIssues[0]).to.equal(`Directory ${wrongPath} does not exist.`);

        done();
    });

    it('terraform version should be valid when downloading', (done: MochaDone) => {
        let wrongVersion = '0.11.6.7';
        process.env['INPUT_CWD'] = path.join(__dirname, '..', '..', '..', 'samples');
        process.env['INPUT_DOWNLOAD'] = 'True';
        process.env['INPUT_TFVERSION'] = wrongVersion;
        let tp = path.join(__dirname, '..', 'index.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tr.run();

        expect(tr.errorIssues.length).to.eq(1, 'should have at least one error');
        expect(tr.errorIssues[0]).to.equal(`Version ${wrongVersion} is not an acceptable Terraform version number`);

        done();
    });
})