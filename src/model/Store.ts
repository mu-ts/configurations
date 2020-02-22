export interface Store {
  priority(): number;
  get(name: string): Promise<any | undefined>;
}
