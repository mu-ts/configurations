import { Logger, LoggerService } from '@mu-ts/logger';
import { Store } from './Store';
import { Source } from '../source/Source';
import { Conversionator } from './Conversionator';

export class Configurations {
  private static _i: Configurations;

  private readonly logger: Logger;
  private readonly store: Store;

  private constructor() {
    this.logger = LoggerService.named({ name: this.constructor.name, adornments: { '@mu-ts': 'configurations' } });
    this.store = new Store();
  }

  /**
   * Object containing all of the configuration sources. Can be used to register
   * new sources. The order of declaration will determine the priority order
   * of how secrets are resolved.
   */
  public static get store() {
    return this.instance.store;
  }

  /**
   * Helper for converting values that may be store string only.
   */
  public static get as() {
    return new Conversionator(this.instance);
  }

  /**
   *
   * @param name of the configuration value to return.
   * @param someDefault to use if no configuration value is found.
   */
  public static async get<T>(name: string, someDefault?: T): Promise<T | undefined> {
    const value: any | undefined = await this.instance.get(name, someDefault);
    return value;
  }

  /**
   *
   * @param name of the configuration value to return.
   * @param someDefault to use if no configuration value is found.
   */
  public async get<T>(name: string, someDefault?: T): Promise<T | undefined> {
    this.logger.trace('get()', { name, someDefault });

    const value: any | undefined = await this.store._list.reduce(async (value: any | undefined, source: Source) => {
      const resolvedValue = await value;
      if (resolvedValue) return resolvedValue;
      return await source.get(name);
    }, undefined);

    return value;
  }

  private static get instance() {
    if (!this._i) this._i = new Configurations();
    return this._i;
  }
}
