import { get, set, del } from 'idb-keyval';
import type { MapInfo } from '../types';
import { uid } from './id';
import sampleMapUrl from '../assets/sample-map.webp';

// Large map images live in IndexedDB as Blobs, separate from session JSON.

export const SAMPLE_MAPS: Record<string, { url: string; name: string; width: number; height: number }> = {
  abbey: { url: sampleMapUrl, name: 'The Sunken Abbey', width: 2520, height: 1680 },
};

export const ACCEPTED_MAP_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

const urlCache = new Map<string, string>();

export async function importMapFile(file: File): Promise<MapInfo> {
  if (!ACCEPTED_MAP_TYPES.includes(file.type)) {
    throw new Error('Please choose a PNG, JPG or WebP image.');
  }
  const { width, height } = await imageSize(file);
  const blobKey = uid('map:');
  await safeSet(blobKey, file);
  urlCache.set(blobKey, URL.createObjectURL(file));
  return {
    id: uid('m'),
    name: file.name.replace(/\.[^.]+$/, ''),
    width,
    height,
    source: { kind: 'upload', blobKey, mime: file.type },
  };
}

export async function storeMapBlob(blob: Blob, name: string): Promise<MapInfo> {
  const { width, height } = await imageSize(blob);
  const blobKey = uid('map:');
  await safeSet(blobKey, blob);
  urlCache.set(blobKey, URL.createObjectURL(blob));
  return { id: uid('m'), name, width, height, source: { kind: 'upload', blobKey, mime: blob.type } };
}

export async function mapUrl(map: MapInfo): Promise<string> {
  if (map.source.kind === 'sample') return SAMPLE_MAPS[map.source.sampleId]?.url ?? SAMPLE_MAPS.abbey.url;
  const key = map.source.blobKey;
  const cached = urlCache.get(key);
  if (cached) return cached;
  const blob = await get<Blob>(key);
  if (!blob) throw new Error('This map image is missing from this device.');
  const url = URL.createObjectURL(blob);
  urlCache.set(key, url);
  return url;
}

export async function mapBlob(map: MapInfo): Promise<Blob | undefined> {
  if (map.source.kind !== 'upload') return undefined;
  return get<Blob>(map.source.blobKey);
}

export async function deleteMap(map: MapInfo | null) {
  if (!map || map.source.kind !== 'upload') return;
  const url = urlCache.get(map.source.blobKey);
  if (url) URL.revokeObjectURL(url);
  urlCache.delete(map.source.blobKey);
  await del(map.source.blobKey);
}

function imageSize(blob: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('That image could not be read.'));
    };
    img.src = url;
  });
}

/** Storage can be unavailable (private modes, sandboxed frames); keep the map in memory then. */
async function safeSet(key: string, blob: Blob) {
  try {
    await set(key, blob);
  } catch {
    /* in-memory only for this visit */
  }
}
