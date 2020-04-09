import { SecretsManager } from 'aws-sdk';
import { GetSecretValueRequest, GetSecretValueResponse } from 'aws-sdk/clients/secretsmanager';

import { Logger, LoggerService } from '@mu-ts/logger';

import { Source } from './Source';
import { SecureCache } from '../core/SecureCache';

/**
 * Retrieve from AWS Secrets Manager
 */
export class SecretsManagerStore implements Source {
  private readonly DATE_REGEX: RegExp = new RegExp(
    /^(\d{4})(?:-?W(\d+)(?:-?(\d+)D?)?|(?:-(\d+))?-(\d+))(?:[T ](\d+):(\d+)(?::(\d+)(?:\.(\d+))?)?)?(?:Z(-?\d*))?$/g
  );
  private readonly logger: Logger;
  private readonly storeName: string;
  private readonly region: string | undefined;
  private readonly secureCache: SecureCache;
  private readonly secretsManager: SecretsManager;

  constructor(storeName: string, region?: string) {
    this.logger = LoggerService.named({ name: this.constructor.name, adornments: { '@mu-ts': 'configurations' } });

    this.storeName = storeName;
    this.region = region;
    this.secureCache = new SecureCache();
    this.secretsManager = new SecretsManager({
      apiVersion: '2017-10-17',
      region: this.region || process.env.AWS_REGION || process.env.REGION || 'us-east-1',
    });

    this.logger.info('init()');
  }

  /**
   *
   * @param name of the value to lookup.
   * @param someDefault
   */
  public async get(name: string): Promise<any | undefined> {
    /**
     * Lazy load secrets until one is requested and it is not stored
     * elsewhere.
     */
    if (!this.secureCache.get(`_mu-ts-cfg_${this.storeName}`)) {
      this.logger.debug('get()', 'Loading configurations from secrets manager.');
      await this.load();
      this.secureCache.set(`_mu-ts-cfg_${this.storeName}`, true);
    }
    let value: any = this.secureCache.get(name);
    return value;
  }

  /**
   *
   */
  public async refresh(): Promise<void> {
    this.logger.debug('refresh()', 'refresh requested.');
    await this.load();
  }

  /**
   * Loads secrets for the configured storeName.
   */
  private async load(): Promise<void> {
    try {
      this.logger.debug('load()', 'start');

      const parameters: GetSecretValueRequest = {
        SecretId: this.storeName,
        VersionStage: 'AWSCURRENT',
      };

      this.logger.debug('load()', 'requesting secrets', { parameters });
      const response: GetSecretValueResponse = await this.secretsManager.getSecretValue(parameters).promise();

      this.logger.debug('load()', 'done');

      if (!response.SecretString) {
        this.logger.error('load()', 'There is no secret stringin the secret store.');
        throw Error(`There is no secret string in the secret store named ${this.storeName}.`);
      }

      const values: { [key: string]: { [key: string]: string } | string } = JSON.parse(response.SecretString);

      this.logger.debug('load()', 'values parsed from secrets.');

      for (const key in values) {
        if (typeof values[key] === 'string' && this.DATE_REGEX.test(values[key] as string)) {
          this.secureCache.set(key, new Date(values[key] as string));
        } else {
          this.secureCache.set(key, values[key]);
        }
      }
    } catch (error) {
      /**
       * When a secret name is not properly defined, we cannot 'recover' from it so
       * throw a hard failure.
       */
      if (error.message.startsWith('There is no secret')) throw error;
      /**
       * There are plenty of conditions around connectivity where secrets re-loading
       * will recover the configuration, so this allows the exception to log and continue.
       * In the future, we will be more explicit about these failures.
       */
      this.logger.error('load()', 'Exception raised while trying to load secrets.', error);
    }
  }
}
