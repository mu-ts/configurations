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

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    const secretsManager = new SecretsManager({
      apiVersion: '2017-10-17',
      region: 'us-west-2',
    });

    sandbox.stub(secretsManager, 'getSecretValue').value(() => {
      return { promise: () => Promise.resolve({ SecretString: '{"aboolean": true, "aninteger": 1}' }) };
    });

    secretsManagerStore = new SecretsManagerStore('unittest', 'us-west-2');
    sandbox.stub(secretsManagerStore as any, 'secretsManager').value(secretsManager);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should return a property from get() that exists', async () => {
    const result = await secretsManagerStore.get('aboolean');
    expect(result).to.not.be.undefined;
    expect(result).to.equal(true);
  });

  it("should return undefined for get() for a property that doesn't exist", async () => {
    const result = await secretsManagerStore.get('nonexistent');
    expect(result).to.be.undefined;
  });
});