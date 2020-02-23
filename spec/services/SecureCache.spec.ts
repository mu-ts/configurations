import 'mocha';
import { expect, use } from 'chai';
import 'chai-as-promised';
import { SecureCache } from '../../src/service/SecureCache';
import * as sinon from 'sinon';

use(require('chai-as-promised'));

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

    it('date', async () => {
      const expectedDate: Date = new Date();
      cache.set('foo', expectedDate);
      const date: Date = cache.get('foo');
      expect(date).to.not.be.undefined;
      expect(date).to.be.string;
      expect(date.valueOf()).to.equal(expectedDate.valueOf());
    });

    it('boolean', async () => {
      cache.set('foo', true);
      let abool: boolean = cache.get('foo');
      expect(abool).to.not.be.undefined;
      expect(abool).to.be.true;

      cache.set('foo', false);
      abool = cache.get('foo');
      expect(abool).to.not.be.undefined;
      expect(abool).to.be.false;
    });

    it('number', async () => {
      cache.set('foo', 1);
      let abool: number = cache.get('foo');
      expect(abool).to.not.be.undefined;
      expect(abool).to.equal(1);

      cache.set('foo', -1);
      abool = cache.get('foo');
      expect(abool).to.not.be.undefined;
      expect(abool).to.equal(-1);

      cache.set('foo', 0);
      abool = cache.get('foo');
      expect(abool).to.not.be.undefined;
      expect(abool).to.equal(0);
    });

    it('undefined', async () => {
      let foo: undefined | number = cache.get('foo');
      expect(foo).to.be.undefined;
      expect(foo).to.equals(undefined);

      cache.set('foo', 0);
      foo = cache.get('foo');
      expect(foo).to.not.be.undefined;

      cache.set('foo', undefined);
      foo = cache.get('foo');
      expect(foo).to.be.undefined;
      expect(foo).to.equals(undefined);
    });

    it('null', async () => {
      cache.set('foo', null);
      let foo: undefined | number = cache.get('foo');
      expect(foo).to.be.undefined;
      expect(foo).to.equals(undefined);
    });
  });
});
