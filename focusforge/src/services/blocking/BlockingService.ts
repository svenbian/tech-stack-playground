/**
 * Platform-agnostic contract for enforcing blocks on a real device.
 *
 * The app decides *what* is blocked (src/domain/blocking.ts). A BlockingService
 * only *enforces* it. See docs/NATIVE_BLOCKING.md for how the iOS (Screen Time
 * API) and Android (AccessibilityService) implementations would work.
 */
export type AuthorizationStatus = 'granted' | 'denied' | 'not-determined';

export interface ShieldRequest {
  /** App ids to shield right now. An empty list lifts all shields. */
  appIds: string[];
  /** Copy shown on the native shield screen. */
  title: string;
  subtitle: string;
}

export interface BlockingService {
  readonly name: string;
  /** False on platforms where we can only simulate. */
  readonly isNative: boolean;
  requestAuthorization(): Promise<AuthorizationStatus>;
  getAuthorizationStatus(): Promise<AuthorizationStatus>;
  /** Replace the active shield set (idempotent). */
  applyShield(request: ShieldRequest): Promise<void>;
  clearShield(): Promise<void>;
}
