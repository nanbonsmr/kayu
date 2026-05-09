import {
    forwardRef,
    useImperativeHandle,
    useRef,
    useState,
} from 'react';
import {
    Animated,
    PanResponder,
    Pressable,
    StyleSheet,
    Text,
    View,
    ViewStyle,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { PF } from '@/constants/colors';
import { ImageWithFilters } from '@/features/editor/image-filters';
import { useEditorStore } from '@/store/editor-store';
import { DrawPath, StickerLayer, TextLayer } from '@/types/editor';
import { uid } from '@/utils/id';

export interface EditorCanvasRef {
  captureAsync: () => Promise<string>;
}

interface Props { style?: ViewStyle }

// ─── Helpers ──────────────────────────────────────────────────────────────────
function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}

// ─── Draw path renderer ───────────────────────────────────────────────────────
function DrawPathView({ path }: { path: DrawPath }) {
  if (path.points.length < 2) return null;
  return (
    <>
      {path.points.slice(1).map((pt, i) => {
        const prev  = path.points[i];
        const dx    = pt.x - prev.x;
        const dy    = pt.y - prev.y;
        const len   = Math.sqrt(dx * dx + dy * dy);
        if (len < 0.5) return null;
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        return (
          <View
            key={i}
            pointerEvents="none"
            style={{
              position:        'absolute',
              left:            (prev.x + pt.x) / 2 - len / 2,
              top:             (prev.y + pt.y) / 2 - path.width / 2,
              width:           len,
              height:          path.width,
              borderRadius:    path.width / 2,
              backgroundColor: path.tool === 'eraser' ? '#0D0D0D' : path.color,
              opacity:         path.opacity,
              transform:       [{ rotate: `${angle}deg` }],
            }}
          />
        );
      })}
    </>
  );
}

// ─── Layer controls (delete + resize + rotate handles) ───────────────────────
interface LayerControlsProps {
  onDelete:  () => void;
  onResize:  (delta: number) => void;   // delta px dragged diagonally
  onRotate:  (angleDeg: number) => void; // absolute angle
  centerX:   number; // layer x for rotation math
  centerY:   number;
}

function LayerControls({ onDelete, onResize, onRotate, centerX, centerY }: LayerControlsProps) {
  // ── Resize handle (bottom-right) ──────────────────────────────────────────
  const resizeStart = useRef(0);
  const resizeResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderGrant: (e) => {
        const { pageX, pageY } = e.nativeEvent;
        resizeStart.current = Math.sqrt(pageX * pageX + pageY * pageY);
      },
      onPanResponderMove: (_, g) => {
        // Diagonal drag distance → font size delta
        const diag = Math.sqrt(g.dx * g.dx + g.dy * g.dy);
        const sign = g.dx + g.dy > 0 ? 1 : -1;
        onResize(sign * diag * 0.5);
      },
    })
  ).current;

  // ── Rotate handle (bottom-left) ───────────────────────────────────────────
  const rotateResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderMove: (e) => {
        const { pageX, pageY } = e.nativeEvent;
        const angle = Math.atan2(pageY - centerY, pageX - centerX) * (180 / Math.PI);
        onRotate(angle);
      },
    })
  ).current;

  return (
    <>
      {/* ── Delete (top-right) ── */}
      <Pressable onPress={onDelete} style={styles.handleDelete} hitSlop={10}>
        <Text style={styles.handleDeleteText}>✕</Text>
      </Pressable>

      {/* ── Rotate (bottom-left) ── */}
      <View style={styles.handleRotate} {...rotateResponder.panHandlers}>
        <Text style={styles.handleIcon}>↻</Text>
      </View>

      {/* ── Resize (bottom-right) ── */}
      <View style={styles.handleResize} {...resizeResponder.panHandlers}>
        <Text style={styles.handleIcon}>⤡</Text>
      </View>

      {/* Selection border */}
      <View style={styles.selectionBorder} pointerEvents="none" />
    </>
  );
}

