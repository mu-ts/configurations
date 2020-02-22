import 'mocha';
import { expect, use } from 'chai';
import 'chai-as-promised';
import { SecureCache } from '../../src/service/SecureCache';
import * as sinon from 'sinon';
import * as AWS from 'aws-sdk';

use(require('chai-as-promised'));

process.env.LOG_LEVEL = 'trace';

describe('SecureCache', async () => {
  describe('set', async () => {
    let sandbox: sinon.SinonSandbox;
    let cache: SecureCache;

    beforeEach(() => {
      sandbox = sinon.createSandbox();
      cache = new SecureCache();
    });

    afterEach(() => {
      sandbox.restore();
    });

    it('string', async () => {
      expect(() => cache.set('foo', 'bar')).to.not.throw(Error);
    });

    it('date', async () => {
      expect(() => cache.set('foo', new Date())).to.not.throw(Error);
    });

    it('boolean', async () => {
      expect(() => cache.set('foo', true)).to.not.throw(Error);
      expect(() => cache.set('foo', false)).to.not.throw(Error);
    });

    it('number', async () => {
      expect(() => cache.set('foo', 1)).to.not.throw(Error);
      expect(() => cache.set('foo', -1231)).to.not.throw(Error);
      expect(() => cache.set('foo', 0)).to.not.throw(Error);
    });

    it('undefined', async () => {
      expect(() => cache.set('foo', undefined)).to.not.throw(Error);
    });

    it('null', async () => {
      expect(() => cache.set('foo', null)).to.not.throw(Error);
    });
  });

  describe('get', async () => {
    let sandbox: sinon.SinonSandbox;
    let cache: SecureCache;

    beforeEach(() => {
      sandbox = sinon.createSandbox();
      cache = new SecureCache();
    });

    afterEach(() => {
      sandbox.restore();
    });

    it('string', async () => {
      cache.set('foo', 'bar');
      const foo: string = cache.get('foo');
      expect(foo).to.not.be.undefined;
      expect(foo).to.be.string;
      expect(foo).to.equals('bar');
    });

    // it('date', async () => {
    //   expect(() => cache.set('foo', new Date())).to.not.throw(Error);
    // });

    // it('boolean', async () => {
    //   expect(() => cache.set('foo', true)).to.not.throw(Error);
    //   expect(() => cache.set('foo', false)).to.not.throw(Error);
    // });

    // it('number', async () => {
    //   expect(() => cache.set('foo', 1)).to.not.throw(Error);
    //   expect(() => cache.set('foo', -1231)).to.not.throw(Error);
    //   expect(() => cache.set('foo', 0)).to.not.throw(Error);
    // });

    // it('undefined', async () => {
    //   expect(() => cache.set('foo', undefined)).to.not.throw(Error);
    // });

    // it('null', async () => {
    //   expect(() => cache.set('foo', null)).to.not.throw(Error);
    // });
  });
});
