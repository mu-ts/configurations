import 'mocha';
import { expect, use } from 'chai';
import 'chai-as-promised';
import * as sinon from 'sinon';
import { SecretsManager } from 'aws-sdk';
import { SecretsManagerStore } from '../../src/source/SecretsManagerStore';

use(require('chai-as-promised'));

describe('SecretsManagerStore', async () => {
  let sandbox: sinon.SinonSandbox;
  let secretsManagerStore: SecretsManagerStore;
  let secretsManager: SecretsManager;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    secretsManager = new SecretsManager({
      apiVersion: '2017-10-17',
      region: 'us-west-2',
    });

    secretsManagerStore = new SecretsManagerStore('unittest', 'us-west-2');
    sandbox.stub(secretsManagerStore as any, 'secretsManager').value(secretsManager);
  });

  afterEach(() => {
    sandbox.restore();
    delete process.env.AWS_REGION;
    delete process.env.REGION;
  });

  describe('Positive', async () => {
    it('should get region from AWS_REGION', async () => {
      process.env.AWS_REGION = 'us-west-2';
      const sms: SecretsManagerStore = new SecretsManagerStore('unittest');
      expect(sms).to.have.ownProperty('region').that.equals('us-west-2');
    });

    it('should get region from REGION', async () => {
      process.env.REGION = 'us-west-1';
      const sms: SecretsManagerStore = new SecretsManagerStore('unittest');
      expect(sms).to.have.property('region').that.equals('us-west-1');
    });

    it('should get region from default', async () => {
      const sms: SecretsManagerStore = new SecretsManagerStore('unittest');
      console.log('-----sms', { sms });
      expect(sms).to.have.property('region').that.equals('us-east-1');
    });

    it('should refresh() on request', async () => {
      expect(async () => await secretsManagerStore.refresh()).to.not.throw(Error);
    });

    it('should return a property from get() that exists', async () => {
      sandbox.stub(secretsManager, 'getSecretValue').value(() => {
        return { promise: () => Promise.resolve({ SecretString: '{"aboolean": true, "aninteger": 1}' }) };
      });
      const result = await secretsManagerStore.get('aboolean');
      expect(result).to.not.be.undefined;
      expect(result).to.equal(true);
    });

    it('should return a property from get() that exists as Binary', async () => {
      sandbox.stub(secretsManager, 'getSecretValue').value(() => {
        return { promise: () => Promise.resolve({ SecretBinary: Buffer.from('{"aboolean": true, "aninteger": 1}') }) };
      });
      const result = await secretsManagerStore.get('aboolean');
      expect(result).to.not.be.undefined;
      expect(result).to.equal(true);
    });

    it('should return a property from get() that exists as Date', async () => {
      sandbox.stub(secretsManager, 'getSecretValue').value(() => {
        return {
          promise: () =>
            Promise.resolve({ SecretBinary: Buffer.from('{"adate": "2012-04-23T18:25:43.511Z", "aninteger": 1}') }),
        };
      });
      const result = await secretsManagerStore.get('adate');
      expect(result).to.not.be.undefined;
      expect(result).to.eql(new Date('2012-04-23T18:25:43.511Z'));
    });

    it("should return undefined for get() for a property that doesn't exist", async () => {
      sandbox.stub(secretsManager, 'getSecretValue').value(() => {
        return { promise: () => Promise.resolve({ SecretString: '{"aboolean": true, "aninteger": 1}' }) };
      });
      const result = await secretsManagerStore.get('nonexistent');
      expect(result).to.be.undefined;
    });
  });

  describe('Negative', async () => {
    it('should fail to get() on secret that exists, but is empty', async () => {
      sandbox.stub(secretsManager, 'getSecretValue').value(() => {
        return { promise: () => Promise.resolve({ SecretString: '' }) };
      });
      try {
        await secretsManagerStore.get('aboolean');
        expect(true, 'to never happen').be.false;
      } catch (error) {
        expect(error)
          .to.haveOwnProperty('message')
          .that.equals('There is no secret string in the secret store named unittest.');
      }
    });

    it('should return undefined on DecryptionFailureException', async () => {
      sandbox.stub(secretsManager, 'getSecretValue').throws({ code: 'DecryptionFailureException' });
      const result = await secretsManagerStore.get('aboolean');
      expect(result).to.be.undefined;
    });

    it('should return undefined on InternalServiceErrorException', async () => {
      sandbox.stub(secretsManager, 'getSecretValue').throws({ code: 'InternalServiceErrorException' });
      const result = await secretsManagerStore.get('aboolean');
      expect(result).to.be.undefined;
    });

    it('should fail to get() on InvalidParameterException', async () => {
      sandbox.stub(secretsManager, 'getSecretValue').throws({ code: 'InvalidParameterException' });
      try {
        await secretsManagerStore.get('aboolean');
        expect(true, 'to never happen').be.false;
      } catch (error) {
        expect(error).to.haveOwnProperty('code').that.equals('InvalidParameterException');
      }
    });

    it('should fail to get() on InvalidRequestException', async () => {
      sandbox.stub(secretsManager, 'getSecretValue').throws({ code: 'InvalidRequestException' });
      try {
        await secretsManagerStore.get('aboolean');
        expect(true, 'to never happen').be.false;
      } catch (error) {
        expect(error).to.haveOwnProperty('code').that.equals('InvalidRequestException');
      }
    });

    it('should fail to get() on ResourceNotFoundException', async () => {
      sandbox.stub(secretsManager, 'getSecretValue').throws({ code: 'ResourceNotFoundException' });
      try {
        await secretsManagerStore.get('aboolean');
        expect(true, 'to never happen').be.false;
      } catch (error) {
        expect(error).to.haveOwnProperty('code').that.equals('ResourceNotFoundException');
      }
    });
  });
});
