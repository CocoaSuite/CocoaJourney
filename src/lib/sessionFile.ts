import type { Session } from '../types';
import { mapBlob, storeMapBlob } from './mapStore';
import { uid } from './id';

const FORMAT = 'cocoajourney.session';
const VERSION = 1;

interface SessionFile {
  format: typeof FORMAT;
  version: number;
  exportedAt: string;
  session: Session;
  mapData?: string; // data URL for uploaded maps
}

const blobToDataUrl = (b: Blob) =>
  new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = () => rej(r.error);
    r.readAsDataURL(b);
  });

export async function exportSession(session: Session) {
  const file: SessionFile = { format: FORMAT, version: VERSION, exportedAt: new Date().toISOString(), session };
  if (session.map?.source.kind === 'upload') {
    const blob = await mapBlob(session.map);
    if (blob) file.mapData = await blobToDataUrl(blob);
  }
  const out = new Blob([JSON.stringify(file)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(out);
  a.download = `${session.name.replace(/[^\w\- ]+/g, '').trim() || 'session'}.cocoajourney.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export async function importSessionFile(f: File): Promise<Session> {
  let data: SessionFile;
  try {
    data = JSON.parse(await f.text());
  } catch {
    throw new Error('That file is not a CocoaJourney session.');
  }
  if (data?.format !== FORMAT || !data.session) throw new Error('That file is not a CocoaJourney session.');
  const s: Session = { ...data.session, id: uid('s'), updatedAt: Date.now() };
  if (s.map?.source.kind === 'upload') {
    if (data.mapData) {
      const blob = await (await fetch(data.mapData)).blob();
      const info = await storeMapBlob(blob, s.map.name);
      s.map = info;
    } else {
      s.map = null;
    }
  }
  s.rolls = Array.isArray(s.rolls) ? s.rolls : [];
  s.figurines = s.figurines ?? {};
  return s;
}
