# CocoaJourney

A simple, beautiful tabletop for D&D sessions. Put little fantasy figurines on a map, move them around a grid, keep a light character sheet, and roll real 3D dice in a wooden tray.

CocoaJourney is built for **one shared tablet in the middle of the table** (iPad first), and works just as well on desktop browsers. Everything is saved on the device automatically.

## Features

- **Game table** — upload a PNG, JPG or WebP map (or drop it onto the table), automatic square grid, adjustable cell size, opacity, color, offset and "squares across", grid toggle, snap-to-grid. Pinch / scroll to zoom, drag to pan, fit-to-screen.
- **Figurines** — layered, illustrated miniatures on round bases with name tags, HP bars and a selection ring. Drag to move, with a snapping preview. While a figurine is held, other touches never move the map.
- **Character workshop** — large live preview, categories (archetype, body, skin, face, eyes, ears & horns, facial hair, hairstyle, colors, tunic & armor, cloak, gloves, boots, belt, weapon, shield, accessory, base), horizontally scrolling visual options with previous/next, randomize, save.
- **Character sheet** — class, species, level, background, alignment, six abilities with automatic modifiers, saving throws, 18 skills with proficiency/expertise, passive perception, AC, speed, initiative, proficiency bonus, HP with damage/heal/temp HP, equipment, spells and notes. Tap any bonus to roll it.
- **3D dice** — d4, d6, d8, d10, d12, d20 and d100 (tens + units dice), thrown with rigid-body physics in a full-screen wooden tray. **The result is read from the face that lands on top** — it is never decided in advance. Modifiers, advantage/disadvantage, natural 20 / natural 1 treatments, roll history, synthesized dice sounds.
- **Sessions** — create, rename, delete; export/import a session file (including the uploaded map); a sample adventure, *The Sunken Abbey*, with four ready-made heroes.
- **Offline** — after the first load the app works without a connection (service worker).

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build
npm test           # dice logic and dice geometry tests
```

Open the dev server from an iPad on the same network with `npm run dev -- --host`.

## Tech

React 19, TypeScript, Vite, Tailwind CSS v4, Zustand (state), IndexedDB via `idb-keyval` (sessions + map images), three.js (dice rendering) and cannon-es (dice physics). Fonts: Fraunces and DM Sans, bundled locally.

## Project layout

```
src/
  app/        App shell, home (sessions), top bar, settings
  table/      GameTable, MapCanvas (camera + gestures), GridOverlay, GridPanel,
              Figurine, FigurineManager (party sidebar), QuickCard, MapImporter
  figurine/   Layered parts registry, FigurineArt renderer, archetype presets
  creator/    CharacterCreator (workshop) and CharactersView (roster)
  sheet/      CharacterSheet drawer
  dice/       DiceRoller (floating control), DiceTray (full-screen 3D),
              engine (three.js + cannon-es), geometry (polyhedra), logic (results)
  rules/      dnd5e.ts — abilities, skills and derived stats
  store/      Zustand store, persistence, sample session
  lib/        map storage, session files, ids/RNG, color helpers
scripts/sample-map/  Generator for the sample map (SVG → WebP)
```

### How the dice stay honest

`dice/geometry.ts` builds each die from its vertex set; the same polygons feed both the rendered mesh and the physics hull. Dice are thrown with random position, velocity and spin from `crypto.getRandomValues`. When every die has been still for a moment, `readDie` finds the face whose normal points most nearly up (the top vertex for a d4), and that printed value is the result. A die resting cocked against a wall or another die gets a small nudge and settles again. Without WebGL, or with the 3D tray turned off in Settings, rolls use the same cryptographic RNG directly.

### Asset replacement

Figurines are drawn from layers (`src/figurine/parts.tsx`). Each option returns drawings for named layers — `cloakBack`, `hairBack`, `legs`, `boots`, `torso`, `belt`, `cloakFront`, `accBody`, `weapon`, `arms`, `gloves`, `earsBack`, `facialHair`, `face`, `eyes`, `hairFront`, `earsFront`, `accessory`, `shield` — inside a 120×160 viewBox (body parts in body space with feet at y=142, head parts in head space with the neck at y=72).

To use painted artwork, keep the option ids and return an image for a layer instead of vector shapes:

```tsx
{ id: 'long', label: 'Long', draw: () => ({ hairFront: <image href="/art/hair-long.png" x={20} y={0} width={80} height={100} /> }) }
```

Transparent PNG/WebP layers drawn at a consistent scale and camera angle can be mixed with the vector parts.

### Rulesets

All rules math lives in `src/rules/dnd5e.ts`, and each character records its `ruleset`. Another system can be added as a sibling module with the same small surface (abilities, skills, derived stats) and picked by that id.

### Shared play (roadmap)

Today CocoaJourney is a single-device table; nothing is synchronized between devices. The store is organised so that every change to the shared table (map, grid, figurine moves, characters, dice results) goes through a named action. A future room-code mode can broadcast those actions from the DM's table and apply them on players' devices, with the DM role (`Session.role`) controlling who may change the map.

## Sample map

`scripts/sample-map/gen.py` procedurally draws *The Sunken Abbey* as SVG; `render.py` rasterises it to `src/assets/sample-map.webp` (2520×1680, 84 px squares). Both need Python 3, and the render step needs Playwright with Chrome.

© CocoaSuite
