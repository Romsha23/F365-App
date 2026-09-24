import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DB_SETUP_KEY = '@database_setup_completed';

export function useDatabaseSetup() {
  const [isChecking, setIsChecking] = useState(true);
  const [setupError] = useState<string | null>(null);

  useEffect(() => {
    const checkSetup = async () => {
      try {
        const setupCompleted = await AsyncStorage.getItem(DB_SETUP_KEY);
        if (setupCompleted === 'true') {
          console.log('[DB] Already setup');
        } else {
          await AsyncStorage.setItem(DB_SETUP_KEY, 'true');
          console.log('[DB] Setup flagged as complete');
        }
      } catch (error: any) {
        console.error('[DB] Setup check error:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkSetup();
  }, []);

  const resetSetup = async () => {
    await AsyncStorage.removeItem(DB_SETUP_KEY);
    console.log('Database setup flag cleared');
  };

  return {
    isChecking,
    setupError,
    resetSetup,
  };
}
