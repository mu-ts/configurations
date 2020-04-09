import 'mocha';
import { expect } from 'chai';
import 'chai-as-promised';
import { Store } from '../../src/core/Store';

describe('Store', async () => {
  beforeEach(() => {});

  afterEach(() => {});

  it('to create a new without error', async () => {
    expect(() => new Store()).to.not.throw(Error);
  });

  it('to add environment', async () => {
    const store: Store = new Store().environment();
    expect(store._list).to.have.property('length').that.equals(1);
  });

  it('to add custom', async () => {
    const store: Store = new Store().custom({
      get: async (name: string) => Promise.resolve(name),
      refresh: async () => Promise.resolve(),
    });
    expect(store._list).to.have.property('length').that.equals(1);
  });

  it('to add environment and custom', async () => {
    const store: Store = new Store().environment().custom({
      get: async (name: string) => Promise.resolve(name),
      refresh: async () => Promise.resolve(),
    });
    expect(store._list).to.have.property('length').that.equals(2);
  });
});
