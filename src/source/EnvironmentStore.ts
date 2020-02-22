import { Store } from '../model/Store';

/**
 * Uses environment variables.
 */
export class EnvironmentStore implements Store {
  public priority(): number {
    return 5;
  }

  public get(name: string): Promise<any | undefined> {
    const value: string | undefined = process.env[name];
    if (!value) return Promise.resolve();
    else return Promise.resolve(value);
  }
}
