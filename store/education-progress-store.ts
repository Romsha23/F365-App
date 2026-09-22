import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

interface EducationProgressState {
  completedCards: Record<string, string[]>;
  isLoading: boolean;

  initialize: () => Promise<void>;
  markCardRead: (topicId: string, cardId: string) => Promise<void>;
  isCardRead: (topicId: string, cardId: string) => boolean;
  getTopicProgress: (topicId: string, totalCards: number) => number;
  getTotalCompleted: () => number;
}

const STORAGE_KEY = '@education_progress';

export const useEducationProgressStore = create<EducationProgressState>((set, get) => ({
  completedCards: {},
  isLoading: false,

  initialize: async () => {
    try {
      set({ isLoading: true });
      console.log('[EducationProgress] Initializing...');

      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const local: Record<string, string[]> = stored ? JSON.parse(stored) : {};

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('partner_education_progress')
            .select('topic_id, card_id')
            .eq('user_id', user.id);

          if (!error && data) {
            const merged = { ...local };
            for (const row of data) {
              if (!merged[row.topic_id]) {
                merged[row.topic_id] = [];
              }
              if (!merged[row.topic_id].includes(row.card_id)) {
                merged[row.topic_id].push(row.card_id);
              }
            }
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            set({ completedCards: merged, isLoading: false });
            console.log('[EducationProgress] Loaded from Supabase + local');
            return;
          }
        }
      } catch {
        console.log('[EducationProgress] No auth, using local only');
      }

      set({ completedCards: local, isLoading: false });
      console.log('[EducationProgress] Loaded from local storage');
    } catch (error) {
      console.error('[EducationProgress] Init error:', error);
      set({ isLoading: false });
    }
  },

  markCardRead: async (topicId: string, cardId: string) => {
    try {
      const current = get().completedCards;
      const topicCards = current[topicId] || [];

      if (topicCards.includes(cardId)) return;

      const updated = {
        ...current,
        [topicId]: [...topicCards, cardId],
      };

      set({ completedCards: updated });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('partner_education_progress')
            .upsert({
              user_id: user.id,
              topic_id: topicId,
              card_id: cardId,
            }, { onConflict: 'user_id,topic_id,card_id' });
        }
      } catch {
        console.log('[EducationProgress] Supabase sync skipped');
      }

      console.log('[EducationProgress] Marked read:', topicId, cardId);
    } catch (error) {
      console.error('[EducationProgress] Mark read error:', error);
    }
  },

  isCardRead: (topicId: string, cardId: string) => {
    const cards = get().completedCards[topicId] || [];
    return cards.includes(cardId);
  },

  getTopicProgress: (topicId: string, totalCards: number) => {
    if (totalCards === 0) return 0;
    const cards = get().completedCards[topicId] || [];
    return cards.length / totalCards;
  },

  getTotalCompleted: () => {
    const all = get().completedCards;
    let count = 0;
    for (const topicId of Object.keys(all)) {
      count += all[topicId].length;
    }
    return count;
  },
}));