// ─── Draggable + resizable text layer ────────────────────────────────────────
function DraggableText({
  layer,
  isSelected,
  onSelect,
  onMove,
  onResize,
  onRotate,
  onDelete,
}: {
  layer:     TextLayer;
  isSelected: boolean;
  onSelect:  () => void;
  onMove:    (x: number, y: number) => void;
  onResize:  (newSize: number) => void;
  onRotate:  (deg: number) => void;
  onDelete:  () => void;
}) {
  const startX    = useRef(layer.x);
  const startY    = useRef(layer.y);
  const startSize = useRef(layer.fontSize);

  const dragResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderGrant: () => {
        const l = useEditorStore.getState().textLayers.find((t) => t.id === layer.id);
        startX.current    = l?.x        ?? layer.x;
        startY.current    = l?.y        ?? layer.y;
        startSize.current = l?.fontSize ?? layer.fontSize;
      },
      onPanResponderMove: (_, g) => {
        onMove(startX.current + g.dx, startY.current + g.dy);
      },
    })
  ).current;

  const handleResize = (delta: number) => {
    const newSize = clamp(startSize.current + delta, 10, 200);
    onResize(newSize);
  };

  return (
    <View style={[styles.layerWrap, { left: layer.x, top: layer.y }]}>
      {/* Drag area */}
      <View {...dragResponder.panHandlers}>
        <Pressable onPress={onSelect}>
          <Text
            style={{
              fontSize:   layer.fontSize,
              color:      layer.color,
              fontFamily: layer.fontFamily,
              fontWeight: layer.bold   ? '700' : '400',
              fontStyle:  layer.italic ? 'italic' : 'normal',
              transform:  [{ rotate: `${layer.rotation}deg` }],
            }}>
            {layer.text}
          </Text>
        </Pressable>
      </View>

      {isSelected && (
        <LayerControls
          onDelete={onDelete}
          onResize={handleResize}
          onRotate={onRotate}
          centerX={layer.x}
          centerY={layer.y}
        />
      )}
    </View>
  );
}

// ─── Draggable + resizable sticker layer ─────────────────────────────────────
function DraggableSticker({
  layer,
  isSelected,
  onSelect,
  onMove,
  onResize,
  onRotate,
  onDelete,
}: {
  layer:     StickerLayer;
  isSelected: boolean;
  onSelect:  () => void;
  onMove:    (x: number, y: number) => void;
  onResize:  (newSize: number) => void;
  onRotate:  (deg: number) => void;
  onDelete:  () => void;
}) {
  const startX    = useRef(layer.x);
  const startY    = useRef(layer.y);
  const startSize = useRef(layer.fontSize);

  const dragResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderGrant: () => {
        const l = useEditorStore.getState().stickerLayers.find((s) => s.id === layer.id);
        startX.current    = l?.x        ?? layer.x;
        startY.current    = l?.y        ?? layer.y;
        startSize.current = l?.fontSize ?? layer.fontSize;
      },
      onPanResponderMove: (_, g) => {
        onMove(startX.current + g.dx, startY.current + g.dy);
      },
    })
  ).current;

  const handleResize = (delta: number) => {
    const newSize = clamp(startSize.current + delta, 16, 200);
    onResize(newSize);
  };

  return (
    <View style={[styles.layerWrap, { left: layer.x, top: layer.y }]}>
      <View {...dragResponder.panHandlers}>
        <Pressable onPress={onSelect}>
          <Text
            style={{
              fontSize:  layer.fontSize,
              transform: [{ rotate: `${layer.rotation}deg` }],
            }}>
            {layer.emoji}
          </Text>
        </Pressable>
      </View>

      {isSelected && (
        <LayerControls
          onDelete={onDelete}
          onResize={handleResize}
          onRotate={onRotate}
          centerX={layer.x}
          centerY={layer.y}
        />
      )}
    </View>
  );
}

