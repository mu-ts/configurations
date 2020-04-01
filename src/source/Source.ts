export interface Source {
  get(name: string): Promise<any | undefined>;
}
