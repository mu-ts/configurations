import 'mocha';
import { expect, use } from 'chai';
import 'chai-as-promised';
import { Configurations } from '../../src/service/Configurations';
import * as sinon from 'sinon';
import { SecretsManager } from 'aws-sdk';
import { SecretsManagerStore } from '../../src/source/SecretsManagerStore';

use(require('chai-as-promised'));

// const secretsManager = new SecretsManager({
//   apiVersion: '2017-10-17',
//   region: 'us-west-2',
// });

// sandbox.stub(secretsManager, 'getSecretValue').value(() => {
//   return { promise: () => Promise.resolve({ SecretString: '{"aboolean": true, "aninteger": 1}' }) };
// });

// secretsManagerStore = new SecretsManagerStore('unittest', 'us-west-2');
// sandbox.stub(secretsManagerStore as any, 'secretsManager').value(secretsManager);

describe('Configurations', async () => {
  describe('Defaults', async () => {
    let sandbox: sinon.SinonSandbox;
    let configurations: Configurations;
    let defaults: any = {
      aboolean: true,
      astring: 'foo',
      anumber: 1,
      adate: new Date(),
      aobject: { foo: 'bar' },
    };

    beforeEach(() => {
      sandbox = sinon.createSandbox();
      configurations = new Configurations(defaults);
    });

    afterEach(() => {
      sandbox.restore();
    });

    describe('get', async () => {
      it('string', async () => {
        const result: string = await configurations.get('astring');
        expect(result).to.not.be.undefined;
        expect(result).to.be.string;
        expect(result).to.equal('foo');
      });

      it('boolean', async () => {
        const result: boolean = await configurations.get('aboolean');
        expect(result).to.not.be.undefined;
        expect(result).to.be.true;
        expect(result).to.be.a('boolean');
      });

      it('date', async () => {
        const result: Date = await configurations.get('adate');
        expect(result).to.not.be.undefined;
        expect(result.valueOf()).to.equal(defaults.adate.valueOf());
      });

      it('number', async () => {
        const result: number = await configurations.get('anumber');
        expect(result).to.not.be.undefined;
        expect(result).to.be.a('number');
        expect(result).to.equal(defaults.anumber);
      });

      it('object', async () => {
        const result: object = await configurations.get('aobject');
        expect(result).to.not.be.undefined;
        expect(result).to.be.a('object');
        expect(result).to.eql(defaults.aobject);
      });
    });

    describe('getAsBoolean', async () => {
      it('boolean', async () => {
        const result: boolean = await configurations.getAsBoolean('aboolean');
        expect(result).to.not.be.undefined;
        expect(result).to.be.true;
        expect(result).to.be.a('boolean');
      });
    });

    describe('getAsString', async () => {
      it('boolean', async () => {
        const result: string = await configurations.getAsString('astring');
        expect(result).to.not.be.undefined;
        expect(result).to.be.a('string');
        expect(result).to.equal('foo');
      });
    });

    describe('getAsNumber', async () => {
      it('boolean', async () => {
        const result: number = await configurations.getAsNumber('anumber');
        expect(result).to.not.be.undefined;
        expect(result).to.be.a('number');
        expect(result).to.equal(1);
      });
    });
  });

  describe('SecretsManager', async () => {
    let sandbox: sinon.SinonSandbox;
    let configurations: Configurations;
    let defaults: any = {
      aboolean: true,
      astring: 'foo',
      anumber: 1,
      adate: new Date(),
      aobject: { foo: 'bar' },
    };

    beforeEach(() => {
      sandbox = sinon.createSandbox();

      const secretsManager = new SecretsManager({
        apiVersion: '2017-10-17',
        region: 'us-west-2',
      });
      sandbox.stub(secretsManager, 'getSecretValue').value(() => {
        return { promise: () => Promise.resolve({ SecretString: JSON.stringify(defaults) }) };
      });

      const secretsManagerStore: SecretsManagerStore = new SecretsManagerStore('unittest', 'us-west-2');
      sandbox.stub(secretsManagerStore as any, 'secretsManager').value(secretsManager);

      configurations = new Configurations('unittest');
      sandbox.stub(configurations as any, 'secretStore').value(secretsManagerStore);
    });

    afterEach(() => {
      sandbox.restore();
    });

    describe('get', async () => {
      it('string', async () => {
        const result: string = await configurations.get('astring');
        expect(result).to.not.be.undefined;
        expect(result).to.be.string;
        expect(result).to.equal('foo');
      });

      it('boolean', async () => {
        const result: boolean = await configurations.get('aboolean');
        expect(result).to.not.be.undefined;
        expect(result).to.be.true;
        expect(result).to.be.a('boolean');
      });

      it('date', async () => {
        const result: Date = await configurations.get('adate');
        expect(result).to.not.be.undefined;
        expect(result.valueOf()).to.equal(defaults.adate.valueOf());
      });

      it('number', async () => {
        const result: number = await configurations.get('anumber');
        expect(result).to.not.be.undefined;
        expect(result).to.be.a('number');
        expect(result).to.equal(defaults.anumber);
      });

      it('object', async () => {
        const result: object = await configurations.get('aobject');
        expect(result).to.not.be.undefined;
        expect(result).to.be.a('object');
        expect(result).to.eql(defaults.aobject);
      });
    });

    describe('getAsBoolean', async () => {
      it('boolean', async () => {
        const result: boolean = await configurations.getAsBoolean('aboolean');
        expect(result).to.not.be.undefined;
        expect(result).to.be.true;
        expect(result).to.be.a('boolean');
      });
    });

    describe('getAsString', async () => {
      it('boolean', async () => {
        const result: string = await configurations.getAsString('astring');
        expect(result).to.not.be.undefined;
        expect(result).to.be.a('string');
        expect(result).to.equal('foo');
      });
    });

    describe('getAsNumber', async () => {
      it('boolean', async () => {
        const result: number = await configurations.getAsNumber('anumber');
        expect(result).to.not.be.undefined;
        expect(result).to.be.a('number');
        expect(result).to.equal(1);
      });
    });
  });
});
