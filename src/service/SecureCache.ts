import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';

/**
 * Securely stores values in cache so they are erncrypted
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

  public get(name: string): any | undefined {
    const value: Buffer | undefined = this.values[name];
    if (!value) return undefined;
    return this.show(value);
  }

  public set(name: string, value: any): void {
    if (!value) return;
    this.values[name] = this.hide(JSON.stringify(value));
  }

  /**
   *
   * @param value to cache.
   */
  private hide(value: any): Buffer {
    if (!value) return undefined;
    const cipher = createCipheriv(this.algorithm, this.key, this.iv);
    const encrypted = cipher.update(value);
    return Buffer.concat([encrypted, cipher.final()]);
  }

  /**
   * Returns the string stored in cache.
   */
  private show(value: Buffer | undefined): string | undefined {
    if (!value) return undefined;
    const decipher = createDecipheriv(this.algorithm, this.key, this.iv);
    const decrypted = decipher.update(value);
    return Buffer.concat([decrypted, decipher.final()]).toString();
  }
}
