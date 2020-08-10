import { Logger, LoggerService } from '@mu-ts/logger';
import { Store } from './Store';
import { Source } from '../source/Source';
import { Conversionator } from './Conversionator';

export class Configurations {
  private static _i: Configurations;
  private missThreshold: number = 5;
  private misses: number = 0;

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
   * @param someDefault to use if no configuration value is found. Using this value bypasses source reloading on to many misses.
   */
  public static async get<T>(name: string, someDefault?: T): Promise<T | undefined> {
    const value: any | undefined = await this.instance.get(name, someDefault);
    return value;
  }

  /**
   *
   * @param name of the configuration value to return.
   * @param someDefault to use if no configuration value is found. Using this value bypasses source reloading on to many misses.
   */
  public async get<T>(name: string, someDefault?: T): Promise<T | undefined> {
    this.logger.trace('get()', { name, someDefault });

    let value: any | undefined = await this.findInStores(name, someDefault);

    /**
     * If secrets are aggressively missed, reload them from their source to
     * ensure the have not gone stale.
     */
    if (value === undefined || value === null) this.misses++;
    if (this.misses > this.missThreshold) {
      this.misses = 0;
      this.logger.info('get()', 'More than 5 misses on getting the name provided, reloading stores.');

      await this.refresh();

      value = await this.findInStores(name, someDefault);

      this.logger.info('get()', 'All stores refreshed.');
    }

    return value;
  }

  /**
   * Force all value to reload.
   */
  public async refresh(): Promise<void> {
    await Promise.all(this.store._list.map((store: Source) => store.refresh()));
    return;
  }

  /**
   *
   * @param name of the value to locate
   * @param someDefault to use if nothing is found.
   */
  private async findInStores(name: string, someDefault?: any): Promise<any> {
    const value: any = await this.store._list.reduce(async (value: any | undefined, source: Source) => {
      const resolvedValue = await value;
      if (resolvedValue) return resolvedValue;
      return await source.get(name);
    }, undefined);

    if (!value) return someDefault;
    return value;
  }

  private static get instance() {
    if (!this._i) this._i = new Configurations();
    return this._i;
  }
}
