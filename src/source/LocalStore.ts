import { Logger, LoggerService } from '@mu-ts/logger';

import { Source } from './Source';
import { SecureCache } from '../core/SecureCache';

/**
 * In memory store.
 */
export class LocalStore implements Source {
  private readonly secureCache: SecureCache;
  private readonly logger: Logger;

  constructor(defaults: any) {
    this.logger = LoggerService.named({ name: this.constructor.name, adornments: { '@mu-ts': 'configurations' } });
    this.secureCache = new SecureCache();

    for (const key in defaults) {
      this.secureCache.set(key, defaults[key]);
    }
    this.logger.info('init()');
  }
  public get(name: string): Promise<any | undefined> {
    return this.secureCache.get(name);
  }
}
