import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import { CacheValue } from '../model/CacheValue';

/**
 * Securely stores values in cache, so they are encrypted
 * while in memory and are a touch harder to discover.
 *
 * Note: Logging is deliberately avoided in this function to keep from providing
 * any accidental insight into the stored values.
 */
export class SecureCache {
  private readonly key: Buffer;
  private readonly iv: Buffer;
  private readonly algorithm: string = 'aes-256-cbc';
  private readonly values: { [key: string]: Buffer };

  constructor() {
    this.key = randomBytes(32);
    this.iv = randomBytes(16);
    this.values = {};
  }

  /**
   *
   * @param name
   * @param value
   */
  public set(name: string, value: any): void {
    switch (typeof value) {
      case 'undefined':
        delete this.values[name];
      case 'function':
      case 'symbol':
        return undefined;
      case 'object':
        if (value instanceof Date) {
          this.values[name] = this.hide(
            JSON.stringify({
              type: 'date',
              value: value.valueOf(),
            })
          );
          break;
        }
      case 'string':
      case 'number':
      case 'boolean':
      default:
        if (value === null) delete this.values[name];
        else
          this.values[name] = this.hide(
            JSON.stringify({
              type: typeof value,
              value: value,
            })
          );
    }
  }

  /**
   *
   * @param name
   */
  public get<T extends string | boolean | number | Date | object>(name: string): T | undefined {
    if (!this.values[name]) return undefined;
    const entry: CacheValue = JSON.parse(this.show(this.values[name]));
    switch (entry.type) {
      case 'undefined':
      case 'function':
      case 'symbol':
        return undefined;
      case 'date':
        return new Date(entry.value as number) as T;
      case 'object':
      case 'string':
      case 'number':
      case 'boolean':
      default:
        return entry.value as T;
    }
  }

  /**
   *
   * @param value to cache.
   */
  private hide(value: any): Buffer {
    const cipher = createCipheriv(this.algorithm, this.key, this.iv);
    const encrypted = cipher.update(value);
    return Buffer.concat([encrypted, cipher.final()]);
  }

  /**
   * Returns the string stored in cache.
   */
  private show(value: Buffer | undefined): string | undefined {
    const decipher = createDecipheriv(this.algorithm, this.key, this.iv);
    const decrypted = decipher.update(value);
    return Buffer.concat([decrypted, decipher.final()]).toString();
  }
}
