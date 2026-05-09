import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import {
    Adjustments,
    ColorGrading,
    CropState,
    DEFAULT_ADJUSTMENTS,
    DEFAULT_COLOR_GRADING,
    DEFAULT_CROP,
    DEFAULT_CURVES,
    DEFAULT_HSL,
    DrawPath,
    EditorState,
    HistoryEntry,
    HslAdjustments,
    HslColor,
    ShapeLayer,
    StickerLayer,
    TextLayer,
    ToneCurves,
    ToolTab,
} from '@/types/editor';

const MAX_HISTORY = 30;

// ─── Full snapshot stored per history entry ───────────────────────────────────
interface Snapshot {
  adjustments:  Adjustments;
  curves:       ToneCurves;
  hsl:          HslAdjustments;
  colorGrading: ColorGrading;
  cropState:    CropState;
  activeFilterId:  string | null;
  filterIntensity: number;
  textLayers:   TextLayer[];
  stickerLayers: StickerLayer[];
  shapeLayers:  ShapeLayer[];
  drawPaths:    DrawPath[];
  rotation:     number;
  flipH:        boolean;
  flipV:        boolean;
}

interface HistoryEntryFull extends HistoryEntry {
  snapshot: Snapshot;
}

interface DrawSettings {
  drawColor:   string;
  drawSize:    number;
  drawOpacity: number;
  drawTool:    'pen' | 'marker' | 'eraser';
}

interface EditorDerived {
  canUndo: boolean;
  canRedo: boolean;
}

interface EditorActions {
  setSourceUri: (uri: string) => void;
  setEditedUri: (uri: string) => void;

  setAdjustment:    (key: keyof Adjustments, value: number) => void;
  resetAdjustments: () => void;

  setCurvePoint: (channel: keyof ToneCurves, index: number, point: { x: number; y: number }) => void;
  resetCurves:   () => void;

  setHslChannel: (color: HslColor, patch: Partial<{ hue: number; saturation: number; luminance: number }>) => void;
  resetHsl:      () => void;

  setGradingTone:     (zone: 'shadows' | 'midtones' | 'highlights', patch: Partial<{ hue: number; saturation: number; luminance: number }>) => void;
  setGradingBlending: (v: number) => void;
  setGradingBalance:  (v: number) => void;
  resetColorGrading:  () => void;

  setCropAspect:     (ratio: string) => void;
  setCropStraighten: (deg: number) => void;

  setActiveFilter:    (id: string | null, intensity?: number) => void;
  setFilterIntensity: (v: number) => void;

  addTextLayer:    (layer: TextLayer) => void;
  updateTextLayer: (id: string, patch: Partial<TextLayer>) => void;
  removeTextLayer: (id: string) => void;

  addStickerLayer:    (layer: StickerLayer) => void;
  updateStickerLayer: (id: string, patch: Partial<StickerLayer>) => void;
  removeStickerLayer: (id: string) => void;

  addShapeLayer:    (layer: ShapeLayer) => void;
  updateShapeLayer: (id: string, patch: Partial<ShapeLayer>) => void;
  removeShapeLayer: (id: string) => void;

  addDrawPath:    (path: DrawPath) => void;
  clearDrawPaths: () => void;

  setDrawColor:   (v: string) => void;
  setDrawSize:    (v: number) => void;
  setDrawOpacity: (v: number) => void;
  setDrawTool:    (v: 'pen' | 'marker' | 'eraser') => void;

  setRotation: (deg: number) => void;
  setFlip:     (h: boolean, v: boolean) => void;

  setActiveTab:  (tab: ToolTab) => void;
  setProcessing: (loading: boolean, label?: string) => void;

  // History
  saveSnapshot: (label: string) => void;
  undo:         () => void;
  redo:         () => void;

  resetEditor: () => void;
}

// ─── Extended history with full snapshots ─────────────────────────────────────
interface HistoryState {
  history:      HistoryEntryFull[];
  historyIndex: number;
}

type FullStore = EditorState & EditorDerived & DrawSettings & EditorActions & HistoryState;

const initialState: EditorState & EditorDerived & DrawSettings & HistoryState = {
  sourceUri:       null,
  editedUri:       null,
  adjustments:     { ...DEFAULT_ADJUSTMENTS },
  curves:          DEFAULT_CURVES,
  hsl:             DEFAULT_HSL,
  colorGrading:    DEFAULT_COLOR_GRADING,
  cropState:       DEFAULT_CROP,
  activeFilterId:  null,
  filterIntensity: 1,
  textLayers:      [],
  stickerLayers:   [],
  shapeLayers:     [],
  drawPaths:       [],
  rotation:        0,
  flipH:           false,
  flipV:           false,
  activeTab:       'adjust',
  isProcessing:    false,
  processingLabel: '',
  history:         [],
  historyIndex:    -1,
  canUndo:         false,
  canRedo:         false,
  drawColor:       '#FFFFFF',
  drawSize:        6,
  drawOpacity:     1,
  drawTool:        'pen',
};

