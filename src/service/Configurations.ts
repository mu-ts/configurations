import { Logger, LoggerService } from '@mu-ts/logger';
import { SecretsManagerStore } from '../source/SecretsManagerStore';
import { LocalStore } from '../source/LocalStore';
import { EnvironmentStore } from '../source/EnvironmentStore';

export class Configurations {
  private readonly logger: Logger;
  private readonly localStore: LocalStore;
  private readonly environmentStore: EnvironmentStore;
  private readonly secretStore: SecretsManagerStore;

  constructor(storeName: string | any, region?: string, defaults?: any) {
    this.logger = LoggerService.named({ name: this.constructor.name, adornments: { '@mu-ts': 'configurations' } });

    if (typeof storeName === 'string') {
      this.secretStore = new SecretsManagerStore(storeName, region);
      if (defaults) {
        this.logger.info('init()', 'setting defaults', { defaults: Object.keys(defaults).join(' ') });
        this.localStore = new LocalStore(defaults);
      }
    }

    if (typeof storeName !== 'string') {
      this.logger.info('init()', 'setting defaults', { defaults: Object.keys(storeName).join(' ') });
      this.localStore = new LocalStore(storeName);
    }

    this.environmentStore = new EnvironmentStore();

    if (!this.localStore) this.localStore = this.localStore = new LocalStore({});

    this.logger.info('init()');
  }

  /**
   *
   * @param name of the configuration value to return.
   * @param someDefault to use if no configuration value is found.
   */
  public async get<T>(name: string, someDefault?: T): Promise<T | undefined> {
    this.logger.trace('get()', { name, someDefault });

    let value: any | undefined;

    if (this.secretStore) value = await this.secretStore.get(name);

    this.logger.trace('get()', 'value after looking through environment', { value });

    if (!value) value = await this.environmentStore.get(name);

    this.logger.trace('get()', 'value after looking through environment', { value });

    if (!value) value = await this.localStore.get(name);

    this.logger.trace('get()', 'value after looking through local', { value });

    return value || someDefault;
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
