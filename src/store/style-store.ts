/**
 * Style Store — manages the clipboard and saved style presets.
 * Presets are persisted to the device filesystem as JSON.
 */

import * as FileSystem from 'expo-file-system';
import { create } from 'zustand';

import { EditStyle } from '@/types/edit-style';
import { uid } from '@/utils/id';

const PRESETS_PATH = `${FileSystem.documentDirectory}kayu/styles/presets.json`;

interface StyleState {
  /** The currently copied style (clipboard) */
  clipboard:    EditStyle | null;
  /** User-saved named presets */
  presets:      EditStyle[];
  /** Whether presets have been loaded from disk */
  loaded:       boolean;
}

interface StyleActions {
  /** Copy current edit settings to clipboard */
  copyToClipboard: (style: Omit<EditStyle, 'id' | 'name' | 'description' | 'createdAt' | 'updatedAt' | 'source' | 'version'>) => void;
  /** Clear clipboard */
  clearClipboard: () => void;

  /** Save a named preset */
  savePreset: (style: EditStyle) => Promise<void>;
  /** Delete a preset by id */
  deletePreset: (id: string) => Promise<void>;
  /** Rename a preset */
  renamePreset: (id: string, name: string) => Promise<void>;

  /** Load presets from disk */
  loadPresets: () => Promise<void>;

  /** Export a style as a JSON string */
  exportStyleJson: (style: EditStyle) => string;
  /** Import a style from a JSON string — returns the parsed style or throws */
  importStyleJson: (json: string) => EditStyle;
}

async function persistPresets(presets: EditStyle[]) {
  try {
    const dir = `${FileSystem.documentDirectory}kayu/styles/`;
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    await FileSystem.writeAsStringAsync(PRESETS_PATH, JSON.stringify(presets), {
      encoding: FileSystem.EncodingType.UTF8,
    });
  } catch (e) {
    console.warn('Failed to persist style presets:', e);
  }
}

export const useStyleStore = create<StyleState & StyleActions>()((set, get) => ({
  clipboard: null,
  presets:   [],
  loaded:    false,

  copyToClipboard: (partial) => {
    const style: EditStyle = {
      id:          uid(),
      name:        'Clipboard',
      description: 'Copied from current photo',
      createdAt:   Date.now(),
      updatedAt:   Date.now(),
      source:      'kayu',
      version:     '1.0',
      ...partial,
    };
    set({ clipboard: style });
  },

  clearClipboard: () => set({ clipboard: null }),

  savePreset: async (style) => {
    const existing = get().presets.find((p) => p.id === style.id);
    let updated: EditStyle[];
    if (existing) {
      updated = get().presets.map((p) =>
        p.id === style.id ? { ...style, updatedAt: Date.now() } : p
      );
    } else {
      updated = [{ ...style, createdAt: Date.now(), updatedAt: Date.now() }, ...get().presets];
    }
    set({ presets: updated });
    await persistPresets(updated);
  },

  deletePreset: async (id) => {
    const updated = get().presets.filter((p) => p.id !== id);
    set({ presets: updated });
    await persistPresets(updated);
  },

  renamePreset: async (id, name) => {
    const updated = get().presets.map((p) =>
      p.id === id ? { ...p, name, updatedAt: Date.now() } : p
    );
    set({ presets: updated });
    await persistPresets(updated);
  },

  loadPresets: async () => {
    if (get().loaded) return;
    try {
      const info = await FileSystem.getInfoAsync(PRESETS_PATH);
      if (info.exists) {
        const raw = await FileSystem.readAsStringAsync(PRESETS_PATH, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        const presets: EditStyle[] = JSON.parse(raw);
        set({ presets, loaded: true });
      } else {
        set({ loaded: true });
      }
    } catch (e) {
      console.warn('Failed to load style presets:', e);
      set({ loaded: true });
    }
  },

  exportStyleJson: (style) => {
    return JSON.stringify(style, null, 2);
  },

  importStyleJson: (json) => {
    const parsed = JSON.parse(json) as EditStyle;
    // Basic validation
    if (!parsed.adjustments || !parsed.version) {
      throw new Error('Invalid style format. Missing required fields.');
    }
    // Assign a new local id so it doesn't conflict
    return { ...parsed, id: uid(), source: parsed.source ?? 'external', updatedAt: Date.now() };
  },
}));
