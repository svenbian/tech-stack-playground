import type { AuthorizationStatus, BlockingService, ShieldRequest } from './BlockingService';

type Listener = (appIds: string[]) => void;

/**
 * In-app simulation used in Expo Go, on web and in development. It records the
 * shielded set so the "Try your shield" simulator can show what a real device
 * would do. The in-app block screen plays the role of the OS shield.
 */
export class SimulatedBlockingService implements BlockingService {
  readonly name = 'Simulator';
  readonly isNative = false;
  private shielded: string[] = [];
  private listeners = new Set<Listener>();

  async requestAuthorization(): Promise<AuthorizationStatus> {
    return 'granted';
  }

  async getAuthorizationStatus(): Promise<AuthorizationStatus> {
    return 'granted';
  }

  async applyShield({ appIds }: ShieldRequest): Promise<void> {
    this.shielded = [...appIds];
    this.listeners.forEach((l) => l(this.shielded));
  }

  async clearShield(): Promise<void> {
    await this.applyShield({ appIds: [], title: '', subtitle: '' });
  }

  getShielded(): string[] {
    return this.shielded;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
