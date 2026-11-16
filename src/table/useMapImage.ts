import { useEffect, useState } from 'react';
import type { MapInfo } from '../types';
import { mapUrl } from '../lib/mapStore';

export function useMapImage(map: MapInfo | null) {
  const [state, setState] = useState<{ url: string | null; error: string | null; loading: boolean }>({ url: null, error: null, loading: !!map });
  useEffect(() => {
    let alive = true;
    if (!map) {
      setState({ url: null, error: null, loading: false });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    mapUrl(map)
      .then((url) => alive && setState({ url, error: null, loading: false }))
      .catch((e: Error) => alive && setState({ url: null, error: e.message, loading: false }));
    return () => {
      alive = false;
    };
  }, [map?.id]);
  return state;
}
