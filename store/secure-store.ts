import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { encryptObject, decryptObject } from '../utils/encryption';
import { logDataAccess, logDataCreate, logDataUpdate } from '../utils/audit-logger';

/**
 * A secure storage middleware for Zustand that encrypts data before storing
 * and decrypts when retrieving. This is important for Australian Privacy Act compliance.
 */

// Create a secure storage adapter
const createSecureStorage = <T>() => {
  return {
    getItem: async (name: string): Promise<string | null> => {
      try {
        const encryptedData = await AsyncStorage.getItem(name);
        if (!encryptedData) return null;
        
        const decryptedData = await decryptObject(encryptedData);
        // Log data access (in a real app, we'd be more specific about what was accessed)
        if (name.includes('user')) {
          logDataAccess('current-user', 'user profile');
        } else if (name.includes('cycle')) {
          logDataAccess('current-user', 'cycle data');
        }
        
        return JSON.stringify(decryptedData);
      } catch (error) {
        console.error('Error retrieving secure data:', error);
        return null;
      }
    },
    
    setItem: async (name: string, value: string): Promise<void> => {
      try {
        const parsedValue = JSON.parse(value) as T;
        const encryptedData = await encryptObject(parsedValue);
        await AsyncStorage.setItem(name, encryptedData);
        
        // Log data update
        if (name.includes('user')) {
          logDataUpdate('current-user', 'user profile');
        } else if (name.includes('cycle')) {
          logDataUpdate('current-user', 'cycle data');
        }
      } catch (error) {
        console.error('Error storing secure data:', error);
      }
    },
    
    removeItem: async (name: string): Promise<void> => {
      try {
        await AsyncStorage.removeItem(name);
      } catch (error) {
        console.error('Error removing secure data:', error);
      }
    }
  };
};

// Helper function to create a secure persisted store
export const createSecureStore = <T extends object>(
  name: string,
  initialState: T,
  stateCreator: (set: any, get: any) => T
) => {
  return create<T>()(
    persist(
      stateCreator,
      {
        name,
        storage: createJSONStorage(() => createSecureStorage<T>()),
      }
    )
  );
};

// Example usage:
/*
export const useSecureUserStore = createSecureStore<UserState>(
  'secure-user-storage',
  {
    user: null,
    isLoading: false,
    error: null,
  },
  (set, get) => ({
    user: null,
    isLoading: false,
    error: null,
    setUser: (user) => set({ user }),
    updateUser: (updates) => 
      set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null,
      })),
    logout: () => set({ user: null }),
  })
);
*/