import type { AdProvider } from "../AdProvider";

/**
 * Integration boundary for the publisher tag supplied by the site owner.
 * Until a tag and its official rendering instructions are supplied, this
 * provider remains unavailable and the internal CTA is shown instead.
 */
export class AdsterraProvider implements AdProvider {
  constructor(
    private readonly mountApprovedTag?: (target: HTMLElement) => Promise<() => void>,
  ) {}

  private cleanupMountedTag: (() => void) | null = null;

  isAvailable(): boolean {
    return typeof this.mountApprovedTag === "function";
  }

  async initialize(): Promise<void> {}

  async render(target: HTMLElement): Promise<boolean> {
    if (!this.mountApprovedTag) return false;
    try {
      this.cleanupMountedTag = await this.mountApprovedTag(target);
      return true;
    } catch {
      this.cleanupMountedTag = null;
      return false;
    }
  }

  cleanup(target: HTMLElement): void {
    try {
      this.cleanupMountedTag?.();
    } finally {
      this.cleanupMountedTag = null;
      target.replaceChildren();
    }
  }
}
