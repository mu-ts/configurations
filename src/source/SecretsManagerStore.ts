import { GetSecretValueRequest, GetSecretValueResponse, SecretsManager } from '@aws-sdk/client-secrets-manager';

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
  public readonly region: string | undefined;
  private readonly secureCache: SecureCache;
  private readonly secretsManager: SecretsManager;

  constructor(storeName: string, region?: string) {
    this.logger = LoggerService.named({ name: this.constructor.name, adornments: { '@mu-ts': 'configurations' } });

    this.storeName = storeName;
    this.region = region || process.env.AWS_REGION || process.env.REGION || 'us-east-1';
    this.secureCache = new SecureCache();
    this.logger.debug('Creating secretsManager client', {
      region: this.region,
    });

    this.secretsManager = new SecretsManager({
      apiVersion: '2017-10-17',
      region: this.region,
      maxAttempts: 3,
      retryMode: 'standard',
      defaultsMode: 'standard',
    });

    this.logger.info('init()');
  }

  /**
   *
   * @param name of the value to lookup.
   */
  public async get(name: string): Promise<any | undefined> {
    /**
     * Lazy load secrets until one is requested, and it is not stored
     * elsewhere.
     */
    if (!this.secureCache.get(`_mu-ts-cfg_${this.storeName}`)) {
      this.logger.debug('get()', 'Loading configurations from secrets manager.');
      await this.load();
      this.secureCache.set(`_mu-ts-cfg_${this.storeName}`, true);
    }
    return this.secureCache.get(name);
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

      // In this sample we only handle the specific exceptions for the 'GetSecretValue' API.
      // See https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
      // We rethrow the exception by default.
      const response: GetSecretValueResponse = await this.secretsManager.getSecretValue(parameters);

      this.logger.debug('load()', 'done');

      let values: { [key: string]: { [key: string]: string } | string };

      if ('SecretString' in response) {
        this.logger.debug('load()', 'Looking within "SecretString"');

        if (response.SecretString) values = JSON.parse(response.SecretString);
      } else {
        this.logger.debug('load()', 'Looking within "SecretBinary"');

        const buff: Buffer = Buffer.from(response.SecretBinary as Buffer);
        const decodedBinarySecret: string = buff.toString('ascii');

        if (decodedBinarySecret) values = JSON.parse(decodedBinarySecret);
      }

      if (!values) {
        this.logger.error('load()', 'There is no secret string in the secret store.');
        throw Error(`There is no secret string in the secret store named ${this.storeName}.`);
      }

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
       * There are plenty of conditions around connectivity where secrets re-loading
       * will recover the configuration, so this allows the exception to log and continue.
       * In the future, we will be more explicit about these failures.
       */
      if (error.code === 'DecryptionFailureException') {
        // Secrets Manager can't decrypt the protected secret text using the provided KMS key.
        // Deal with the exception here, and/or rethrow at your discretion.
        this.logger.warn('load()', 'Exception raised while trying to load secrets.', error);
        /**
         * Give the system a chance to self-heal.
         */
        return undefined;
      } else if (error.code === 'InternalServiceErrorException') {
        // An error occurred on the server side.
        // Deal with the exception here, and/or rethrow at your discretion.
        this.logger.warn('load()', 'Exception raised while trying to load secrets.', error);
        /**
         * Give the system a chance to self-heal.
         */
        return undefined;
      } else if (error.code === 'InvalidParameterException') {
        // You provided an invalid value for a parameter.
        // Deal with the exception here, and/or rethrow at your discretion.
        this.logger.error('load()', 'Exception raised while trying to load secrets.', error);
        throw error;
      } else if (error.code === 'InvalidRequestException') {
        // You provided a parameter value that is not valid for the current state of the resource.
        // Deal with the exception here, and/or rethrow at your discretion.
        this.logger.error('load()', 'Exception raised while trying to load secrets.', error);
        throw error;
      } else if (error.code === 'ResourceNotFoundException') {
        // We can't find the resource that you asked for.
        // Deal with the exception here, and/or rethrow at your discretion.
        this.logger.error('load()', 'Exception raised while trying to load secrets.', error);
        throw error;
      } else {
        this.logger.error('load()', 'Exception raised while trying to load secrets.', error);
        throw error;
      }
    }
  }
}
