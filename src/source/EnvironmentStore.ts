import { Source } from './Source';

/**
 * Uses environment variables.
 */
export class EnvironmentStore implements Source {
  public get(name: string): Promise<any | undefined> {
    const value: string | undefined = process.env[name];
    if (!value) return Promise.resolve();
    else return Promise.resolve(value);
  }
}
