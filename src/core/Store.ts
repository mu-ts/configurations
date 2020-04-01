import { Logger, LoggerService } from '@mu-ts/logger';
import { Source } from '../source/Source';
import { EnvironmentStore } from '../source/EnvironmentStore';
import { SecretsManagerStore } from '../source/SecretsManagerStore';
import { LocalStore } from '../source/LocalStore';
/**
 * Used to store the configuration sources and determine
 * the order they are consulted in.
 */
export class Store {
  private readonly logger: Logger;
  private readonly sources: Source[];

  constructor() {
    this.logger = LoggerService.named({ name: this.constructor.name, adornments: { '@mu-ts': 'configurations' } });
    this.sources = [];
  }

  // TODO add S3 Bucket/Key as a source.
  // public s3(values: { [key:string]: any }) {}

  /**
   * Internal function for referencing the internal list of
   * configuration sources. Do not reference this, its not guarenteed
   * across versions.
   */
  public get _list() {
    return this.sources;
  }

  /**
   * Tells the configuration store to use environment variables.
   */
  public environment() {
    this.sources.push(new EnvironmentStore());
    return this;
  }

  /**
   * Registers a secrets manager store as a location to lookup secrets in.
   *
   * @param storeName in AWS to lookup.
   * @param region to look for the secrets in, defaults to us-east-1
   */
  public secretManager(storeName: string, region: string = 'us-east-1'): Store {
    this.logger.debug('secretManager()', 'secrets manager store', { storeName });
    this.sources.push(new SecretsManagerStore(storeName, region));
    return this;
  }

  /**
   * Static configuration values to feed into the configuration.
   *
   * @param values to store as configuration values.
   */
  public defaults(values: { [key: string]: any }): Store {
    this.logger.debug('secretManager()', 'default store', { values });
    this.sources.push(new LocalStore(values));
    return this;
  }

  /**
   * A custom implementation to register as a source of configuration values.
   *
   * @param customSource to resovle configuration values using.
   */
  public custom(customSource: Source): Store {
    this.logger.debug('secretManager()', 'custom store being added.');
    this.sources.push(customSource);
    return this;
  }
}
