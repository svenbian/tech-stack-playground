import type { BlockingService } from './BlockingService';
import { SimulatedBlockingService } from './SimulatedBlockingService';

export * from './BlockingService';

/**
 * Pick the enforcement backend. When the native modules exist this becomes:
 *   Platform.OS === 'ios'     → new ScreenTimeBlockingService()     (FamilyControls + ManagedSettings)
 *   Platform.OS === 'android' → new AccessibilityBlockingService()  (AccessibilityService + overlay)
 */
export const blockingService: BlockingService = new SimulatedBlockingService();
