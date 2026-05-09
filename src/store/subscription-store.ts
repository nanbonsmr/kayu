/**
 * Subscription Store — Dodo Payments
 *
 * Manages the user's subscription state locally.
 * Dodo Payments handles the actual checkout via WebView.
 * After a successful payment, activatePro() is called to
 * store the subscription state on device.
 *
 * Plan: Kayu Pro Monthly — $5.99/month
 */

import * as FileSystem from 'expo-file-system';
import { create } from 'zustand';

const CACHE_PATH = `${FileSystem.documentDirectory}kayu/subscription.json`;

export type PlanId = 'free' | 'pro_monthly';

export interface SubscriptionState {
  plan:      PlanId;
  isActive:  boolean;
  expiresAt: number | null;
  isLoading: boolean;
}

interface SubscriptionActions {
  loadSubscription: () => Promise<void>;
  activatePro:      (expiresAt: number) => Promise<void>;
  deactivate:       () => Promise<void>;
  setLoading:       (v: boolean) => void;
}

const DEFAULT_STATE: SubscriptionState = {
  plan:      'free',
  isActive:  false,
  expiresAt: null,
  isLoading: false,
};

async function persist(data: Pick<SubscriptionState, 'plan' | 'isActive' | 'expiresAt'>) {
  try {
    const dir = `${FileSystem.documentDirectory}kayu/`;
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    await FileSystem.writeAsStringAsync(CACHE_PATH, JSON.stringify(data), {
      encoding: FileSystem.EncodingType.UTF8,
    });
  } catch { /* non-critical */ }
}

export const useSubscriptionStore = create<SubscriptionState & SubscriptionActions>()((set) => ({
  ...DEFAULT_STATE,

  loadSubscription: async () => {
    try {
      const info = await FileSystem.getInfoAsync(CACHE_PATH);
      if (!info.exists) return;
      const raw  = await FileSystem.readAsStringAsync(CACHE_PATH);
      const data = JSON.parse(raw) as Pick<SubscriptionState, 'plan' | 'isActive' | 'expiresAt'>;
      if (data.expiresAt && data.expiresAt < Date.now()) {
        // Expired — reset to free
        const reset = { plan: 'free' as PlanId, isActive: false, expiresAt: null };
        set(reset);
        await persist(reset);
      } else {
        set(data);
      }
    } catch { /* non-critical */ }
  },

  activatePro: async (expiresAt) => {
    const data = { plan: 'pro_monthly' as PlanId, isActive: true, expiresAt };
    set(data);
    await persist(data);
  },

  deactivate: async () => {
    const data = { plan: 'free' as PlanId, isActive: false, expiresAt: null };
    set(data);
    await persist(data);
  },

  setLoading: (v) => set({ isLoading: v }),
}));
