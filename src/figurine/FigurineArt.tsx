import { memo, type ReactNode } from 'react';
import type { Appearance } from '../types';
import { shade } from '../lib/color';
import { BODY_LAYERS, HEAD_LAYERS, INK, O, PARTS, baseHex, findPart, skinHex, type Drawn, type Layer, type PartSlot } from './parts';

export type Crop = 'full' | 'head' | 'figure';

const VIEWBOX: Record<Crop, string> = {
  full: '0 -12 120 172',
  figure: '6 -8 108 162',
  head: '22 0 76 76',
};

const FEET_Y = 142;
const NECK_Y = 72;

function collect(a: Appearance): Drawn {
  const out: Drawn = {};
  const slots: PartSlot[] = ['ears', 'facialHair', 'face', 'eyes', 'hair', 'top', 'cloak', 'gloves', 'boots', 'belt', 'weapon', 'shield', 'accessory'];
  for (const slot of slots) {
    const opt = findPart(slot, (a as unknown as Record<string, string>)[slot]);
    const drawn = opt.draw?.(a);
    if (!drawn) continue;
    for (const [k, v] of Object.entries(drawn) as [Layer, ReactNode][]) {
      out[k] = out[k] ? (
        <>
          {out[k]}
          {v}
        </>
      ) : (
        v
      );
    }
  }
  return out;
}

interface Props {
  appearance: Appearance;
  crop?: Crop;
  className?: string;
  title?: string;
  /** Hide the base disc, for thumbnails of head-related options. */
  noBase?: boolean;
}

/** A layered, illustrated miniature drawn from an Appearance. */
export const FigurineArt = memo(function FigurineArt({ appearance: a, crop = 'full', className, title, noBase }: Props) {
  const body = findPart('body', a.body) as (typeof PARTS.body)[number];
  const top = findPart('top', a.top) as (typeof PARTS.top)[number];
  const L = collect(a);
  const skin = skinHex(a);
  const sleeve = top.sleeve(a);
  const sw = top.sleeveWidth ?? 10;
  const neckY = FEET_Y - (FEET_Y - NECK_Y) * body.sy;
  const headShift = neckY - NECK_Y;
  const bodyT = `translate(60 ${FEET_Y}) scale(${body.sx} ${body.sy}) translate(-60 ${-FEET_Y})`;
  const headT = `translate(0 ${headShift})`;
  const base = baseHex(a);
  const pants = shade(top.id === 'wrap' ? '#3E3833' : top.sleeve(a), -0.35);

  const arms = (
    <g fill="none" strokeLinecap="round">
      <path d="M43 79 Q35 90 35 104" stroke={INK} strokeWidth={sw + 3.2} />
      <path d="M77 79 Q85 90 85 104" stroke={INK} strokeWidth={sw + 3.2} />
      <path d="M43 79 Q35 90 35 104" stroke={sleeve} strokeWidth={sw} />
      <path d="M77 79 Q85 90 85 104" stroke={sleeve} strokeWidth={sw} />
      <circle cx={35} cy={106} r={5.5} fill={skin} {...O} />
      <circle cx={85} cy={106} r={5.5} fill={skin} {...O} />
    </g>
  );

  const legs = top.long ? null : (
    <g fill={pants} {...O}>
      <rect x={48} y={112} width={11} height={28} rx={2} />
      <rect x={61} y={112} width={11} height={28} rx={2} />
    </g>
  );

  const bodyLayers: Partial<Record<Layer, ReactNode>> = { ...L, legs, arms: <>{arms}</> };
  const glovesAndArms = (k: Layer) => (k === 'arms' ? arms : bodyLayers[k]);

  return (
    <svg viewBox={VIEWBOX[crop]} className={className} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      {!noBase && (
        <g>
          <ellipse cx={60} cy={150} rx={44} ry={9} fill="#332B25" opacity={0.18} />
          <ellipse cx={60} cy={146} rx={41} ry={10.5} fill={shade(base, -0.35)} stroke={INK} strokeWidth={1.4} />
          <ellipse cx={60} cy={142.5} rx={41} ry={10} fill={base} stroke={INK} strokeWidth={1.4} />
          <ellipse cx={60} cy={142} rx={34} ry={7} fill="none" stroke={shade(base, 0.25)} strokeWidth={1.2} opacity={0.7} />
        </g>
      )}

      <g transform={bodyT}>
        {L.cloakBack}
      </g>
      <g transform={headT}>{L.hairBack}</g>
      <g transform={bodyT}>
        {BODY_LAYERS.filter((k) => k !== 'cloakBack' && k !== 'gloves').map((k) => (
          <g key={k}>{glovesAndArms(k)}</g>
        ))}
        {L.gloves}
      </g>
      <g transform={headT}>
        <rect x={55} y={62} width={10} height={14} rx={3} fill={skin} {...O} />
        {L.earsBack}
        <circle cx={60} cy={46} r={22} fill={skin} {...O} />
        {HEAD_LAYERS.filter((k) => k !== 'earsBack').map((k) => (
          <g key={k}>{L[k]}</g>
        ))}
      </g>
      <g transform={bodyT}>{L.shield}</g>
    </svg>
  );
});
