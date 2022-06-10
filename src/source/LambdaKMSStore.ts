import { KMS, Lambda } from 'aws-sdk';

import { Logger, LoggerService } from '@mu-ts/logger';

import { Source } from './Source';
import { SecureCache } from '../core/SecureCache';
import { PromiseResult } from "aws-sdk/lib/request";
import { AWSError } from "aws-sdk/lib/error";

/**
 * This expects to interact with a Lambda service to request secrets and get back an encrypted value
 * where KMS decrypt is needed in order to get the secrets.
 */
export class LambdaKMSStore implements Source {
  private readonly secureCache: SecureCache;
  private readonly logger: Logger;
  private readonly region: string;
  private readonly kmsARN: string;
  private readonly lambdaARN: string;
  private readonly secrets: string;
  private readonly keys: string[];
  private readonly lambda: Lambda;
  private readonly kms: KMS;
  private initialized: boolean = false;
  private loading: Promise<any>;

  /**
   * This object must be initialized with all the configuration keys you expect to load.
   *
   * @param lambdaARN the full ARN of the lambda that will be invoked to return the secrets.
   * @param kmsARN the full ARN of the KMS used to decrypt the secrets returned.
   * @param secrets a comma separated list of the secret sources to consider.
   * @param keys all of the keys that you want to retrieve from the configuration source later.
   */
  constructor(lambdaARN: string, kmsARN: string, secrets: string, ...keys: string[]) {
    this.logger = LoggerService.named({ name: this.constructor.name, adornments: { '@mu-ts': 'configurations' } });
    this.secureCache = new SecureCache();
    this.region = process.env.AWS_REGION || process.env.REGION || 'us-east-1';
    this.lambdaARN = lambdaARN;
    this.kmsARN = kmsARN;
    this.secrets = secrets;
    this.keys = keys;
    this.lambda = new Lambda({
      region: this.region,
      maxRetries: 3,
      httpOptions: {
        timeout: 5000,
        connectTimeout: 5000,
      },
    });
    this.kms = new KMS({ region: this.region });
    this.initialized = false;
    this.logger.info('init()');
  }

  /**
   * Invoke the lambda function and retrieve all the requested config keys.
   */
  public async refresh(): Promise<void> {
    this.logger.info('refresh()', { isLoading: !!this.loading });
    if (this.loading) return this.loading;

    this.loading = new Promise<void>(async (resolve, reject) => {
      const request: Lambda.InvocationRequest = {
        FunctionName: this.lambdaARN, // the lambda function we are going to invoke
        InvocationType: 'RequestResponse',
        LogType: 'Tail',
        Payload: JSON.stringify({
          kms: this.kmsARN,
          for: this.secrets,
          keys: this.keys,
        }),
      };
      this.logger.debug('refresh()', { request });

      const response: PromiseResult<Lambda.Types.InvocationResponse, AWSError> = await this.lambda.invoke(request).promise();
      if (response.StatusCode !== 200 || !response.Payload) throw response;

      // @ts-ignore
      const payload: { blob: string; encoding: string } = JSON.parse(Buffer.from(response.Payload).toString());
      this.logger.debug('refresh()', { payload });

      const decryptResult: KMS.DecryptResponse = await this.kms
        .decrypt({ CiphertextBlob: Buffer.from(payload.blob, payload.encoding as BufferEncoding) })
        .promise();

      if (Buffer.isBuffer(decryptResult.Plaintext)) {
        const secrets: { [key: string]: string } = JSON.parse(Buffer.from(decryptResult.Plaintext).toString());
        Object.keys(secrets).forEach((key: string) => this.secureCache.set(key, secrets[key]));
        this.logger.debug('refresh()', 'complete');
        this.initialized = true;
        this.loading = undefined;
        this.logger.info('refresh()', 'resolved()');
        resolve();
      } else {
        reject(new Error('We have a problem.'));
      }
    });
    return this.loading;
  }

  public async get(name: string): Promise<any | undefined> {
    if (!this.keys.includes(name)) {
      this.logger.warn('get()', 'Requesting a secret that will not be loaded from the secret store.');
      return Promise.resolve(undefined);
    }
    if (!this.initialized) await this.refresh();
    return this.secureCache.get(name);
  }
}
