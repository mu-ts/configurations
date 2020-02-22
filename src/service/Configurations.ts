import { Logger, LoggerService } from '@mu-ts/logger';
import { Store } from '../model/Store';
import { SecretsManagerStore } from '../source/SecretsManagerStore';
import { LocalStore } from '../source/LocalStore';
import { EnvironmentStore } from '../source/EnvironmentStore';

export class Configurations {
  private readonly logger: Logger;
  private readonly stores: Store[];

  constructor(storeName: string | any, region?: string, defaults?: any) {
    this.logger = LoggerService.named({ name: this.constructor.name, adornments: { '@mu-ts': 'configurations' } });

    this.stores = [];

    if (typeof storeName === 'string') {
      this.stores.push(new SecretsManagerStore(storeName, region));
      if (defaults) {
        this.logger.info('init()', 'setting defaults', { defaults: Object.keys(defaults).join(' ') });
        this.stores.push(new LocalStore(defaults));
      }
    }

    if (typeof storeName !== 'string') {
      this.logger.info('init()', 'setting defaults', { defaults: Object.keys(storeName).join(' ') });
      this.stores.push(new LocalStore(storeName as any));
    }

    this.stores.push(new EnvironmentStore());
    this.stores.sort((first: Store, second: Store) => first.priority() - second.priority());

    this.logger.info('init()', { stores: this.stores.map((store: Store) => store.constructor.name) });
  }

  /**
   *
   * @param name of the configuration value to return.
   * @param someDefault to use if no configuration value is found.
   */
  public async get(name: string, someDefault?: any): Promise<any | undefined> {
    this.logger.trace('get()', { name, someDefault });
    const value: any | undefined = this.stores.reduce((value: any | undefined, store: Store) => {
      if (value) return value;
      return store.get(name);
    }, undefined);
    this.logger.trace('get()', { value });
    if (value) return value;
    return someDefault;
  }

  /**
   *
   * @param name of the configuration to return.
   * @param someDefault to use if no configuration value is found.
   */
  public async getAsBoolean(name: string, someDefault?: boolean): Promise<boolean> {
    let value: string | object | undefined = await this.get(name);
    if (!value) value = `${someDefault || false}`;
    return typeof value === 'string' ? value.toLowerCase() === 'true' : JSON.parse(<any>value) == true;
  }

  /**
   *
   * @param name of the configuration to return.
   * @param someDefault to use if no configuration value is found.
   */
  public async getAsNumber(name: string, someDefault?: number): Promise<number | undefined> {
    const value: string | object | undefined = await this.get(name);
    if (!value) return someDefault;
    return Number(value);
  }

  /**
   *
   * @param name of the configuration to return.
   * @param someDefault to use if no configuration value is found.
   */
  public async getAsString(name: string, someDefault?: string): Promise<string | undefined> {
    const value: string | object | undefined = await this.get(name);
    if (!value) return someDefault;
    return '' + value;
  }
}

new Configurations({ aboolean: true, aninteger: 1 }).get('aboolean').then((value: any) => console.log('value', value));
