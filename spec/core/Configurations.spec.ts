import 'mocha';
import { expect, use } from 'chai';
import 'chai-as-promised';
import { Configurations } from '../../src/core/Configurations';
import * as sinon from 'sinon';

use(require('chai-as-promised'));

describe('Configurations as defaults', async () => {
  let sandbox: sinon.SinonSandbox;
  let defaults: any = {
    aboolean: true,
    astring: 'foo',
    anumber: 1,
    adate: new Date(),
    aobject: { foo: 'bar' },
  };

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    Configurations.store.defaults(defaults);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('get', async () => {
    it('string', async () => {
      const result: string = await Configurations.get('astring');
      expect(result).to.not.be.undefined;
      expect(result).to.be.string;
      expect(result).to.equal('foo');
    });

    it('boolean', async () => {
      const result: boolean = await Configurations.get('aboolean');
      expect(result).to.not.be.undefined;
      expect(result).to.be.true;
      expect(result).to.be.a('boolean');
    });

    it('date', async () => {
      const result: Date = await Configurations.get('adate');
      expect(result).to.not.be.undefined;
      expect(result.valueOf()).to.equal(defaults.adate.valueOf());
    });

    it('number', async () => {
      const result: number = await Configurations.get('anumber');
      expect(result).to.not.be.undefined;
      expect(result).to.be.a('number');
      expect(result).to.equal(defaults.anumber);
    });

    it('object', async () => {
      const result: object = await Configurations.get('aobject');
      expect(result).to.not.be.undefined;
      expect(result).to.be.a('object');
      expect(result).to.eql(defaults.aobject);
    });
  });

  describe('as.boolean', async () => {
    it('boolean', async () => {
      const result: boolean = await Configurations.as.boolean('aboolean');
      expect(result).to.not.be.undefined;
      expect(result).to.be.true;
      expect(result).to.be.a('boolean');
    });
  });

  describe('as.object', async () => {
    it('object', async () => {
      const result: boolean = await Configurations.as.object('aobject');
      expect(result).to.not.be.undefined;
      expect(result).to.be.a('object');
      expect(result).to.eql(defaults.aobject);
    });
  });

  describe('as.string', async () => {
    it('boolean', async () => {
      const result: string = await Configurations.as.string('astring');
      expect(result).to.not.be.undefined;
      expect(result).to.be.a('string');
      expect(result).to.equal('foo');
    });
  });

  describe('as.number', async () => {
    it('boolean', async () => {
      const result: number = await Configurations.as.number('anumber');
      expect(result).to.not.be.undefined;
      expect(result).to.be.a('number');
      expect(result).to.equal(1);
    });
  });
});
