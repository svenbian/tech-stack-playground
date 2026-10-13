import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';

/**
 * The one place that knows *where* state is saved. To move to SQLite or add
 * cloud sync later, swap this adapter. Nothing else needs to change.
 */
export const persistStorage = createJSONStorage(() => AsyncStorage);
