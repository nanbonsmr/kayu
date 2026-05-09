// ─── Tool tabs ────────────────────────────────────────────────────────────────
export type ToolTab =
  | 'adjust'
  | 'filters'
  | 'curves'
  | 'hsl'
  | 'grading'
  | 'effects'
  | 'crop'
  | 'shapes'
  | 'draw'
  | 'text'
  | 'stickers';

// ─── Basic adjustments ────────────────────────────────────────────────────────
export interface Adjustments {
  brightness:  number; // -1 → 1
  contrast:    number; // -1 → 1
  saturation:  number; // -1 → 1
  exposure:    number; // -1 → 1
  temperature: number; // -1 → 1
  tint:        number; // -1 → 1
  sharpness:   number; //  0 → 1
  blur:        number; //  0 → 1
  highlights:  number; // -1 → 1
  shadows:     number; // -1 → 1
  vignette:    number; //  0 → 1
  fade:        number; //  0 → 1  (matte/fade effect)
  grain:       number; //  0 → 1  (film grain)
}

export const DEFAULT_ADJUSTMENTS: Adjustments = {
  brightness: 0, contrast: 0, saturation: 0, exposure: 0,
  temperature: 0, tint: 0, sharpness: 0, blur: 0,
  highlights: 0, shadows: 0, vignette: 0, fade: 0, grain: 0,
};

// ─── Tone curve ───────────────────────────────────────────────────────────────
// Each channel has 5 control points: blacks, shadows, midtones, highlights, whites
// Values 0–255 for input, 0–255 for output
export interface CurvePoint { x: number; y: number }

export interface ToneCurves {
  rgb:   CurvePoint[]; // master (luminosity)
  red:   CurvePoint[];
  green: CurvePoint[];
  blue:  CurvePoint[];
}

export const DEFAULT_CURVE_POINTS: CurvePoint[] = [
  { x: 0,   y: 0   },
  { x: 64,  y: 64  },
  { x: 128, y: 128 },
  { x: 192, y: 192 },
  { x: 255, y: 255 },
];

export const DEFAULT_CURVES: ToneCurves = {
  rgb:   [...DEFAULT_CURVE_POINTS.map((p) => ({ ...p }))],
  red:   [...DEFAULT_CURVE_POINTS.map((p) => ({ ...p }))],
  green: [...DEFAULT_CURVE_POINTS.map((p) => ({ ...p }))],
  blue:  [...DEFAULT_CURVE_POINTS.map((p) => ({ ...p }))],
};

// ─── HSL per-color adjustments ────────────────────────────────────────────────
export interface HslChannel {
  hue:        number; // -180 → 180
  saturation: number; // -100 → 100
  luminance:  number; // -100 → 100
}

export type HslColor = 'red' | 'orange' | 'yellow' | 'green' | 'cyan' | 'blue' | 'purple' | 'magenta';

export type HslAdjustments = Record<HslColor, HslChannel>;

export const DEFAULT_HSL_CHANNEL: HslChannel = { hue: 0, saturation: 0, luminance: 0 };

export const DEFAULT_HSL: HslAdjustments = {
  red:     { ...DEFAULT_HSL_CHANNEL },
  orange:  { ...DEFAULT_HSL_CHANNEL },
  yellow:  { ...DEFAULT_HSL_CHANNEL },
  green:   { ...DEFAULT_HSL_CHANNEL },
  cyan:    { ...DEFAULT_HSL_CHANNEL },
  blue:    { ...DEFAULT_HSL_CHANNEL },
  purple:  { ...DEFAULT_HSL_CHANNEL },
  magenta: { ...DEFAULT_HSL_CHANNEL },
};

// ─── Color grading (shadows / midtones / highlights tint) ─────────────────────
export interface GradingTone {
  hue:        number; // 0 → 360
  saturation: number; // 0 → 100
  luminance:  number; // -100 → 100
}

export interface ColorGrading {
  shadows:    GradingTone;
  midtones:   GradingTone;
  highlights: GradingTone;
  blending:   number; // 0 → 100
  balance:    number; // -100 → 100
}

export const DEFAULT_GRADING_TONE: GradingTone = { hue: 0, saturation: 0, luminance: 0 };

export const DEFAULT_COLOR_GRADING: ColorGrading = {
  shadows:    { ...DEFAULT_GRADING_TONE },
  midtones:   { ...DEFAULT_GRADING_TONE },
  highlights: { ...DEFAULT_GRADING_TONE },
  blending:   50,
  balance:    0,
};

// ─── Shape overlay ────────────────────────────────────────────────────────────
export type ShapeType = 'rectangle' | 'circle' | 'triangle' | 'star' | 'heart' | 'arrow';

export interface ShapeLayer {
  id:          string;
  type:        ShapeType;
  x:           number;
  y:           number;
  width:       number;
  height:      number;
  rotation:    number;
  fillColor:   string;
  strokeColor: string;
  strokeWidth: number;
  opacity:     number;
}

// ─── Crop ─────────────────────────────────────────────────────────────────────
export interface CropState {
  aspectRatio: string; // 'free' | '1:1' | '4:3' | '16:9' | '3:4' | '9:16'
  straighten:  number; // -45 → 45 degrees
}

export const DEFAULT_CROP: CropState = { aspectRatio: 'free', straighten: 0 };

// ─── Layers ───────────────────────────────────────────────────────────────────
export interface TextLayer {
  id:         string;
  text:       string;
  x:          number;
  y:          number;
  fontSize:   number;
  fontFamily: string;
  color:      string;
  rotation:   number;
  bold:       boolean;
  italic:     boolean;
}

export interface StickerLayer {
  id:       string;
  emoji:    string;
  x:        number;
  y:        number;
  fontSize: number;
  rotation: number;
}

export interface DrawPath {
  id:      string;
  points:  { x: number; y: number }[];
  color:   string;
  width:   number;
  opacity: number;
  tool:    'pen' | 'marker' | 'eraser';
}

// ─── Full editor state ────────────────────────────────────────────────────────
export interface EditorState {
  sourceUri:       string | null;
  editedUri:       string | null;
  adjustments:     Adjustments;
  curves:          ToneCurves;
  hsl:             HslAdjustments;
  colorGrading:    ColorGrading;
  cropState:       CropState;
  activeFilterId:  string | null;
  filterIntensity: number;
  textLayers:      TextLayer[];
  stickerLayers:   StickerLayer[];
  shapeLayers:     ShapeLayer[];
  drawPaths:       DrawPath[];
  rotation:        number;
  flipH:           boolean;
  flipV:           boolean;
  activeTab:       ToolTab;
  isProcessing:    boolean;
  processingLabel: string;
  history:         HistoryEntry[];
  historyIndex:    number;
}

export interface HistoryEntry {
  uri:         string;
  adjustments: Adjustments;
  label:       string;
  timestamp:   number;
}

export interface RecentEdit {
  id:        string;
  uri:       string;
  thumbnail: string;
  editedAt:  number;
  name:      string;
}

export type ExportFormat = 'jpeg' | 'png';

export interface ExportOptions {
  format:        ExportFormat;
  quality:       number;
  saveToGallery: boolean;
  share:         boolean;
}
