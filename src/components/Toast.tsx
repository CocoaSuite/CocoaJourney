import { useEffect } from 'react';
import { useStore } from '../store/store';

export function Toast() {
  const msg = useStore((s) => s.toastMsg);
  const clear = useStore((s) => s.toast);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => clear(null), 3200);
    return () => clearTimeout(t);
  }, [msg, clear]);
  if (!msg) return null;
  return (
    <div role="status" className="pointer-events-none fixed inset-x-0 top-20 z-[70] flex justify-center px-4">
      <div className="rounded-2xl bg-ink px-5 py-3 text-[14px] font-medium text-surface shadow-lift animate-rise">{msg}</div>
    </div>
  );
}
