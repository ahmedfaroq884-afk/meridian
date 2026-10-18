export interface AdProvider {
  isAvailable(): boolean;
  initialize(): Promise<void>;
  render(target: HTMLElement): Promise<boolean>;
  cleanup(target: HTMLElement): void;
}
