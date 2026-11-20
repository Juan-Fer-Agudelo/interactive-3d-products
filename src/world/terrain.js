// Shape of the meadow: one height function shared by the mesh, the grass,
// the physics and everything that has to stand on the ground.
export const WORLD_R = 64;
export const WALK_R = WORLD_R - 7;

export const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(x, z) {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
export function vnoise(x, z) {
  const xi = Math.floor(x), zi = Math.floor(z);
  const xf = x - xi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
  const a = hash(xi, zi), b = hash(xi + 1, zi), c = hash(xi, zi + 1), d = hash(xi + 1, zi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function base(x, z) {
  return Math.sin(x * 0.075 + 1.3) * 1.5 + Math.cos(z * 0.066 - 0.4) * 1.3
    + Math.sin((x + z) * 0.12) * 0.6 + (vnoise(x * 0.09, z * 0.09) - 0.5) * 2.2;
}

// Where things are. Each place flattens the ground around it.
export const WORK_C = { x: 13, z: -24 };
export const PLACES = [
  { id: 'camp', label: 'campamento', note: 'la fogata, donde empieza todo', x: 0, z: 0, r: 8, stand: [-1.6, 3.6] },
  { id: 'work', label: 'trabajo seleccionado', note: 'siete proyectos en un claro', x: WORK_C.x, z: WORK_C.z, r: 11, stand: [WORK_C.x - 1, WORK_C.z + 3] },
  { id: 'about', label: 'sobre mí', note: 'el tablero de madera', x: -17, z: -9, r: 4.5, stand: [-14.2, -7.4] },
  { id: 'skills', label: 'habilidades', note: 'papeles colgados al viento', x: -19, z: 15, r: 4.5, stand: [-16.4, 12.8] },
  { id: 'contact', label: 'contacto', note: 'el estanque', x: 19, z: 14, r: 6.5, stand: [14.6, 10.6] },
].map((p) => ({ ...p, h: base(p.x, p.z) }));

export const POND = PLACES.find((p) => p.id === 'contact');

export function heightAt(x, z) {
  let h = base(x, z);
  for (const p of PLACES) {
    const d = Math.hypot(x - p.x, z - p.z);
    h += (p.h - h) * smooth(p.r + 7, p.r, d);
  }
  h -= smooth(4.8, 2.4, Math.hypot(x - POND.x, z - POND.z)) * 0.95;
  const edge = smooth(WORLD_R * 0.74, WORLD_R, Math.hypot(x, z));
  return h - edge * edge * 15;
}

// Trails from the camp to every place.
export const PATH_SEGMENTS = PLACES.filter((p) => p.id !== 'camp').map((p) => [0, 0, p.x, p.z]);
function segDist(px, pz, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az;
  const t = Math.min(1, Math.max(0, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz)));
  return Math.hypot(px - (ax + dx * t), pz - (az + dz * t));
}
export function pathDist(x, z) {
  let d = Infinity;
  for (const s of PATH_SEGMENTS) d = Math.min(d, segDist(x, z, s[0], s[1], s[2], s[3]));
  return d;
}

// 0 where grass grows freely, 1 where the ground is kept bare.
export function bareAt(x, z) {
  let bare = 1 - smooth(0.7, 2.3, pathDist(x, z) + (vnoise(x * 0.5, z * 0.5) - 0.5) * 1.2);
  bare = Math.max(bare, 1 - smooth(4.2, 6.4, Math.hypot(x, z)));
  bare = Math.max(bare, 1 - smooth(4.6, 5.6, Math.hypot(x - POND.x, z - POND.z)));
  bare = Math.max(bare, (1 - smooth(5.5, 8.5, Math.hypot(x - WORK_C.x, z - WORK_C.z))) * 0.85);
  return bare;
}
