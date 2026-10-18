import type { AdProvider } from "./AdProvider";
import { PlaceholderAdProvider } from "./providers/PlaceholderAdProvider";

export class AdManager {
  constructor(private readonly provider: AdProvider = new PlaceholderAdProvider()) {}

  async render(target: HTMLElement): Promise<boolean> {
    if (!this.provider.isAvailable()) return false;
    try {
      await this.provider.initialize();
      return await this.provider.render(target);
    } catch {
      this.provider.cleanup(target);
      return false;
    }
  }

  cleanup(target: HTMLElement): void {
    this.provider.cleanup(target);
  }
}

// Placeholder is intentionally active until an approved publisher tag is supplied.
export const adManager = new AdManager();
