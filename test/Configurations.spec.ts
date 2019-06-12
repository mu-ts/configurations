import 'mocha';
import { expect, use } from 'chai';
import 'chai-as-promised';
import { Configurations } from '../src/Configurations';
import * as sinon from 'sinon';
import * as AWS from 'aws-sdk';


use(require('chai-as-promised'));


describe('Configurations', async () => {

    let sandbox: sinon.SinonSandbox;
    const configurations = new Configurations('unittest', 'us-west-2');

    beforeEach(() => {
        sandbox = sinon.createSandbox();

        const secretsManager = new AWS.SecretsManager({
            apiVersion: '2017-10-17',
            region: 'us-west-2'
        });

        sandbox.stub(configurations as any, 'secretsManager').value(secretsManager);

        sandbox.stub(secretsManager, 'getSecretValue').value((value: any) => {
            return {promise: () => Promise.resolve({SecretString: '{"aboolean": true}'})};
        });


    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should return a property from getAsBoolean() that exists', async () => {
        const result = await configurations.getAsBoolean('aboolean');
        expect(result).to.be.true;
    });

    it('should return undefined for get() for a property that doesn\'t exist', async () => {
        const result = await configurations.get('nonexistent');
        expect(result).to.be.undefined;
    });

    it('should return a default for get() where specified and undefined in environment', async () => {
        const result = await configurations.get('nonexistent', 'defaultValue');
        expect(result).to.equal('defaultValue');
    });

    it('should return a default for getAsBoolean() where specified and undefined in environment', async () => {
        const result = await configurations.getAsBoolean('nonexistent', false);
        expect(result).to.equal(false);
    });

});