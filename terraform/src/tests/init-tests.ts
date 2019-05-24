import * as path from 'path';
import * as ttm from 'vsts-task-lib/mock-test';
import { expect } from 'chai';
import * as tl from 'vsts-task-lib/task';

describe('init', () => {
    it('simplest init should pass', (done: MochaDone) => {
        let tp = path.join(__dirname, 'init-nobackend-success.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tr.run();

        expect(tr.succeeded, 'should have succeeded').to.true;
        expect(tr.stdout.indexOf('/mocked/tools/terraform init -no-color -input=false')).to.greaterThan(0);

        done();
    });
});