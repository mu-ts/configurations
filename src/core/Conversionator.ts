import { Configurations } from './Configurations';

export class Conversionator {
  private readonly configurations: Configurations;

  constructor(configurations: Configurations) {
    this.configurations = configurations;
  }

  public async string(name: string, someDefault?: string): Promise<string> {
    const value: string | object | undefined = await this.configurations.get(name, someDefault);
    return String(value);
  }

  public async boolean(name: string, someDefault?: boolean): Promise<boolean> {
    let value: string | object | boolean | undefined = await this.configurations.get(name, someDefault);
    if (!value) value = `${false}`;
    return typeof value === 'string' ? value.toLowerCase() === 'true' : JSON.parse(<any>value) == true;
  }

  public async number(name: string, someDefault?: number): Promise<number | undefined> {
    const value: string | object | number | undefined = await this.configurations.get(name, someDefault);
    return Number(value);
  }

  public async object<T>(name: string, someDefault?: object): Promise<T> {
    const value: string | object | undefined = await this.configurations.get(name, someDefault);
    if (typeof value === 'object') return (value as any) as T;
    if (typeof value === 'string') return JSON.parse(value) as T;
    return value as T;
  }
}