// ─── Draggable shape layer ────────────────────────────────────────────────────
function ShapeView({ layer }: { layer: ShapeLayer }) {
  const shapeStyle: object = {
    position: 'absolute' as const,
    left: layer.x, top: layer.y,
    width: layer.width, height: layer.height,
    opacity: layer.opacity,
    transform: [{ rotate: `${layer.rotation}deg` }],
    borderWidth: layer.strokeWidth,
    borderColor: layer.strokeColor === 'transparent' ? 'transparent' : layer.strokeColor,
    backgroundColor: layer.fillColor === 'transparent' ? 'transparent' : layer.fillColor,
    borderRadius: layer.type === 'circle' ? layer.width / 2 : layer.type === 'rectangle' ? 4 : 0,
  };
  return <View style={shapeStyle} pointerEvents="none" />;
}

function DraggableShape({
  layer, isSelected, onSelect, onMove, onResize, onDelete,
}: {
  layer: ShapeLayer;
  isSelected: boolean;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
  onResize: (w: number, h: number) => void;
  onDelete: () => void;
}) {
  const startX = useRef(layer.x);
  const startY = useRef(layer.y);
  const startW = useRef(layer.width);
  const startH = useRef(layer.height);

  const dragResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderGrant: () => {
        const l = useEditorStore.getState().shapeLayers.find((s) => s.id === layer.id);
        startX.current = l?.x ?? layer.x;
        startY.current = l?.y ?? layer.y;
        startW.current = l?.width  ?? layer.width;
        startH.current = l?.height ?? layer.height;
      },
      onPanResponderMove: (_, g) => {
        onMove(startX.current + g.dx, startY.current + g.dy);
      },
    })
  ).current;

  const resizeResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderGrant: () => {
        const l = useEditorStore.getState().shapeLayers.find((s) => s.id === layer.id);
        startW.current = l?.width  ?? layer.width;
        startH.current = l?.height ?? layer.height;
      },
      onPanResponderMove: (_, g) => {
        const w = Math.max(20, startW.current + g.dx);
        const h = Math.max(20, startH.current + g.dy);
        onResize(w, h);
      },
    })
  ).current;

  return (
    <View style={[styles.layerWrap, { left: layer.x, top: layer.y, width: layer.width, height: layer.height }]}>
      <View {...dragResponder.panHandlers} style={StyleSheet.absoluteFill}>
        <Pressable onPress={onSelect} style={StyleSheet.absoluteFill}>
          <View
            style={{
              flex: 1,
              opacity: layer.opacity,
              borderWidth: layer.strokeWidth,
              borderColor: layer.strokeColor === 'transparent' ? 'transparent' : layer.strokeColor,
              backgroundColor: layer.fillColor === 'transparent' ? 'transparent' : layer.fillColor,
              borderRadius: layer.type === 'circle' ? layer.width / 2 : layer.type === 'rectangle' ? 4 : 0,
              transform: [{ rotate: `${layer.rotation}deg` }],
            }}
          />
        </Pressable>
      </View>

      {isSelected && (
        <>
          <Pressable onPress={onDelete} style={styles.handleDelete} hitSlop={10}>
            <Text style={styles.handleDeleteText}>✕</Text>
          </Pressable>
          <View style={styles.handleResize} {...resizeResponder.panHandlers}>
            <Text style={styles.handleIcon}>⤡</Text>
          </View>
          <View style={styles.selectionBorder} pointerEvents="none" />
        </>
      )}
    </View>
  );
}

