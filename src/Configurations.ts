import * as AWS from 'aws-sdk';
import * as crypto from 'crypto';
import { GetSecretValueRequest, GetSecretValueResponse } from 'aws-sdk/clients/secretsmanager';

/**
 * Securely stores values in cache so they are erncrypted
 * while in memory and are a touch harder to discover.
 */
class SecureCache {
  private key: Buffer;
  private cache: Buffer | undefined;
  private algorithm: string = 'aes-256-cbc';

  constructor(key: Buffer) {
    this.key = key;
  }

  /**
   *
   * @param value to cache.
   */
  public set(value: string): void {
    const cipher = crypto.createCipher('aes-256-cbc', Buffer.from(this.key));
    const encrypted = cipher.update(value);
    this.cache = Buffer.concat([encrypted, cipher.final()]);
  }

  /**
   * Returns the string stored in cache.
   */
  public get(): string | undefined {
    if (!this.cache) return undefined;
    const decipher = crypto.createDecipher('aes-256-cbc', this.key);
    const decrypted = decipher.update(this.cache);
    return Buffer.concat([decrypted, decipher.final()]).toString();
  }
}

export class Configurations {
  private secretsManager: AWS.SecretsManager;
  private storeName: string;
  private static globalRegion: string;
  private cache: SecureCache;

  constructor(storeName: string, region?: string) {
    this.storeName = storeName;
    this.secretsManager = new AWS.SecretsManager({
      apiVersion: '2017-10-17',
      region: region || Configurations.globalRegion,
    });
    this.cache = new SecureCache(crypto.randomBytes(32));
  }

  /**
   *
   * @param region to use for secret stores when one is not provided at instance creation.
   */
  public static setRegion(region: string) {
    Configurations.globalRegion = region;
  }

  /**
   *
   * @param name of the configuration value to return.
   * @param someDefault to use if no configuration value is found.
   */
  public async get(name: string, someDefault?: any): Promise<any | undefined> {
    let secretString: string | undefined = this.cache.get();
    if (!secretString) secretString = await this.loadSecrets();
    if (!secretString) return process.env[name] || someDefault;
    const values: { [key: string]: { [key: string]: string } | string } = JSON.parse(secretString);
    return values[name] || process.env[name] || someDefault;
  }

  /**
   *
   * @param name of the configuration to return.
   * @param someDefault to use if no configuration value is found.
   */
  public async getAsBoolean(name: string, someDefault?: boolean): Promise<boolean> {
    const value: string | object | undefined = await this.get(name);
    if (!value) return someDefault || false;
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

  /**
   * Loads secrets for the configured storeName.
   */
  private async loadSecrets(): Promise<string> {
    const parameters: GetSecretValueRequest = {
      SecretId: this.storeName,
      VersionStage: 'AWSCURRENT',
    };
    const response: GetSecretValueResponse = await this.secretsManager.getSecretValue(parameters).promise();
    if (!response.SecretString) throw Error(`There is no secret string in the secret store named ${this.storeName}.`);
    return response.SecretString;
  }
}
