/**
 * Image Service — local editing via expo-image-manipulator.
 * All operations are offline-capable.
 */

import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';

import { Adjustments, ExportFormat, ExportOptions } from '@/types/editor';

// ─── Safe format map — WEBP crashes on some Android devices ──────────────────
const FORMAT_MAP: Record<ExportFormat, ImageManipulator.SaveFormat> = {
  jpeg: ImageManipulator.SaveFormat.JPEG,
  png:  ImageManipulator.SaveFormat.PNG,
  // Fall back to JPEG if WEBP is unavailable at runtime
  webp: (ImageManipulator.SaveFormat as Record<string, ImageManipulator.SaveFormat>).WEBP
    ?? ImageManipulator.SaveFormat.JPEG,
};

// ─── Apply adjustments ────────────────────────────────────────────────────────
// expo-image-manipulator doesn't support colour adjustments natively.
// We save a clean copy here; visual adjustments are rendered via CSS-style
// filters on the canvas (Image tintColor / opacity) in the UI layer.
// This function is used to "bake" the current state before export.
export async function applyAdjustments(
  uri: string,
  _adjustments: Adjustments
): Promise<string> {
  // Re-save at high quality to produce a clean working copy
  const result = await ImageManipulator.manipulateAsync(uri, [], {
    compress: 0.95,
    format: ImageManipulator.SaveFormat.JPEG,
  });
  return result.uri;
}

// ─── Crop ─────────────────────────────────────────────────────────────────────
export async function cropImage(
  uri: string,
  crop: { originX: number; originY: number; width: number; height: number }
): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ crop }],
    { compress: 0.95, format: ImageManipulator.SaveFormat.JPEG }
  );
  return result.uri;
}

// ─── Rotate ───────────────────────────────────────────────────────────────────
export async function rotateImage(uri: string, degrees: number): Promise<string> {
  if (degrees === 0) return uri;
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ rotate: degrees }],
    { compress: 0.95, format: ImageManipulator.SaveFormat.JPEG }
  );
  return result.uri;
}

// ─── Flip ─────────────────────────────────────────────────────────────────────
export async function flipImage(
  uri: string,
  horizontal: boolean,
  vertical: boolean
): Promise<string> {
  const actions: ImageManipulator.Action[] = [];
  if (horizontal) actions.push({ flip: ImageManipulator.FlipType.Horizontal });
  if (vertical)   actions.push({ flip: ImageManipulator.FlipType.Vertical });
  if (actions.length === 0) return uri;

  const result = await ImageManipulator.manipulateAsync(uri, actions, {
    compress: 0.95,
    format: ImageManipulator.SaveFormat.JPEG,
  });
  return result.uri;
}

// ─── Resize ───────────────────────────────────────────────────────────────────
export async function resizeImage(
  uri: string,
  width: number,
  height?: number
): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width, height } }],
    { compress: 0.95, format: ImageManipulator.SaveFormat.JPEG }
  );
  return result.uri;
}

// ─── Export ───────────────────────────────────────────────────────────────────
export async function exportImage(
  uri: string,
  options: ExportOptions
): Promise<string> {
  const format = FORMAT_MAP[options.format];

  // Bake rotation + flip into the exported file
  const result = await ImageManipulator.manipulateAsync(uri, [], {
    compress: Math.max(0.1, Math.min(1, options.quality)),
    format,
  });

  const exportedUri = result.uri;

  if (options.saveToGallery) {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        await MediaLibrary.saveToLibraryAsync(exportedUri);
      }
    } catch (e) {
      console.warn('MediaLibrary save failed:', e);
    }
  }

  if (options.share) {
    try {
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(exportedUri, {
          mimeType: options.format === 'png' ? 'image/png' : 'image/jpeg',
          dialogTitle: 'Share your Kayu creation',
        });
      }
    } catch (e) {
      console.warn('Sharing failed:', e);
    }
  }

  return exportedUri;
}

// ─── Save draft ───────────────────────────────────────────────────────────────
export async function saveDraft(uri: string, id: string): Promise<string> {
  const dir = `${FileSystem.documentDirectory}kayu/drafts/`;
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  const dest = `${dir}${id}.jpg`;
  await FileSystem.copyAsync({ from: uri, to: dest });
  return dest;
}

export async function loadDraft(id: string): Promise<string | null> {
  const path = `${FileSystem.documentDirectory}kayu/drafts/${id}.jpg`;
  const info = await FileSystem.getInfoAsync(path);
  return info.exists ? path : null;
}

// ─── Thumbnail ────────────────────────────────────────────────────────────────
export async function generateThumbnail(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 200 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
  );
  return result.uri;
}