// ─── Main canvas ──────────────────────────────────────────────────────────────
export const EditorCanvas = forwardRef<EditorCanvasRef, Props>(({ style }, ref) => {
  const captureViewRef = useRef<View>(null);

  const editedUri       = useEditorStore((s) => s.editedUri);
  const adjustments     = useEditorStore((s) => s.adjustments);
  const curves          = useEditorStore((s) => s.curves);
  const hsl             = useEditorStore((s) => s.hsl);
  const colorGrading    = useEditorStore((s) => s.colorGrading);
  const activeFilterId  = useEditorStore((s) => s.activeFilterId);
  const filterIntensity = useEditorStore((s) => s.filterIntensity);
  const textLayers      = useEditorStore((s) => s.textLayers);
  const stickerLayers   = useEditorStore((s) => s.stickerLayers);
  const shapeLayers     = useEditorStore((s) => s.shapeLayers);
  const drawPaths       = useEditorStore((s) => s.drawPaths);
  const activeTab       = useEditorStore((s) => s.activeTab);
  const rotation        = useEditorStore((s) => s.rotation);
  const flipH           = useEditorStore((s) => s.flipH);
  const flipV           = useEditorStore((s) => s.flipV);
  const updateTextLayer    = useEditorStore((s) => s.updateTextLayer);
  const removeTextLayer    = useEditorStore((s) => s.removeTextLayer);
  const updateStickerLayer = useEditorStore((s) => s.updateStickerLayer);
  const removeStickerLayer = useEditorStore((s) => s.removeStickerLayer);
  const updateShapeLayer   = useEditorStore((s) => s.updateShapeLayer);
  const removeShapeLayer   = useEditorStore((s) => s.removeShapeLayer);

  const isDrawing = activeTab === 'draw';
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // ── captureAsync ───────────────────────────────────────────────────────────
  useImperativeHandle(ref, () => ({
    captureAsync: async () => {
      if (!captureViewRef.current) throw new Error('Canvas not ready');
      return captureRef(captureViewRef, { format: 'jpg', quality: 0.97, result: 'tmpfile' });
    },
  }));

  // ── Live drawing ───────────────────────────────────────────────────────────
  const [livePoints, setLivePoints] = useState<{ x: number; y: number }[]>([]);
  const liveRef = useRef<{ x: number; y: number }[]>([]);

  const drawResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderGrant: (e) => {
        const { locationX: x, locationY: y } = e.nativeEvent;
        liveRef.current = [{ x, y }];
        setLivePoints([{ x, y }]);
      },
      onPanResponderMove: (e) => {
        const { locationX: x, locationY: y } = e.nativeEvent;
        liveRef.current = [...liveRef.current, { x, y }];
        setLivePoints([...liveRef.current]);
      },
      onPanResponderRelease: () => {
        if (liveRef.current.length < 2) { liveRef.current = []; setLivePoints([]); return; }
        const store = useEditorStore.getState();
        store.addDrawPath({
          id:      uid(),
          points:  [...liveRef.current],
          color:   store.drawTool === 'eraser' ? '#0D0D0D' : store.drawColor,
          width:   store.drawSize,
          opacity: store.drawTool === 'marker' ? store.drawOpacity * 0.55 : store.drawOpacity,
          tool:    store.drawTool,
        });
        liveRef.current = [];
        setLivePoints([]);
      },
    })
  ).current;

  // ── Canvas zoom / pan — plain Animated + PanResponder ────────────────────
  const scaleAnim  = useRef(new Animated.Value(1)).current;
  const txAnim     = useRef(new Animated.Value(0)).current;
  const tyAnim     = useRef(new Animated.Value(0)).current;
  const scaleVal   = useRef(1);
  const txVal      = useRef(0);
  const tyVal      = useRef(0);
  const lastDist   = useRef<number | null>(null);
  const tapTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tapCount   = useRef(0);

  const resetZoom = () => {
    scaleVal.current = 1; txVal.current = 0; tyVal.current = 0;
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
      Animated.spring(txAnim,    { toValue: 0, useNativeDriver: true }),
      Animated.spring(tyAnim,    { toValue: 0, useNativeDriver: true }),
    ]).start();
  };

  const canvasResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder:  () => !isDrawing,
      onMoveShouldSetPanResponder:   (_, g) => !isDrawing && (Math.abs(g.dx) > 2 || Math.abs(g.dy) > 2),
      onPanResponderGrant: (e) => {
        const touches = e.nativeEvent.touches;
        if (touches.length === 1) {
          // Double-tap detection
          tapCount.current += 1;
          if (tapTimer.current) clearTimeout(tapTimer.current);
          tapTimer.current = setTimeout(() => { tapCount.current = 0; }, 300);
          if (tapCount.current >= 2) {
            tapCount.current = 0;
            resetZoom();
          }
        }
        if (touches.length === 2) {
          const dx = touches[0].pageX - touches[1].pageX;
          const dy = touches[0].pageY - touches[1].pageY;
          lastDist.current = Math.sqrt(dx * dx + dy * dy);
        }
      },
      onPanResponderMove: (e, g) => {
        const touches = e.nativeEvent.touches;
        if (touches.length === 2 && lastDist.current !== null) {
          // Pinch zoom
          const dx   = touches[0].pageX - touches[1].pageX;
          const dy   = touches[0].pageY - touches[1].pageY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const newScale = Math.max(0.5, Math.min(scaleVal.current * (dist / lastDist.current), 5));
          scaleAnim.setValue(newScale);
          lastDist.current = dist;
        } else if (touches.length === 2) {
          // Two-finger pan
          txAnim.setValue(txVal.current + g.dx);
          tyAnim.setValue(tyVal.current + g.dy);
        }
      },
      onPanResponderRelease: (_, g) => {
        const newScale = (scaleAnim as any)._value ?? scaleVal.current;
        scaleVal.current = newScale;
        txVal.current    = txVal.current + g.dx;
        tyVal.current    = tyVal.current + g.dy;
        lastDist.current = null;
      },
    })
  ).current;

  const zoomStyle = {
    transform: [
      { translateX: txAnim },
      { translateY: tyAnim },
      { scale: scaleAnim },
      { rotate: `${rotation}deg` },
      { scaleX: flipH ? -1 : 1 },
      { scaleY: flipV ? -1 : 1 },
    ],
  };

  if (!editedUri) {
    return (
      <View style={[styles.empty, style]}>
        <Text style={styles.emptyIcon}>🖼️</Text>
        <Text style={styles.emptyText}>Import a photo to start editing</Text>
      </View>
    );
  }

  const livePath: DrawPath | null = livePoints.length >= 2
    ? { id: 'live', points: livePoints, color: drawTool === 'eraser' ? '#0D0D0D' : drawColor, width: drawSize, opacity: drawTool === 'marker' ? drawOpacity * 0.55 : drawOpacity, tool: drawTool }
    : null;

  return (
    <View
      style={[styles.container, style]}
      {...(isDrawing ? {} : canvasResponder.panHandlers)}
      onStartShouldSetResponder={() => { setSelectedId(null); return false; }}>

      <Animated.View style={[styles.zoomWrapper, zoomStyle]}>
        <View ref={captureViewRef} style={styles.composite} collapsable={false}>

          {/* Image + filters */}
          <ImageWithFilters
            uri={editedUri}
            adjustments={adjustments}
            curves={curves}
            hsl={hsl}
            colorGrading={colorGrading}
            activeFilterId={activeFilterId}
            filterIntensity={filterIntensity}
            style={StyleSheet.absoluteFill}
          />

          {/* Draw strokes */}
          {drawPaths.map((p) => <DrawPathView key={p.id} path={p} />)}
          {livePath && <DrawPathView path={livePath} />}

          {/* Shape layers */}
          {shapeLayers.map((layer) => (
            <DraggableShape
              key={layer.id}
              layer={layer}
              isSelected={selectedId === layer.id}
              onSelect={() => setSelectedId(layer.id)}
              onMove={(x, y) => updateShapeLayer(layer.id, { x, y })}
              onResize={(w, h) => updateShapeLayer(layer.id, { width: w, height: h })}
              onDelete={() => { removeShapeLayer(layer.id); setSelectedId(null); }}
            />
          ))}

          {/* Text layers */}
          {textLayers.map((layer) => (
            <DraggableText
              key={layer.id}
              layer={layer}
              isSelected={selectedId === layer.id}
              onSelect={() => setSelectedId(layer.id)}
              onMove={(x, y) => updateTextLayer(layer.id, { x, y })}
              onResize={(size) => updateTextLayer(layer.id, { fontSize: size })}
              onRotate={(deg) => updateTextLayer(layer.id, { rotation: deg })}
              onDelete={() => { removeTextLayer(layer.id); setSelectedId(null); }}
            />
          ))}

          {/* Sticker layers */}
          {stickerLayers.map((layer) => (
            <DraggableSticker
              key={layer.id}
              layer={layer}
              isSelected={selectedId === layer.id}
              onSelect={() => setSelectedId(layer.id)}
              onMove={(x, y) => updateStickerLayer(layer.id, { x, y })}
              onResize={(size) => updateStickerLayer(layer.id, { fontSize: size })}
              onRotate={(deg) => updateStickerLayer(layer.id, { rotation: deg })}
              onDelete={() => { removeStickerLayer(layer.id); setSelectedId(null); }}
            />
          ))}
        </View>
      </Animated.View>

      {/* Draw overlay */}
      {isDrawing && (
        <View style={styles.drawOverlay} {...drawResponder.panHandlers} />
      )}

      {isDrawing && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>✏️  Draw on the photo</Text>
        </View>
      )}

      {!isDrawing && !selectedId && (
        <Text style={styles.hint}>Pinch to zoom · Double-tap to reset</Text>
      )}

      {selectedId && !isDrawing && (
        <View style={styles.legend}>
          <Text style={styles.legendText}>↻ Rotate  ·  ⤡ Resize  ·  ✕ Delete</Text>
        </View>
      )}
    </View>
  );
});