// ─── Helper: build a snapshot from current state ──────────────────────────────
function buildSnapshot(s: EditorState): Snapshot {
  return {
    adjustments:     { ...s.adjustments },
    curves:          s.curves,
    hsl:             s.hsl,
    colorGrading:    s.colorGrading,
    cropState:       { ...s.cropState },
    activeFilterId:  s.activeFilterId,
    filterIntensity: s.filterIntensity,
    textLayers:      s.textLayers.map((l) => ({ ...l })),
    stickerLayers:   s.stickerLayers.map((l) => ({ ...l })),
    shapeLayers:     s.shapeLayers.map((l) => ({ ...l })),
    drawPaths:       s.drawPaths.map((p) => ({ ...p, points: [...p.points] })),
    rotation:        s.rotation,
    flipH:           s.flipH,
    flipV:           s.flipV,
  };
}

// ─── Helper: restore a snapshot into state ────────────────────────────────────
function restoreSnapshot(snap: Snapshot): Partial<EditorState> {
  return {
    adjustments:     { ...snap.adjustments },
    curves:          snap.curves,
    hsl:             snap.hsl,
    colorGrading:    snap.colorGrading,
    cropState:       { ...snap.cropState },
    activeFilterId:  snap.activeFilterId,
    filterIntensity: snap.filterIntensity,
    textLayers:      snap.textLayers.map((l) => ({ ...l })),
    stickerLayers:   snap.stickerLayers.map((l) => ({ ...l })),
    shapeLayers:     snap.shapeLayers.map((l) => ({ ...l })),
    drawPaths:       snap.drawPaths.map((p) => ({ ...p, points: [...p.points] })),
    rotation:        snap.rotation,
    flipH:           snap.flipH,
    flipV:           snap.flipV,
  };
}

