import type { DieType } from '../types';

// Small flat die silhouettes for buttons and history chips.
const SHAPES: Record<DieType, string> = {
  d4: 'M12 3 L21.5 19.5 H2.5 Z',
  d6: 'M5 5 H19 V19 H5 Z',
  d8: 'M12 2.5 L21 12 L12 21.5 L3 12 Z',
  d10: 'M12 2.5 L21 10 L12 21.5 L3 10 Z',
  d12: 'M12 2.5 L21 9 L17.5 20 H6.5 L3 9 Z',
  d20: 'M12 2.5 L20.5 7.3 V16.7 L12 21.5 L3.5 16.7 V7.3 Z',
  d100: 'M12 2.5 L21 10 L12 21.5 L3 10 Z',
};

export function DieGlyph({ type, size = 28, fill = 'currentColor', label, textColor = '#FFFDF8' }: { type: DieType; size?: number; fill?: string; label?: string | number; textColor?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d={SHAPES[type]} fill={fill} stroke="rgb(51 43 37 / .25)" strokeWidth={0.8} strokeLinejoin="round" />
      {type === 'd20' && <path d="M12 7 L16.5 15 H7.5 Z" fill="none" stroke="rgb(255 253 248 / .35)" strokeWidth={0.8} />}
      {label !== undefined && (
        <text x="12" y={type === 'd4' ? 16.5 : 13} textAnchor="middle" dominantBaseline="middle" fontSize={String(label).length > 2 ? 6.5 : 8.5} fontWeight={700} fill={textColor} fontFamily="DM Sans Variable, sans-serif">
          {label}
        </text>
      )}
    </svg>
  );
}

export const DIE_FILL: Record<DieType, string> = {
  d4: '#B9A27E',
  d6: '#A68B70',
  d8: '#B86F55',
  d10: '#5F7152',
  d12: '#A57C4E',
  d20: '#72513D',
  d100: '#4C5C42',
};
