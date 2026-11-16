import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { dieShape, readDie, type V3 } from './geometry';
import { faceLayout, faceTexture, feltTexture, woodTexture, RESINS } from './textures';
import type { PhysicalDie, PhysicalKind } from './logic';
import { randFloat } from '../lib/id';

// A full-screen wooden dice tray: real rigid-body physics decides every result.

const rnd = (a: number, b: number) => a + (b - a) * randFloat();

function buildMesh(kind: PhysicalKind): THREE.Mesh {
  const shape = dieShape(kind);
  const pos: number[] = [];
  const nrm: number[] = [];
  const uvs: number[] = [];
  const geo = new THREE.BufferGeometry();
  let start = 0;
  shape.faces.forEach((f, fi) => {
    const { uv } = faceLayout(shape, fi);
    for (let k = 1; k < f.verts.length - 1; k++) {
      for (const j of [0, k, k + 1]) {
        const p = shape.vertices[f.verts[j]];
        pos.push(...p);
        nrm.push(...f.normal);
        uvs.push(...uv[j]);
      }
    }
    const count = (f.verts.length - 2) * 3;
    geo.addGroup(start, count, fi);
    start += count;
  });
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

  const materials = shape.faces.map(
    (_, fi) =>
      new THREE.MeshPhysicalMaterial({
        map: faceTexture(kind, fi),
        roughness: 0.32,
        metalness: 0,
        clearcoat: 1,
        clearcoatRoughness: 0.18,
        sheen: 0.2,
        transparent: true,
        opacity: 1,
      }),
  );
  const mesh = new THREE.Mesh(geo, materials);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  // Softly rounded silhouette: a slightly larger, darker shell behind the faces.
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(geo, 10),
    new THREE.LineBasicMaterial({ color: new THREE.Color(RESINS[kind].edge), transparent: true, opacity: 0.85 }),
  );
  mesh.add(edges);
  return mesh;
}

function buildBody(kind: PhysicalKind, mat: CANNON.Material): CANNON.Body {
  const shape = dieShape(kind);
  const hull = new CANNON.ConvexPolyhedron({
    vertices: shape.vertices.map((v) => new CANNON.Vec3(...v)),
    faces: shape.faces.map((f) => f.verts),
  });
  const body = new CANNON.Body({ mass: 1, material: mat, linearDamping: 0.12, angularDamping: 0.12 });
  body.addShape(hull);
  return body;
}

interface ActiveDie {
  def: PhysicalDie;
  mesh: THREE.Mesh;
  body: CANNON.Body;
  still: number;
  nudges: number;
}

export interface EngineOptions {
  sound: boolean;
}

export class DiceEngine {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
  private world = new CANNON.World({ gravity: new CANNON.Vec3(0, -70, 0) });
  private diceMat = new CANNON.Material('dice');
  private floorMat = new CANNON.Material('floor');
  private wallMat = new CANNON.Material('wall');
  private dice: ActiveDie[] = [];
  private walls: CANNON.Body[] = [];
  private rim = new THREE.Group();
  private felt = feltTexture();
  private raf = 0;
  private last = 0;
  private acc = 0;
  private rolling = false;
  private elapsed = 0;
  private resolveRoll: ((r: number[]) => void) | null = null;
  private bounds = { x: 8, zMin: -6, zMax: 6 };
  private audio: AudioContext | null = null;
  private lastClick = 0;
  private disposed = false;
  private basePos = new THREE.Vector3();
  private baseLook = new THREE.Vector3();
  private look = new THREE.Vector3();
  private tween: { from: THREE.Vector3; fromLook: THREE.Vector3; to: THREE.Vector3; toLook: THREE.Vector3; elapsed: number; duration: number } | null = null;

  constructor(private canvas: HTMLCanvasElement, private opts: EngineOptions) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.scene.background = new THREE.Color('#2A1E17');

    this.world.allowSleep = false;
    this.world.defaultContactMaterial.friction = 0.3;
    this.world.addContactMaterial(new CANNON.ContactMaterial(this.diceMat, this.floorMat, { friction: 0.35, restitution: 0.32 }));
    this.world.addContactMaterial(new CANNON.ContactMaterial(this.diceMat, this.wallMat, { friction: 0.1, restitution: 0.55 }));
    this.world.addContactMaterial(new CANNON.ContactMaterial(this.diceMat, this.diceMat, { friction: 0.2, restitution: 0.4 }));
    (this.world.solver as CANNON.GSSolver).iterations = 14;

