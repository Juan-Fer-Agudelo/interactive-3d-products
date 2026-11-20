// Where every object of the meadow stands. Deterministic, so the scene, the
// physics and the interface all agree without talking to each other.
import { profile } from '../data/profile';
import { PLACES, WORK_C, WALK_R, POND, heightAt, pathDist, mulberry32, PATH_SEGMENTS } from './terrain';

const place = (id) => PLACES.find((p) => p.id === id);
const facing = (fromX, fromZ, toX, toZ) => Math.atan2(toX - fromX, toZ - fromZ);

// --- Project boards, on an arc that opens towards the camp ---------------
export const projects = profile.projects.slice(0, 7);
const ARC_R = 8.4;
export const boards = projects.map((project, i) => {
  const a = ((160 + (i * 220) / (projects.length - 1)) * Math.PI) / 180;
  const x = WORK_C.x + Math.cos(a) * ARC_R;
  const z = WORK_C.z + Math.sin(a) * ARC_R;
  return { i, project, x, z, y: heightAt(x, z), rot: facing(x, z, WORK_C.x, WORK_C.z) };
});

const about = place('about');
const skills = place('skills');
export const aboutBoard = { x: about.x, z: about.z, y: heightAt(about.x, about.z), rot: facing(about.x, about.z, 0, 0) };
export const skillsLine = { x: skills.x, z: skills.z, y: heightAt(skills.x, skills.z), rot: facing(skills.x, skills.z, 0, 0) };
export const pond = { x: POND.x, z: POND.z, y: POND.h - 0.28, r: 4.2 };
export const mailbox = { x: POND.x - 4.6, z: POND.z - 2.4, rot: facing(POND.x - 4.6, POND.z - 2.4, 0, 0) };
mailbox.y = heightAt(mailbox.x, mailbox.z);

export const camp = {
  fire: { x: 0, z: 0, y: heightAt(0, 0) },
  tent: { x: 5.2, z: -3.4, y: heightAt(5.2, -3.4), rot: -0.55 },
  stall: { x: 4.6, z: 3.8, y: heightAt(4.6, 3.8), rot: -2.2 },
  log: { x: -2.4, z: -1.2, y: heightAt(-2.4, -1.2), rot: 1.1 },
};

// --- Things you can walk up to and open ----------------------------------
export const interactables = [
  ...boards.map((b) => ({ id: 'project:' + b.i, x: b.x, z: b.z, r: 4.4, label: 'ver ' + b.project.name.toLowerCase() })),
  { id: 'about', x: aboutBoard.x, z: aboutBoard.z, r: 4.6, label: 'leer sobre mí' },
  { id: 'skills', x: skillsLine.x, z: skillsLine.z, r: 4.6, label: 'ver habilidades' },
  { id: 'contact', x: mailbox.x, z: mailbox.z, r: 4.2, label: 'escribirme' },
  { id: 'fire', x: 0, z: 0, r: 2.9, label: 'descansar junto al fuego' },
];

// --- Trees ----------------------------------------------------------------
export const PALETTES = [
  { name: 'rosa', leaf: ['#f39a94', '#e9737f', '#f7b6a6'], trunk: '#e9e4d6', birch: true },
  { name: 'amarillo', leaf: ['#f5dc4a', '#efc93a', '#f8ea86'], trunk: '#5a3b26' },
  { name: 'verde', leaf: ['#86c440', '#5fa637', '#a9d857'], trunk: '#4a3322' },
  { name: 'oliva', leaf: ['#b9bd3f', '#93a034', '#d3d35c'], trunk: '#553a24' },
];

function makeTree(rand, x, z, palette, scale = 1) {
  const h = (3.6 + rand() * 2.6) * scale;
  const clusters = [];
  const n = 3 + Math.floor(rand() * 3);
  for (let c = 0; c < n; c++) {
    const a = rand() * Math.PI * 2;
    const spread = c === 0 ? 0 : (0.9 + rand() * 1.3) * scale;
    clusters.push({
      x: Math.cos(a) * spread,
      y: h + (c === 0 ? 0.9 : (rand() - 0.35) * 2.2) * scale,
      z: Math.sin(a) * spread,
      r: (1.25 + rand() * 0.85) * scale,
    });
  }
  return { x, z, y: heightAt(x, z) - 0.15, h, r: (0.17 + rand() * 0.1) * scale, rot: rand() * Math.PI * 2, palette, clusters };
}

function scatter(rand, count, minGap, clearance, taken) {
  const out = [];
  let guard = 0;
  while (out.length < count && guard++ < 4000) {
    const a = rand() * Math.PI * 2;
    const r = Math.sqrt(rand()) * (WALK_R - 2);
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (pathDist(x, z) < clearance) continue;
    if (PLACES.some((p) => Math.hypot(x - p.x, z - p.z) < p.r + clearance)) continue;
    if ([...taken, ...out].some((o) => Math.hypot(x - o.x, z - o.z) < minGap)) continue;
    out.push({ x, z });
  }
  return out;
}

