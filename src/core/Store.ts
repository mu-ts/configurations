import { Logger, LoggerService } from '@mu-ts/logger';
import { Source } from '../source/Source';
import { EnvironmentStore } from '../source/EnvironmentStore';
import { SecretsManagerStore } from '../source/SecretsManagerStore';
import { LocalStore } from '../source/LocalStore';
import { LambdaKMSStore } from '../source/LambdaKMSStore';
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
    this.logger.debug('environment()', 'environment store');
    this.sources.push(new EnvironmentStore());
    return this;
  }

  /**
   * Tells the configuration store to use environment variables.
   */
  public lambdaKMSStore(lambdaARN: string, kmsARN: string, secrets: string, ...keys: string[]) {
    this.logger.debug('environment()', 'environment store');
    this.sources.push(new LambdaKMSStore(lambdaARN, kmsARN, secrets, ...keys));
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
    this.logger.debug('defaults()', 'default store', { values });
    this.sources.push(new LocalStore(values));
    return this;
  }

  /**
   * A custom implementation to register as a source of configuration values.
   *
   * @param customSource to resovle configuration values using.
   */
  public custom(customSource: Source): Store {
    this.logger.debug('custom()', 'custom store being added.');
    this.sources.push(customSource);
    return this;
  }
}
