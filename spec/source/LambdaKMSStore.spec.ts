import 'mocha';
import { expect, use } from 'chai';
import 'chai-as-promised';
import * as sinon from 'sinon';
import { KMS } from '@aws-sdk/client-kms';
import { Lambda } from '@aws-sdk/client-lambda';
import { LambdaKMSStore } from '../../src/source/LambdaKMSStore';
import { SecureCache } from '../../src/core/SecureCache';

use(require('chai-as-promised'));

describe('LambdaKMSStore', async () => {
  let sandbox: sinon.SinonSandbox;
  let lambdaKMSStore: LambdaKMSStore;
  let kms: KMS;
  let lambda: Lambda;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    lambda = new Lambda({
      region: 'us-west-2',
    });
    lambda.invoke = () =>
      ({
        promise: () =>
          Promise.resolve({
            StatusCode: 200,
            Payload: `{"blob": "eyJoZWxsbyI6IndvcmxkIn0=", "encoding": "base64"}`,
          } as any),
      } as any);

    kms = new KMS({
      region: 'us-west-2',
    });
    kms.decrypt = () =>
      ({
        promise: () =>
          Promise.resolve({
            EncryptionAlgorithm: '',
            KeyId: '',
            Plaintext: Buffer.from('{"FOO":"BAR"}'),
          } as any),
      } as any);

    const secureCache: SecureCache = new SecureCache();
    secureCache.set('aboolean', 'true');
    secureCache.set('anumber', '100');
    secureCache.set('AString', 'world');

    lambdaKMSStore = new LambdaKMSStore(
      'arn:lambda:test',
      'arn:kms',
      'development test-service',
      'ISSUER',
      'FOO_BAR',
      'anumber',
      'aboolean',
      'AString'
    );
    sandbox.stub(lambdaKMSStore as any, 'kms').value(kms);
    sandbox.stub(lambdaKMSStore as any, 'lambda').value(lambda);
    sandbox.stub(lambdaKMSStore as any, 'initialized').value(true);
    sandbox.stub(lambdaKMSStore as any, 'secureCache').value(secureCache);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should refresh successfully', async () => {
    await lambdaKMSStore.refresh();
    expect((lambdaKMSStore as any).initialized).to.equal(true);
  });

  it('should return a boolean from get() that exists', async () => {
    const result = await lambdaKMSStore.get('aboolean');
    expect(result).to.not.be.undefined;
    expect(result).to.equal('true');
  });

  it('should return a number from get() that exists', async () => {
    const result = await lambdaKMSStore.get('anumber');
    expect(result).to.not.be.undefined;
    expect(result).to.equal('100');
  });

  it('should return a string from get() that exists', async () => {
    const result = await lambdaKMSStore.get('AString');
    expect(result).to.not.be.undefined;
    expect(result).to.equal('world');
  });

  it("should return undefined for get() for a property that doesn't exist", async () => {
    const result = await lambdaKMSStore.get('nonexistent');
    expect(result).to.be.undefined;
  });
});
