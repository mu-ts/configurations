import 'mocha';
import { expect, use } from 'chai';
import 'chai-as-promised';
import { Configurations } from '../../src/service/Configurations';
import * as sinon from 'sinon';

use(require('chai-as-promised'));

describe('Configurations', async () => {
  let sandbox: sinon.SinonSandbox;
  let configurations: Configurations;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    configurations = new Configurations({ aboolean: true, aninteger: 1 });
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should return a property from getAsBoolean() that exists', async () => {
    const result = await configurations.getAsBoolean('aboolean');
    expect(result).to.be.true;
    expect(result).to.be.a('boolean');
  });

  it("should return undefined for get() for a property that doesn't exist", async () => {
    const result = await configurations.get('nonexistent');
    expect(result).to.be.undefined;
  });

  it('should return a default for get() where specified and undefined in environment', async () => {
    const result = await configurations.get('nonexistent', 'defaultValue');
    expect(result).to.equal('defaultValue');
  });

  it('should return a default for getAsBoolean() where specified and undefined in environment', async () => {
    const result = await configurations.getAsBoolean('nonexistent', false);
    expect(result).to.be.a('boolean');
    expect(result).to.equal(false);
  });

  it('should return a string from the getAsString() method despite the storage type of the property', async () => {
    const fromInteger = await configurations.getAsString('aninteger');
    expect(fromInteger).to.be.a('string');

    const fromBoolean = await configurations.getAsString('aboolean');
    expect(fromBoolean).to.be.a('string');
  });
});