export const useEditorStore = create<FullStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    setSourceUri: (uri) =>
      set({ sourceUri: uri, editedUri: uri, history: [], historyIndex: -1, canUndo: false, canRedo: false }),

    setEditedUri: (uri) => set({ editedUri: uri }),

    // ── Adjustments ──────────────────────────────────────────────────────────
    setAdjustment: (key, value) =>
      set((s) => ({ adjustments: { ...s.adjustments, [key]: value } })),

    resetAdjustments: () => {
      set({ adjustments: { ...DEFAULT_ADJUSTMENTS } });
      get().saveSnapshot('Reset adjustments');
    },

    // ── Curves ───────────────────────────────────────────────────────────────
    setCurvePoint: (channel, index, point) =>
      set((s) => {
        const updated = [...s.curves[channel]];
        updated[index] = point;
        return { curves: { ...s.curves, [channel]: updated } };
      }),

    resetCurves: () => {
      set({ curves: DEFAULT_CURVES });
      get().saveSnapshot('Reset curves');
    },

    // ── HSL ──────────────────────────────────────────────────────────────────
    setHslChannel: (color, patch) =>
      set((s) => ({ hsl: { ...s.hsl, [color]: { ...s.hsl[color], ...patch } } })),

    resetHsl: () => {
      set({ hsl: DEFAULT_HSL });
      get().saveSnapshot('Reset HSL');
    },

    // ── Color grading ─────────────────────────────────────────────────────────
    setGradingTone: (zone, patch) =>
      set((s) => ({ colorGrading: { ...s.colorGrading, [zone]: { ...s.colorGrading[zone], ...patch } } })),

    setGradingBlending: (v) =>
      set((s) => ({ colorGrading: { ...s.colorGrading, blending: v } })),

    setGradingBalance: (v) =>
      set((s) => ({ colorGrading: { ...s.colorGrading, balance: v } })),

    resetColorGrading: () => {
      set({ colorGrading: DEFAULT_COLOR_GRADING });
      get().saveSnapshot('Reset grading');
    },

    // ── Crop ─────────────────────────────────────────────────────────────────
    setCropAspect:     (ratio) => set((s) => ({ cropState: { ...s.cropState, aspectRatio: ratio } })),
    setCropStraighten: (deg)   => set((s) => ({ cropState: { ...s.cropState, straighten: deg } })),

    // ── Filters ──────────────────────────────────────────────────────────────
    setActiveFilter:    (id, intensity = 1) => set({ activeFilterId: id, filterIntensity: intensity }),
    setFilterIntensity: (v) => set({ filterIntensity: v }),

    // ── Layers ───────────────────────────────────────────────────────────────
    addTextLayer: (layer) => {
      set((s) => ({ textLayers: [...s.textLayers, layer] }));
      get().saveSnapshot('Add text');
    },
    updateTextLayer: (id, patch) =>
      set((s) => ({ textLayers: s.textLayers.map((l) => (l.id === id ? { ...l, ...patch } : l)) })),
    removeTextLayer: (id) => {
      set((s) => ({ textLayers: s.textLayers.filter((l) => l.id !== id) }));
      get().saveSnapshot('Remove text');
    },

    addStickerLayer: (layer) => {
      set((s) => ({ stickerLayers: [...s.stickerLayers, layer] }));
      get().saveSnapshot('Add sticker');
    },
    updateStickerLayer: (id, patch) =>
      set((s) => ({ stickerLayers: s.stickerLayers.map((l) => (l.id === id ? { ...l, ...patch } : l)) })),
    removeStickerLayer: (id) => {
      set((s) => ({ stickerLayers: s.stickerLayers.filter((l) => l.id !== id) }));
      get().saveSnapshot('Remove sticker');
    },

    addShapeLayer: (layer) => {
      set((s) => ({ shapeLayers: [...s.shapeLayers, layer] }));
      get().saveSnapshot('Add shape');
    },
    updateShapeLayer: (id, patch) =>
      set((s) => ({ shapeLayers: s.shapeLayers.map((l) => (l.id === id ? { ...l, ...patch } : l)) })),
    removeShapeLayer: (id) => {
      set((s) => ({ shapeLayers: s.shapeLayers.filter((l) => l.id !== id) }));
      get().saveSnapshot('Remove shape');
    },

    addDrawPath: (path) => {
      set((s) => ({ drawPaths: [...s.drawPaths, path] }));
      get().saveSnapshot('Draw stroke');
    },
    clearDrawPaths: () => {
      set({ drawPaths: [] });
      get().saveSnapshot('Clear drawing');
    },

    setDrawColor:   (v) => set({ drawColor: v }),
    setDrawSize:    (v) => set({ drawSize: v }),
    setDrawOpacity: (v) => set({ drawOpacity: v }),
    setDrawTool:    (v) => set({ drawTool: v }),

    setRotation: (deg) => set({ rotation: deg }),
    setFlip:     (h, v) => set({ flipH: h, flipV: v }),

    setActiveTab:  (tab)           => set({ activeTab: tab }),
    setProcessing: (loading, label = '') => set({ isProcessing: loading, processingLabel: label }),

    // ── History ───────────────────────────────────────────────────────────────
    saveSnapshot: (label) => {
      const state = get();
      const snapshot = buildSnapshot(state);
      const entry: HistoryEntryFull = {
        uri:       state.editedUri ?? '',
        adjustments: { ...state.adjustments },
        label,
        timestamp: Date.now(),
        snapshot,
      };
      // Truncate any forward history, then append
      const trimmed  = state.history.slice(0, state.historyIndex + 1);
      const next     = [...trimmed, entry].slice(-MAX_HISTORY);
      const newIndex = next.length - 1;
      set({ history: next, historyIndex: newIndex, canUndo: newIndex > 0, canRedo: false });
    },

    undo: () => {
      const { history, historyIndex } = get();
      if (historyIndex <= 0) return;
      const ni   = historyIndex - 1;
      const prev = history[ni];
      set({
        ...restoreSnapshot(prev.snapshot),
        editedUri:    prev.uri || get().editedUri,
        historyIndex: ni,
        canUndo:      ni > 0,
        canRedo:      true,
      });
    },

    redo: () => {
      const { history, historyIndex } = get();
      if (historyIndex >= history.length - 1) return;
      const ni   = historyIndex + 1;
      const next = history[ni];
      set({
        ...restoreSnapshot(next.snapshot),
        editedUri:    next.uri || get().editedUri,
        historyIndex: ni,
        canUndo:      true,
        canRedo:      ni < history.length - 1,
      });
    },

    // Legacy — kept for compatibility, delegates to saveSnapshot
    pushHistory: (uri, label) => {
      set({ editedUri: uri });
      get().saveSnapshot(label);
    },

    resetEditor: () => set({ ...initialState }),
  }))
);