EditorCanvas.displayName = 'EditorCanvas';

// ─── Handle sizes ─────────────────────────────────────────────────────────────
const H = 26; // handle button size

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#0D0D0D', overflow: 'hidden' },
  zoomWrapper: { flex: 1 },
  composite:   { flex: 1, backgroundColor: '#0D0D0D' },

  // ── Layer wrapper
  layerWrap: {
    position: 'absolute',
    zIndex: 10,
  },

  // ── Selection border
  selectionBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1.5,
    borderColor: PF.accent,
    borderStyle: 'dashed',
    borderRadius: 4,
    margin: -6,
    pointerEvents: 'none',
  },

  // ── Delete handle — top-right red circle
  handleDelete: {
    position: 'absolute',
    top: -H / 2 - 4,
    right: -H / 2 - 4,
    width: H,
    height: H,
    borderRadius: H / 2,
    backgroundColor: PF.error,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
  },
  handleDeleteText: { fontSize: 11, color: '#fff', fontWeight: '800' },

  // ── Rotate handle — bottom-left blue circle
  handleRotate: {
    position: 'absolute',
    bottom: -H / 2 - 4,
    left: -H / 2 - 4,
    width: H,
    height: H,
    borderRadius: H / 2,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
  },

  // ── Resize handle — bottom-right accent circle
  handleResize: {
    position: 'absolute',
    bottom: -H / 2 - 4,
    right: -H / 2 - 4,
    width: H,
    height: H,
    borderRadius: H / 2,
    backgroundColor: PF.accent,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
  },
  handleIcon: { fontSize: 13, color: '#fff', fontWeight: '700' },

  // ── Draw overlay
  drawOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30,
    backgroundColor: 'transparent',
  },
  badge: {
    position: 'absolute', top: 10, alignSelf: 'center',
    backgroundColor: 'rgba(123,97,255,0.9)',
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, zIndex: 40,
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },

  // ── Legend bar
  legend: {
    position: 'absolute', bottom: 10, alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 14, paddingVertical: 5,
    borderRadius: 20, zIndex: 40,
  },
  legendText: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },

  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: 14, backgroundColor: PF.bg,
  },
  emptyIcon: { fontSize: 52 },
  emptyText: { fontSize: 14, fontWeight: '500', color: PF.textSecondary, textAlign: 'center' },

  hint: {
    position: 'absolute', bottom: 10, alignSelf: 'center',
    fontSize: 10, fontWeight: '500', color: PF.textMuted,
  },
});
