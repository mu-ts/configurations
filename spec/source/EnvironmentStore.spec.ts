import 'mocha';
import { expect, use } from 'chai';
import 'chai-as-promised';
import * as sinon from 'sinon';
import { EnvironmentStore } from '../../src/source/EnvironmentStore';

use(require('chai-as-promised'));

describe('EnvironmentStore', async () => {
  let sandbox: sinon.SinonSandbox;
  let environmentStore: EnvironmentStore;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    process.env.Aboolean = 'true';
    process.env.AString = 'world';
    process.env.aNumber = '100';

    environmentStore = new EnvironmentStore();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should return a boolean from get() that exists', async () => {
    const result = await environmentStore.get('aboolean');
    expect(result).to.not.be.undefined;
    expect(result).to.equal('true');
  });

  it('should return a number from get() that exists', async () => {
    const result = await environmentStore.get('anumber');
    expect(result).to.not.be.undefined;
    expect(result).to.equal('100');
  });

  it('should return a string from get() that exists', async () => {
    const result = await environmentStore.get('AString');
    expect(result).to.not.be.undefined;
    expect(result).to.equal('world');
  });

  it("should return undefined for get() for a property that doesn't exist", async () => {
    const result = await environmentStore.get('nonexistent');
    expect(result).to.be.undefined;
  });
});
