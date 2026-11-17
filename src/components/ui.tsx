import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');
export { cx };

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'forest';

const VARIANTS: Record<BtnVariant, string> = {
  primary: 'bg-cocoa text-surface hover:bg-cocoa-dark shadow-[0_1px_2px_rgb(51_43_37/0.2)]',
  secondary: 'bg-surface text-cocoa border border-line hover:border-latte',
  ghost: 'bg-transparent text-cocoa hover:bg-sand',
  danger: 'bg-surface text-terracotta-dark border border-line hover:border-terracotta',
  forest: 'bg-forest text-surface hover:bg-forest-dark',
};

export function Button({
  variant = 'secondary',
  icon,
  children,
  className,
  size = 'md',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; icon?: IconName; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <button
      type="button"
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-[background,border,transform,color] active:scale-[0.97] disabled:opacity-45 disabled:active:scale-100',
        size === 'sm' && 'min-h-10 px-3 text-[13px]',
        size === 'md' && 'min-h-11 px-4 text-[14px]',
        size === 'lg' && 'min-h-13 px-6 text-[16px]',
        VARIANTS[variant],
        className,
      )}
      {...rest}
    >
      {icon && <Icon name={icon} size={size === 'lg' ? 22 : 18} />}
      {children}
    </button>
  );
}

export function IconButton({
  icon,
  label,
  className,
  active,
  size = 44,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { icon: IconName; label: string; active?: boolean; size?: number }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-xl transition-[background,color,transform] active:scale-[0.94]',
        active ? 'bg-cocoa text-surface' : 'text-cocoa hover:bg-sand',
        className,
      )}
      style={{ width: size, height: size }}
      {...rest}
    >
      <Icon name={icon} />
    </button>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex min-h-11 w-full items-center justify-between gap-3 text-left text-[14px]"
    >
      <span>{label}</span>
      <span className={cx('relative h-[26px] w-[44px] shrink-0 rounded-full transition-colors', checked ? 'bg-forest' : 'bg-[#D9CCB8]')}>
        <span
          className={cx('absolute top-[3px] h-5 w-5 rounded-full bg-surface shadow transition-[left]', checked ? 'left-[21px]' : 'left-[3px]')}
        />
      </span>
    </button>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format = (v) => String(v),
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  return (
    <label className="flex flex-col gap-1 text-[14px]">
      <span className="flex items-center justify-between">
        {label}
        <span className="font-semibold tabular-nums">{format(value)}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-label={label} />
    </label>
  );
}

export function Stepper({ value, onChange, min = -99, max = 99, label, big }: { value: number; onChange: (v: number) => void; min?: number; max?: number; label: string; big?: boolean }) {
  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  return (
    <div className="flex items-center gap-1" role="group" aria-label={label}>
      <IconButton icon="minus" label={`Decrease ${label}`} onClick={() => onChange(clamp(value - 1))} className="border border-line bg-surface" />
      <input
        className={cx('field w-16 text-center font-bold tabular-nums', big && 'text-[20px]')}
        inputMode="numeric"
        value={value}
        aria-label={label}
        onChange={(e) => {
          const n = parseInt(e.target.value.replace(/[^\d-]/g, ''), 10);
          if (!Number.isNaN(n)) onChange(clamp(n));
          else if (e.target.value === '' || e.target.value === '-') onChange(0);
        }}
        onFocus={(e) => e.target.select()}
      />
      <IconButton icon="plus" label={`Increase ${label}`} onClick={() => onChange(clamp(value + 1))} className="border border-line bg-surface" />
    </div>
  );
}

export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1 rounded-2xl bg-sand p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            'min-h-10 flex-1 rounded-xl px-3 text-[13px] font-semibold transition-colors',
            value === o.value ? 'bg-surface text-ink shadow-soft' : 'text-muted hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    ref.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgb(51_43_37/0.35)] p-4 animate-fade" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cx('max-h-[90vh] w-full overflow-auto rounded-3xl bg-surface p-6 shadow-lift outline-none animate-pop', wide ? 'max-w-2xl' : 'max-w-md')}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="font-display text-[22px] font-semibold">{title}</h2>
          <IconButton icon="close" label="Close" onClick={onClose} />
        </div>
        {children}
      </div>
    </div>
  );
}

export function Empty({ icon, title, children }: { icon: IconName; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sand text-cocoa">
        <Icon name={icon} size={26} />
      </span>
      <h3 className="font-display text-[19px] font-semibold">{title}</h3>
      {children && <div className="max-w-sm text-[14px] text-muted">{children}</div>}
    </div>
  );
}