    this.setupLights();
    this.setupFloor();
    this.resize();
    this.loop = this.loop.bind(this);
    this.raf = requestAnimationFrame(this.loop);
  }

  private setupLights() {
    this.scene.add(new THREE.HemisphereLight('#FFF3E0', '#3A2A20', 0.9));
    const key = new THREE.DirectionalLight('#FFE9CC', 2.4);
    key.position.set(-8, 24, 10);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    const cam = key.shadow.camera as THREE.OrthographicCamera;
    cam.left = -22;
    cam.right = 22;
    cam.top = 16;
    cam.bottom = -16;
    cam.near = 1;
    cam.far = 60;
    key.shadow.bias = -0.0008;
    key.shadow.radius = 4;
    this.scene.add(key);
    const fill = new THREE.PointLight('#F2C9A0', 30, 60, 1.6);
    fill.position.set(10, 10, -6);
    this.scene.add(fill);
  }

  private setupFloor() {
    // Dark tabletop around the tray; the felt itself is sized to the tray in buildWalls().
    const table = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: '#3A2A20', roughness: 0.8 }));
    table.rotation.x = -Math.PI / 2;
    table.position.y = -1.2;
    table.receiveShadow = true;
    this.scene.add(table);

    const body = new CANNON.Body({ mass: 0, material: this.floorMat, shape: new CANNON.Plane() });
    body.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    this.world.addBody(body);

    const ceiling = new CANNON.Body({ mass: 0, material: this.wallMat, shape: new CANNON.Plane() });
    ceiling.quaternion.setFromEuler(Math.PI / 2, 0, 0);
    ceiling.position.set(0, 14, 0);
    this.world.addBody(ceiling);

    this.scene.add(this.rim);
  }

  /** Fit the tray walls to whatever the camera can see. */
  resize() {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // Keep roughly the same tray area on portrait and landscape.
    const portrait = h > w;
    const dist = portrait ? 25 : 18.5;
    this.basePos.set(0, dist, dist * 0.32);
    this.baseLook.set(0, 0, 0.4);
    this.camera.position.copy(this.basePos);
    this.look.copy(this.baseLook);
    this.camera.lookAt(this.look);
    this.tween = null;
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld();

    const ray = new THREE.Raycaster();
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const hit = (x: number, y: number) => {
      ray.setFromCamera(new THREE.Vector2(x, y), this.camera);
      const p = new THREE.Vector3();
      ray.ray.intersectPlane(plane, p);
      return p;
    };
    const tl = hit(-1, 1);
    const br = hit(1, -1);
    const bl = hit(-1, -1);
    const halfX = Math.min(Math.abs(bl.x), Math.abs(br.x), Math.abs(tl.x)) - 1.1;
    this.bounds = { x: halfX, zMin: tl.z + 1.4, zMax: bl.z - 1.1 };
    this.buildWalls();
  }

  private buildWalls() {
    for (const b of this.walls) this.world.removeBody(b);
    this.walls = [];
    this.rim.traverse((o) => (o as THREE.Mesh).geometry?.dispose());
    this.rim.clear();
    const { x, zMin, zMax } = this.bounds;
    const add = (pos: [number, number, number], euler: [number, number, number]) => {
      const b = new CANNON.Body({ mass: 0, material: this.wallMat, shape: new CANNON.Plane() });
      b.position.set(...pos);
      b.quaternion.setFromEuler(...euler);
      this.world.addBody(b);
      this.walls.push(b);
    };
    add([-x, 0, 0], [0, Math.PI / 2, 0]);
    add([x, 0, 0], [0, -Math.PI / 2, 0]);
    add([0, 0, zMin], [0, 0, 0]);
    add([0, 0, zMax], [0, Math.PI, 0]);

    const felt = new THREE.Mesh(
      new THREE.PlaneGeometry(2 * x + 0.2, zMax - zMin + 0.2),
      new THREE.MeshStandardMaterial({ map: this.felt, roughness: 0.95, metalness: 0 }),
    );
    felt.rotation.x = -Math.PI / 2;
    felt.position.set(0, 0, (zMin + zMax) / 2);
    felt.receiveShadow = true;
    this.rim.add(felt);

    const wood = woodTexture();
    const mat = new THREE.MeshStandardMaterial({ map: wood, roughness: 0.55, metalness: 0.05 });
    const t = 2.4;
    const hgt = 1.6;
    const depth = zMax - zMin;
    // Every plank is built along X so the grain runs lengthwise, then rotated into place.
    const mk = (len: number, px: number, pz: number, rotY: number) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(len, hgt + 1.2, t), mat);
      m.position.set(px, (hgt - 1.2) / 2, pz);
      m.rotation.y = rotY;
      m.castShadow = true;
      m.receiveShadow = true;
      this.rim.add(m);
    };
    wood.repeat.set(2, 1);
    mk(depth + 2 * t, -x - t / 2, (zMin + zMax) / 2, Math.PI / 2);
    mk(depth + 2 * t, x + t / 2, (zMin + zMax) / 2, Math.PI / 2);
    mk(2 * x + 2 * t, 0, zMin - t / 2, 0);
    mk(2 * x + 2 * t, 0, zMax + t / 2, 0);
  }

  private clear() {
    for (const d of this.dice) {
      this.scene.remove(d.mesh);
      this.world.removeBody(d.body);
      d.mesh.geometry.dispose();
    }
    this.dice = [];
  }

  /** Throw dice; resolves with the printed reading of each die once all are at rest. */
  roll(defs: PhysicalDie[]): Promise<number[]> {
    this.clear();
    this.ensureAudio();
    this.glideTo(this.basePos.clone(), this.baseLook.clone(), 0.45);
    const { x, zMin, zMax } = this.bounds;
    const side = Math.floor(randFloat() * 4);
    const n = defs.length;
    const spread = Math.min(2.6, (2 * x - 4) / Math.max(1, n));

    defs.forEach((def, i) => {
      const mesh = buildMesh(def.kind);
      const body = buildBody(def.kind, this.diceMat);
      const offset = (i - (n - 1) / 2) * spread + rnd(-0.4, 0.4);
      const y = rnd(3, 6);
      const speed = rnd(20, 30);
      let px = 0;
      let pz = 0;
      let vx = 0;
      let vz = 0;
      if (side === 0) {
        px = Math.max(-x + 1.5, Math.min(x - 1.5, offset));
        pz = zMax - 1.6;
        vz = -speed;
        vx = rnd(-8, 8);
      } else if (side === 1) {
        px = Math.max(-x + 1.5, Math.min(x - 1.5, offset));
        pz = zMin + 1.6;
        vz = speed * 0.8;
        vx = rnd(-8, 8);
      } else {
        const dir = side === 2 ? 1 : -1;
        px = -dir * (x - 1.6);
        pz = Math.max(zMin + 1.5, Math.min(zMax - 1.5, offset * 0.6));
        vx = dir * speed;
        vz = rnd(-6, 6);
      }
      body.position.set(px, y, pz);
      body.velocity.set(vx, rnd(-2, 4), vz);
      body.angularVelocity.set(rnd(-25, 25), rnd(-25, 25), rnd(-25, 25));
      body.quaternion.setFromEuler(rnd(0, 6.283), rnd(0, 6.283), rnd(0, 6.283));
      body.addEventListener('collide', (e: { contact: CANNON.ContactEquation }) => this.click(e.contact.getImpactVelocityAlongNormal()));
      this.world.addBody(body);
      this.scene.add(mesh);
      this.dice.push({ def, mesh, body, still: 0, nudges: 0 });
    });

    this.elapsed = 0;
    this.acc = 0;
    this.rolling = true;
    return new Promise((res) => (this.resolveRoll = res));
  }

  /** Fade dice that don't count (e.g. the lower d20 under advantage). */
  dim(indices: number[]) {
    this.dice.forEach((d, i) => {
      const mats = d.mesh.material as THREE.MeshPhysicalMaterial[];
      for (const m of mats) m.opacity = indices.includes(i) ? 0.4 : 1;
    });
  }

  private read(d: ActiveDie) {
    const q = d.body.quaternion;
    const toWorld = (v: V3): V3 => {
      const r = q.vmult(new CANNON.Vec3(...v));
      return [r.x, r.y, r.z];
    };
    return readDie(dieShape(d.def.kind), toWorld);
  }

  private step(dt: number) {
    this.acc += Math.min(dt, 0.25);
    const fixed = 1 / 120;
    while (this.acc >= fixed) {
      this.world.step(fixed);
      this.acc -= fixed;
      this.elapsed += fixed;
    }
    if (!this.rolling) return;

    let allStill = true;
    for (const d of this.dice) {
      const v = d.body.velocity.length();
      const w = d.body.angularVelocity.length();
      const p = d.body.position;
      // Rescue anything that escaped the tray.
      if (p.y < -3 || Math.abs(p.x) > this.bounds.x + 2 || p.z < this.bounds.zMin - 2 || p.z > this.bounds.zMax + 2) {
        d.body.position.set(0, 5, 0);
        d.body.velocity.set(rnd(-6, 6), 0, rnd(-6, 6));
      }
      if (v < 0.08 && w < 0.12) d.still++;
      else d.still = 0;
      if (d.still < 18) {
        allStill = false;
        continue;
      }
      // Leaning on a wall or another die: give it a little tap.
      const { confidence } = this.read(d);
      if (confidence < 0.97 && d.nudges < 4) {
        d.nudges++;
        d.still = 0;
        d.body.velocity.set(rnd(-2, 2), 6, rnd(-2, 2));
        d.body.angularVelocity.set(rnd(-8, 8), rnd(-8, 8), rnd(-8, 8));
        allStill = false;
      }
    }
    if ((allStill && this.elapsed > 0.5) || this.elapsed > 9) {
      this.rolling = false;
      this.focusOnDice();
      const readings = this.dice.map((d) => this.read(d).value);
      this.resolveRoll?.(readings);
      this.resolveRoll = null;
    }
  }

  /** Pixels at the bottom of the screen covered by the result card. */
  safeBottom = 340;

  /** Glide the camera so every settled die is in view and clear of the result card. */
  private focusOnDice() {
    if (!this.dice.length) return;
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    // Card rectangle in NDC: centred, up to 560px wide, `safeBottom` px tall.
    const cardHalfW = (Math.min(560, w - 32) / 2 + 24) / (w / 2);
    const cardTop = -1 + (2 * this.safeBottom) / h;
    const pts: THREE.Vector3[] = [];
    for (const d of this.dice) {
      const r = dieShape(d.def.kind).radius * 0.9;
      const p = d.body.position;
      for (const [dx, dz] of [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]]) pts.push(new THREE.Vector3(p.x + dx, p.y, p.z + dz));
    }
    const c = pts.reduce((a, p) => a.add(p), new THREE.Vector3()).multiplyScalar(1 / pts.length);
    const cam = this.camera.clone();
    const fits = (look: THREE.Vector3, dist: number) => {
      cam.position.set(look.x, dist, look.z + dist * 0.32);
      cam.lookAt(look);
      cam.updateMatrixWorld();
      for (const p of pts) {
        const v = p.clone().project(cam);
        if (v.x < -0.92 || v.x > 0.92 || v.y < -0.97 || v.y > 0.84) return false;
        if (v.y < cardTop && Math.abs(v.x) < cardHalfW) return false;
      }
      return true;
    };
    const offsets: number[] = [];
    for (let i = -12; i <= 12; i++) offsets.push(i / 12);
    offsets.sort((a, b) => Math.abs(a) - Math.abs(b));
    for (let dist = this.camera.aspect < 1 ? 15 : 12; dist <= this.basePos.y * 1.7; dist += 0.5) {
      for (const o of offsets) {
        const look = new THREE.Vector3(c.x, 0, c.z + o * dist * 0.5);
        if (fits(look, dist)) {
          this.glideTo(new THREE.Vector3(look.x, dist, look.z + dist * 0.32), look, 0.8);
          return;
        }
      }
    }
  }

  private glideTo(to: THREE.Vector3, toLook: THREE.Vector3, duration: number) {
    this.tween = { from: this.camera.position.clone(), fromLook: this.look.clone(), to, toLook, elapsed: 0, duration };
  }

  private updateCamera(dt: number) {
    const tw = this.tween;
    if (!tw) return;
    tw.elapsed += dt;
    const k = Math.min(1, tw.elapsed / tw.duration);
    const e = 1 - Math.pow(1 - k, 3);
    this.camera.position.lerpVectors(tw.from, tw.to, e);
    this.look.lerpVectors(tw.fromLook, tw.toLook, e);
    this.camera.lookAt(this.look);
    if (k >= 1) this.tween = null;
  }

  private loop(t: number) {
    if (this.disposed) return;
    const dt = this.last ? (t - this.last) / 1000 : 0;
    this.last = t;
    this.step(dt);
    this.updateCamera(Math.min(dt, 0.05));
    for (const d of this.dice) {
      d.mesh.position.set(d.body.position.x, d.body.position.y, d.body.position.z);
      d.mesh.quaternion.set(d.body.quaternion.x, d.body.quaternion.y, d.body.quaternion.z, d.body.quaternion.w);
    }
    this.renderer.render(this.scene, this.camera);
    this.raf = requestAnimationFrame(this.loop);
  }

  private ensureAudio() {
    if (!this.opts.sound || this.audio) return;
    try {
      this.audio = new AudioContext();
    } catch {
      this.audio = null;
    }
  }

  /** A short wooden "tok" scaled by impact speed. */
  private click(impact: number) {
    const ctx = this.audio;
    if (!ctx || !this.opts.sound) return;
    const s = Math.abs(impact);
    const now = ctx.currentTime;
    if (s < 1.5 || now - this.lastClick < 0.03) return;
    this.lastClick = now;
    const vol = Math.min(0.35, s / 60);
    const len = 0.06;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * len), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 6);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1400 + Math.random() * 1600;
    bp.Q.value = 3;
    const g = ctx.createGain();
    g.gain.value = vol;
    src.connect(bp).connect(g).connect(ctx.destination);
    src.start(now);
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.clear();
    this.renderer.dispose();
    this.audio?.close().catch(() => {});
  }
}

export function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}
