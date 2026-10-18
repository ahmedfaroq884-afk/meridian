import type { AdProvider } from "../AdProvider";

export class PlaceholderAdProvider implements AdProvider {
  isAvailable(): boolean {
    return false;
  }

  async initialize(): Promise<void> {}

  async render(_target: HTMLElement): Promise<boolean> {
    return false;
  }

  cleanup(_target: HTMLElement): void {}
}