const rand = mulberry32(20261120);
export const trees = [
  // Two trees placed by hand so the first view of the camp is composed.
  makeTree(rand, -7.6, -2.2, 1, 1.25),
  makeTree(rand, 1.6, -8.4, 0, 1.05),
  ...scatter(rand, 44, 5.2, 3.2, [{ x: -7.6, z: -2.2 }, { x: 1.6, z: -8.4 }]).map((p) =>
    makeTree(rand, p.x, p.z, Math.floor(rand() * PALETTES.length), 0.85 + rand() * 0.45)),
];

export const rocks = scatter(rand, 22, 4, 2.4, trees).map((p) => ({
  ...p,
  y: heightAt(p.x, p.z),
  r: 0.55 + rand() * 1.1,
  squash: 0.55 + rand() * 0.3,
  rot: rand() * 6.28,
  seed: rand() * 100,
}));

// --- Lamps beside the trails ---------------------------------------------
export const lamps = [];
PATH_SEGMENTS.forEach(([ax, az, bx, bz], s) => {
  const len = Math.hypot(bx - ax, bz - az);
  const nx = -(bz - az) / len, nz = (bx - ax) / len;
  for (let d = 8.5, k = 0; d < len - 5; d += 9.5, k++) {
    const side = (k + s) % 2 ? 1 : -1;
    const x = ax + ((bx - ax) * d) / len + nx * 2.3 * side;
    const z = az + ((bz - az) * d) / len + nz * 2.3 * side;
    lamps.push({ x, z, y: heightAt(x, z), rot: Math.atan2(-nx * side, -nz * side) });
  }
});

// --- Stepping stones on the trails ---------------------------------------
export const stones = [];
PATH_SEGMENTS.forEach(([ax, az, bx, bz]) => {
  const len = Math.hypot(bx - ax, bz - az);
  for (let d = 5.6; d < len - 3.5; d += 1.5 + rand() * 0.5) {
    const x = ax + ((bx - ax) * d) / len + (rand() - 0.5) * 0.9;
    const z = az + ((bz - az) * d) / len + (rand() - 0.5) * 0.9;
    stones.push({ x, z, y: heightAt(x, z), r: 0.42 + rand() * 0.3, rot: rand() * 6.28 });
  }
});

// --- Solid things, for the physics ---------------------------------------
export const obstacles = [
  ...trees.map((t) => ({ type: 'cyl', x: t.x, y: t.y, z: t.z, r: t.r + 0.16, h: 4 })),
  ...rocks.map((r) => ({ type: 'ball', x: r.x, y: r.y + r.r * r.squash * 0.2, z: r.z, r: r.r * 0.92 })),
  ...lamps.map((l) => ({ type: 'cyl', x: l.x, y: l.y, z: l.z, r: 0.2, h: 3 })),
  ...boards.map((b) => ({ type: 'box', x: b.x, y: b.y, z: b.z, hx: 1.75, hy: 1.6, hz: 0.22, rot: b.rot })),
  { type: 'box', x: aboutBoard.x, y: aboutBoard.y, z: aboutBoard.z, hx: 2.3, hy: 1.8, hz: 0.3, rot: aboutBoard.rot },
  { type: 'cyl', x: skillsLine.x + Math.cos(skillsLine.rot) * 3.2, y: skillsLine.y, z: skillsLine.z - Math.sin(skillsLine.rot) * 3.2, r: 0.22, h: 3 },
  { type: 'cyl', x: skillsLine.x - Math.cos(skillsLine.rot) * 3.2, y: skillsLine.y, z: skillsLine.z + Math.sin(skillsLine.rot) * 3.2, r: 0.22, h: 3 },
  { type: 'cyl', x: mailbox.x, y: mailbox.y, z: mailbox.z, r: 0.3, h: 2 },
  { type: 'cyl', x: 0, y: camp.fire.y, z: 0, r: 0.95, h: 1 },
  { type: 'box', x: camp.tent.x, y: camp.tent.y, z: camp.tent.z, hx: 2.5, hy: 1.4, hz: 1.7, rot: camp.tent.rot },
  { type: 'box', x: camp.stall.x, y: camp.stall.y, z: camp.stall.z, hx: 1.3, hy: 1.2, hz: 0.8, rot: camp.stall.rot },
  { type: 'box', x: camp.log.x, y: camp.log.y, z: camp.log.z, hx: 1.1, hy: 0.3, hz: 0.32, rot: camp.log.rot },
];
