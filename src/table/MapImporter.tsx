import { useRef, useState } from 'react';
import { useStore } from '../store/store';
import { importMapFile, SAMPLE_MAPS } from '../lib/mapStore';
import { uid } from '../lib/id';
import { Button } from '../components/ui';
import { Icon } from '../components/Icon';

export function useMapImport() {
  const setMap = useStore((s) => s.setMap);
  const setGrid = useStore((s) => s.setGrid);
  const toast = useStore((s) => s.toast);
  const [busy, setBusy] = useState(false);

  const importFile = async (f: File | undefined | null) => {
    if (!f) return;
    setBusy(true);
    try {
      const m = await importMapFile(f);
      setMap(m);
      // A sensible starting grid: roughly 30 squares across.
      setGrid({ cellSize: Math.max(24, Math.round(m.width / 30)), offsetX: 0, offsetY: 0 });
      toast(`Map “${m.name}” added`);
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const useSample = () => {
    const s = SAMPLE_MAPS.abbey;
    setMap({ id: uid('m'), name: s.name, width: s.width, height: s.height, source: { kind: 'sample', sampleId: 'abbey' } });
    setGrid({ cellSize: 84, offsetX: 0, offsetY: 0 });
  };

  return { importFile, useSample, busy };
}

export function MapImporter() {
  const input = useRef<HTMLInputElement>(null);
  const { importFile, useSample, busy } = useMapImport();
  const [over, setOver] = useState(false);

  return (
    <div
      className="absolute inset-0 flex items-center justify-center p-6"
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        importFile(e.dataTransfer.files[0]);
      }}
    >
      <div
        className={`flex w-full max-w-lg flex-col items-center gap-5 rounded-[28px] border-2 border-dashed p-10 text-center transition-colors ${over ? 'border-cocoa bg-surface' : 'border-latte/60 bg-surface/70'}`}
      >
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sand text-cocoa">
          <Icon name={busy ? 'sparkle' : 'map'} size={30} className={busy ? 'animate-spin' : ''} />
        </span>
        <div className="flex flex-col gap-2">
          <h2 className="font-display text-[26px] font-semibold">Lay out your map</h2>
          <p className="text-muted">Drop a PNG, JPG or WebP map here, or choose one from this device. A grid is added on top automatically.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Button variant="primary" size="lg" icon="upload" disabled={busy} onClick={() => input.current?.click()}>
            {busy ? 'Importing…' : 'Upload a map'}
          </Button>
          <Button size="lg" icon="sparkle" onClick={useSample} disabled={busy}>
            Use the sample map
          </Button>
        </div>
        <input
          ref={input}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          hidden
          onChange={(e) => {
            importFile(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </div>
    </div>
  );
}
