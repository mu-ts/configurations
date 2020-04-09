import { Logger, LoggerService } from '@mu-ts/logger';
import { Source } from './Source';

/**
 * Uses environment variables.
 */
export class EnvironmentStore implements Source {
  private readonly logger: Logger;

  constructor() {
    this.logger = LoggerService.named({ name: this.constructor.name, adornments: { '@mu-ts': 'configurations' } });
    this.logger.info('init()');
  }
  /**
   *
   */
  public async refresh(): Promise<void> {
    this.logger.debug('refresh()', 'refresh requested, doing nothing.');
  }

  public get(name: string): Promise<any | undefined> {
    const value: string | undefined = process.env[name];
    if (!value) return Promise.resolve();
    else return Promise.resolve(value);
  }
}
