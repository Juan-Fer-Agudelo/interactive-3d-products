import * as THREE from 'three';
import { profile } from '../data/profile';
import { FONT, canvasTexture, makeMaterial, wrapText } from './shared';
import { WORLD_R, heightAt, bareAt, vnoise, mulberry32 } from './terrain';
import { aboutBoard, boards, camp, lamps, mailbox, pond, rocks, skillsLine, stones } from './layout';

const lambert = (color, extra = {}) => new THREE.MeshLambertMaterial({ color, ...extra });
const WOOD = lambert('#6b4428');
const WOOD_DARK = lambert('#4c301d');
const ROPE = lambert('#d9c9a3');

function part(parent, geometry, material, pos, rot, shadow = true) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(pos[0], pos[1], pos[2]);
  if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
  mesh.castShadow = shadow;
  parent.add(mesh);
  return mesh;
}
const box = (parent, size, material, pos, rot) => part(parent, new THREE.BoxGeometry(size[0], size[1], size[2]), material, pos, rot);
const rod = (parent, r, h, material, pos, rot) => part(parent, new THREE.CylinderGeometry(r, r, h, 7), material, pos, rot);

function placed(x, y, z, rot = 0) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = rot;
  return g;
}

// --------------------------------------------------------------- ground ---
export function buildGround() {
  const RINGS = 72, SEGS = 132;
  const positions = [0, heightAt(0, 0), 0];
  for (let i = 1; i <= RINGS; i++) {
    const r = WORLD_R * Math.pow(i / RINGS, 0.92);
    for (let j = 0; j < SEGS; j++) {
      const a = (j / SEGS) * Math.PI * 2;
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      positions.push(x, heightAt(x, z), z);
    }
  }
  const index = [];
  for (let j = 0; j < SEGS; j++) index.push(0, 1 + ((j + 1) % SEGS), 1 + j);
  for (let i = 1; i < RINGS; i++) {
    const a = 1 + (i - 1) * SEGS, b = 1 + i * SEGS;
    for (let j = 0; j < SEGS; j++) {
      const k = (j + 1) % SEGS;
      index.push(a + j, a + k, b + j, a + k, b + k, b + j);
    }
  }
  const earth = new THREE.Color('#63513a'), trail = new THREE.Color('#8a744f'), moss = new THREE.Color('#4f6b33');
  const colors = [];
  const c = new THREE.Color();
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i], z = positions[i + 2];
    const n = vnoise(x * 0.35, z * 0.35);
    c.copy(earth).lerp(moss, (1 - bareAt(x, z)) * 0.35 * n).lerp(trail, bareAt(x, z) * 0.75);
    c.multiplyScalar(0.9 + n * 0.2);
    colors.push(c.r, c.g, c.b);
  }
  const geo = new THREE.BufferGeometry();
  const vertices = new Float32Array(positions);
  geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(index);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, lambert('#ffffff', { vertexColors: true }));
  mesh.receiveShadow = true;
  return { mesh, vertices, indices: new Uint32Array(index) };
}

export function buildStonesAndRocks() {
  const group = new THREE.Group();
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  const slab = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1.08, 0.16, 9), lambert('#b3b0a3'), stones.length);
  stones.forEach((s, i) => {
    q.setFromEuler(e.set(0, s.rot, 0));
    slab.setMatrixAt(i, m.compose(new THREE.Vector3(s.x, s.y + 0.03, s.z), q, new THREE.Vector3(s.r, 1, s.r * 0.82)));
  });
  slab.receiveShadow = true;
  group.add(slab);

  const grey = new THREE.Color('#8f9088'), green = new THREE.Color('#6f8a45');
  rocks.forEach((r) => {
    const geo = new THREE.IcosahedronGeometry(1, 1);
    const p = geo.attributes.position;
    const colors = [];
    const rand = mulberry32(Math.floor(r.seed * 1000));
    const jitter = new Map();
    for (let i = 0; i < p.count; i++) {
      const key = `${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`;
      if (!jitter.has(key)) jitter.set(key, 0.82 + rand() * 0.36);
      const k = jitter.get(key);
      p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * r.squash, p.getZ(i) * k);
      const c = grey.clone().lerp(green, Math.max(0, p.getY(i)) * 0.55).multiplyScalar(0.85 + rand() * 0.25);
      colors.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, lambert('#ffffff', { vertexColors: true, flatShading: true }));
    mesh.position.set(r.x, r.y + r.r * r.squash * 0.25, r.z);
    mesh.rotation.y = r.rot;
    mesh.scale.setScalar(r.r);
    mesh.castShadow = mesh.receiveShadow = true;
    group.add(mesh);
  });
  return group;
}

// ---------------------------------------------------------------- lamps ---
export function buildLamps() {
  const group = new THREE.Group();
  const glass = new THREE.MeshBasicMaterial({ color: '#fff3c4' });
  const metal = lambert('#2f5d5a');
  const glows = [];
  lamps.forEach((l) => {
    const g = placed(l.x, l.y - 0.1, l.z, l.rot);
    rod(g, 0.09, 3.2, WOOD_DARK, [0, 1.6, 0], [0, 0, 0.04]);
    box(g, [0.14, 0.14, 1.05], WOOD_DARK, [0, 3.05, 0.42]);
    box(g, [0.1, 0.1, 0.8], WOOD_DARK, [0, 2.72, 0.24], [-0.8, 0, 0]);
    rod(g, 0.012, 0.36, metal, [0, 2.82, 0.82], null);
    box(g, [0.3, 0.05, 0.3], metal, [0, 2.64, 0.82]);
    box(g, [0.26, 0.05, 0.26], metal, [0, 2.24, 0.82]);
    part(g, new THREE.ConeGeometry(0.2, 0.14, 4), metal, [0, 2.73, 0.82], [0, Math.PI / 4, 0]);
    const core = part(g, new THREE.BoxGeometry(0.2, 0.34, 0.2), glass, [0, 2.44, 0.82], null, false);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: '#ffd98a', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    halo.position.set(0, 2.44, 0.82);
    halo.scale.setScalar(2.6);
    g.add(halo);
    glows.push({ core, halo });
    group.add(g);
  });
  return {
    group,
    update(night) {
      glows.forEach(({ core, halo }) => {
        core.material.color.setRGB(0.55 + night * 0.45, 0.6 + night * 0.35, 0.55 + night * 0.2);
        halo.material.opacity = night * 0.75;
      });
    },
  };
}

let glow;
export function glowTexture() {
  if (glow) return glow;
  glow = canvasTexture(128, 128, (ctx) => {
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.35)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  });
  return glow;
}

// ----------------------------------------------------------------- camp ---
export function buildCamp() {
  const group = new THREE.Group();
  const canvas = lambert('#b8612c', { side: THREE.DoubleSide });
  const canvasDark = lambert('#96491f', { side: THREE.DoubleSide });

  // Ridge tent: a prism, open at the front.
  const tent = placed(camp.tent.x, camp.tent.y - 0.05, camp.tent.z, camp.tent.rot);
  const W = 2.5, H = 2.2, D = 1.7;
  const prism = new THREE.BufferGeometry();
  prism.setAttribute('position', new THREE.Float32BufferAttribute([
    -W, 0, -D, W, 0, -D, W, H, 0, -W, 0, -D, W, H, 0, -W, H, 0, // back slope
    -W, 0, D, W, H, 0, W, 0, D, -W, 0, D, -W, H, 0, W, H, 0, // front slope
  ], 3));
  prism.computeVertexNormals();
  part(tent, prism, canvas, [0, 0, 0]);
  const gable = new THREE.BufferGeometry();
  gable.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, -D, 0, 0, D, 0, H, 0], 3));
  gable.computeVertexNormals();
  part(tent, gable, canvasDark, [-W, 0, 0]);
  const flap = new THREE.BufferGeometry();
  flap.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, -D, 0, 0, -0.35, 0, H, 0], 3));
  flap.computeVertexNormals();
  part(tent, flap, canvasDark, [W, 0, 0]);
  rod(tent, 0.05, H + 0.5, WOOD_DARK, [W, (H + 0.5) / 2, 0]);
  rod(tent, 0.05, H + 0.5, WOOD_DARK, [-W, (H + 0.5) / 2, 0]);
  [[W + 1.5, 1.2], [W + 1.5, -1.2], [-W - 1.5, 1.2], [-W - 1.5, -1.2]].forEach(([x, z]) => {
    const from = new THREE.Vector3(Math.sign(x) * W, H, 0), to = new THREE.Vector3(x, 0, z);
    const rope = rod(tent, 0.012, from.distanceTo(to), ROPE, [0, 0, 0]);
    rope.position.lerpVectors(from, to, 0.5);
    rope.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize());
    rod(tent, 0.035, 0.3, WOOD_DARK, [x, 0.1, z], [0.3, 0, 0]);
  });
  part(tent, new THREE.ConeGeometry(0.16, 0.34, 3), lambert('#e0a43a'), [W, H + 0.65, 0], [0, 0, -1.3]);
  group.add(tent);

  // Fire: stone ring, logs, tripod with a pot, flames and their light.
  const fire = placed(camp.fire.x, camp.fire.y, camp.fire.z);
  const stone = lambert('#7c7d78', { flatShading: true });
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    part(fire, new THREE.DodecahedronGeometry(0.2 + (i % 3) * 0.03, 0), stone, [Math.cos(a) * 0.82, 0.08, Math.sin(a) * 0.82], [a, a * 2, 0]);
  }
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.3;
    rod(fire, 0.07, 0.85, WOOD_DARK, [Math.cos(a) * 0.22, 0.26, Math.sin(a) * 0.22], [Math.sin(a) * 0.75, 0, -Math.cos(a) * 0.75]);
  }
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.5;
    rod(fire, 0.035, 2.5, lambert('#9a5a2c'), [Math.cos(a) * 0.5, 1.12, Math.sin(a) * 0.5], [Math.sin(a) * 0.42, 0, -Math.cos(a) * 0.42]);
  }
  rod(fire, 0.012, 0.7, lambert('#2b2b2b'), [0, 1.85, 0]);
  const pot = part(fire, new THREE.SphereGeometry(0.26, 12, 9, 0, Math.PI * 2, Math.PI * 0.22, Math.PI), lambert('#23252a', { side: THREE.DoubleSide }), [0, 1.32, 0]);
  part(pot, new THREE.CircleGeometry(0.2, 12), lambert('#c9772e'), [0, 0.13, 0], [-Math.PI / 2, 0, 0], false);
  const flames = [];
  [['#ff8a1f', 0.42, 0.95], ['#ffc23d', 0.3, 0.75], ['#fff1a8', 0.17, 0.5]].forEach(([color, r, h], i) => {
    const flame = part(fire, new THREE.ConeGeometry(r, h, 7), new THREE.MeshBasicMaterial({ color, fog: false }), [0, 0.2 + h / 2, 0], null, false);
    flame.userData = { h, i };
    flames.push(flame);
  });
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: '#ffb35c', transparent: true, opacity: 0.45, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.position.set(0, 0.6, 0);
  halo.scale.setScalar(4);
  fire.add(halo);
  const light = new THREE.PointLight('#ff9a45', 6, 16, 1.6);
  light.position.set(0, 1, 0);
  fire.add(light);
  group.add(fire);

  // Log to sit on.
  const log = placed(camp.log.x, camp.log.y, camp.log.z, camp.log.rot);
  rod(log, 0.3, 2.2, WOOD, [0, 0.26, 0], [0, 0, Math.PI / 2]);
  group.add(log);

  // Market stall with sacks.
  const stall = placed(camp.stall.x, camp.stall.y, camp.stall.z, camp.stall.rot);
  [[-1.2, -0.7], [1.2, -0.7], [-1.2, 0.7], [1.2, 0.7]].forEach(([x, z]) => rod(stall, 0.06, 2.2, WOOD_DARK, [x, 1.1, z]));
  box(stall, [2.9, 0.08, 1.9], lambert('#b8612c'), [0, 2.25, 0], [0.12, 0, 0]);
  box(stall, [2.6, 0.08, 1.5], WOOD, [0, 0.75, 0]);
  [['#d8c08a', -0.8, 0.34], ['#c9a66b', -0.1, 0.4], ['#e2cf9d', 0.6, 0.3], ['#b5553c', 0.95, 0.22]].forEach(([color, x, r]) => {
    const sack = part(stall, new THREE.SphereGeometry(r, 10, 8), lambert(color), [x, 0.79 + r * 0.8, 0.1 * x]);
    sack.scale.y = 1.1;
  });
  group.add(stall);

  return {
    group,
    update(t, night) {
      flames.forEach((f) => {
        const k = 1 + Math.sin(t * (9 + f.userData.i * 3) + f.userData.i) * 0.13 + Math.sin(t * 23 + f.userData.i * 2) * 0.06;
        f.scale.set(1 + (k - 1) * 0.5, k, 1 + (k - 1) * 0.5);
        f.position.y = 0.2 + (f.userData.h * k) / 2;
        f.rotation.y = t * (1 + f.userData.i);
      });
      const flick = 1 + Math.sin(t * 11) * 0.12 + Math.sin(t * 27) * 0.07;
      light.intensity = (5 + night * 26) * flick;
      halo.material.opacity = (0.3 + night * 0.5) * flick;
    },
  };
}

// --------------------------------------------------------------- places ---
function boardTexture(project, index) {
  return canvasTexture(768, 512, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, project.color);
    g.addColorStop(1, '#2b2233');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(w * (0.72 + i * 0.07), h * (0.2 + i * 0.13), 120 - i * 16, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = `800 34px ${FONT}`;
    ctx.fillText(String(index + 1).padStart(2, '0'), 48, 44);
    ctx.fillStyle = '#ffffff';
    ctx.font = `900 ${project.name.length > 16 ? 60 : 78}px ${FONT}`;
    const y = wrapText(ctx, project.name.toLowerCase(), 48, 104, w - 96, 78, 2);
    ctx.font = `700 34px ${FONT}`;
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillText(project.tag.toLowerCase(), 48, y + 6);
    ctx.font = `700 28px ${FONT}`;
    let x = 48;
    project.stack.slice(0, 4).forEach((s) => {
      const tw = ctx.measureText(s.toLowerCase()).width + 36;
      if (x + tw > w - 40) return;
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.beginPath();
      ctx.roundRect(x, h - 96, tw, 50, 25);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillText(s.toLowerCase(), x + 18, h - 86);
      x += tw + 12;
    });
  });
}

function sign(parent, text, pos, width = 1.7) {
  const tex = canvasTexture(512, 128, (ctx, w, h) => {
    ctx.fillStyle = '#f3ead8';
    ctx.beginPath();
    ctx.roundRect(4, 4, w - 8, h - 8, 26);
    ctx.fill();
    ctx.fillStyle = '#3b3226';
    ctx.font = `900 58px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, h / 2 + 4);
  });
  return part(parent, new THREE.PlaneGeometry(width, width / 4), new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide }), pos, null, false);
}

export function buildPlaces() {
  const group = new THREE.Group();

  // Project boards.
  boards.forEach((b) => {
    const g = placed(b.x, b.y - 0.1, b.z, b.rot);
    rod(g, 0.08, 3.3, WOOD_DARK, [-1.6, 1.65, 0]);
    rod(g, 0.08, 3.3, WOOD_DARK, [1.6, 1.65, 0]);
    box(g, [3.5, 2.4, 0.14], WOOD, [0, 2.05, 0]);
    box(g, [3.8, 0.12, 0.5], WOOD_DARK, [0, 3.32, 0.05], [0.18, 0, 0]);
    part(g, new THREE.PlaneGeometry(3.2, 2.13), new THREE.MeshBasicMaterial({ map: boardTexture(b.project, b.i) }), [0, 2.05, 0.08], null, false);
    group.add(g);
  });

  // About board.
  const about = placed(aboutBoard.x, aboutBoard.y - 0.1, aboutBoard.z, aboutBoard.rot);
  rod(about, 0.1, 3.9, WOOD_DARK, [-2.15, 1.95, 0]);
  rod(about, 0.1, 3.9, WOOD_DARK, [2.15, 1.95, 0]);
  box(about, [4.6, 2.8, 0.16], WOOD, [0, 2.3, 0]);
  box(about, [5.1, 0.14, 0.9], lambert('#b8612c'), [0, 3.98, 0.1], [0.22, 0, 0]);
  const aboutTex = canvasTexture(1024, 620, (ctx, w, h) => {
    ctx.fillStyle = '#f6efdf';
    ctx.fillRect(0, 0, w, h);
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#b8612c';
    ctx.font = `800 34px ${FONT}`;
    ctx.fillText('sobre mí', 56, 44);
    ctx.fillStyle = '#3b3226';
    ctx.font = `900 76px ${FONT}`;
    ctx.fillText('hola, soy juan fer', 56, 92);
    ctx.font = `600 36px ${FONT}`;
    ctx.fillStyle = '#5a4d3c';
    wrapText(ctx, 'desarrollador full-stack en medellín. convierto procesos manuales en software que la gente usa todos los días: de 14 horas a minutos, de 5 horas a 3 minutos.', 56, 206, w - 112, 50, 5);
    ctx.fillStyle = '#7a9c3c';
    ctx.font = `800 32px ${FONT}`;
    ctx.fillText('acércate y pulsa E para leer todo', 56, h - 84);
  });
  part(about, new THREE.PlaneGeometry(4.3, 2.6), new THREE.MeshBasicMaterial({ map: aboutTex }), [0, 2.3, 0.09], null, false);
  group.add(about);

  // Skills: paper cards on a line, moving in the wind.
  const line = placed(skillsLine.x, skillsLine.y - 0.1, skillsLine.z, skillsLine.rot);
  rod(line, 0.09, 3.2, WOOD_DARK, [-3.2, 1.6, 0]);
  rod(line, 0.09, 3.2, WOOD_DARK, [3.2, 1.6, 0]);
  const sag = (x) => 2.95 - 0.38 * (1 - (x / 3.2) ** 2);
  const pts = [];
  for (let i = 0; i <= 16; i++) { const x = -3.2 + (i / 16) * 6.4; pts.push(new THREE.Vector3(x, sag(x), 0)); }
  part(line, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.014, 4), ROPE, [0, 0, 0]);
  const cards = [];
  const tints = ['#fdf6e3', '#f8e3c0', '#e6f0cf', '#f9dcd6', '#dbeaf5'];
  profile.skills.forEach((s, i) => {
    const x = -2.5 + i * 1.25;
    const tex = canvasTexture(320, 420, (ctx, w, h) => {
      ctx.fillStyle = tints[i % tints.length];
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#3b3226';
      ctx.textBaseline = 'top';
      ctx.font = `900 38px ${FONT}`;
      let y = wrapText(ctx, s.group.toLowerCase(), 26, 30, w - 52, 42, 2) + 10;
      ctx.font = `600 27px ${FONT}`;
      ctx.fillStyle = '#5a4d3c';
      s.items.slice(0, 7).forEach((item) => { if (y < h - 40) { ctx.fillText('· ' + item.toLowerCase().slice(0, 18), 26, y); y += 37; } });
    });
    const pivot = new THREE.Group();
    pivot.position.set(x, sag(x), 0);
    part(pivot, new THREE.PlaneGeometry(1.02, 1.34), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }), [0, -0.7, 0], null, false);
    box(pivot, [0.07, 0.14, 0.05], WOOD, [0, -0.04, 0]);
    line.add(pivot);
    cards.push(pivot);
  });
  sign(line, 'habilidades', [0, 3.45, 0]);
  group.add(line);

  // Contact: the pond and its mailbox.
  const water = part(group, new THREE.CircleGeometry(pond.r, 40), makeMaterial({
    transparent: true,
    vertex: /* glsl */ `
      varying vec2 vUv; varying float vDist;
      void main() { vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0); vDist = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragment: /* glsl */ `
      varying vec2 vUv; varying float vDist;
      void main() {
        vec2 p = vUv - 0.5;
        float r = length(p) * 2.0;
        float ring = sin(r * 26.0 - uTime * 1.6) * 0.5 + 0.5;
        float n = noise3(vec3(p * 9.0, uTime * 0.35));
        vec3 col = mix(vec3(0.20, 0.52, 0.66), vec3(0.55, 0.82, 0.90), n * 0.6 + ring * 0.12 * (1.0 - r));
        col = mix(col, vec3(0.93, 0.98, 1.0), smoothstep(0.86, 0.99, r) * 0.7 + step(0.985, n + ring * 0.05) * 0.5);
        col += uRain * step(0.82, noise3(vec3(p * 46.0, floor(uTime * 9.0)))) * 0.18;
        gl_FragColor = vec4(withFog(grade(col), vDist), 0.9);
        #include <colorspace_fragment>
      }`,
  }), [pond.x, pond.y, pond.z], [-Math.PI / 2, 0, 0], false);
  water.renderOrder = 1;
  const pad = lambert('#5f9a3f', { side: THREE.DoubleSide });
  const pads = [];
  [[1.2, 0.8, 0.55], [-1.6, 1.3, 0.42], [0.4, -1.9, 0.5], [-0.8, -0.6, 0.34], [2.3, -1.1, 0.38]].forEach(([x, z, r], i) => {
    const p = part(group, new THREE.CircleGeometry(r, 12, 0.35, Math.PI * 2 - 0.7), pad, [pond.x + x, pond.y + 0.03, pond.z + z], [-Math.PI / 2, 0, i * 1.3], false);
    if (i % 2 === 0) part(p, new THREE.SphereGeometry(0.11, 8, 6), lambert('#f6c9d6'), [0.1, 0.05, 0.06], null, false);
    pads.push(p);
  });
  for (let i = 0; i < 9; i++) {
    const a = 2.2 + i * 0.26, rr = pond.r + 0.1 + (i % 3) * 0.2;
    const x = pond.x + Math.cos(a) * rr, z = pond.z + Math.sin(a) * rr;
    rod(group, 0.022, 1.5 + (i % 4) * 0.25, lambert('#6c8a3a'), [x, heightAt(x, z) + 0.7, z], [0.06 * (i % 3), 0, 0.05]);
    if (i % 2) rod(group, 0.05, 0.3, lambert('#6b4428'), [x, heightAt(x, z) + 1.5 + (i % 4) * 0.12, z]);
  }
  const post = placed(mailbox.x, mailbox.y - 0.05, mailbox.z, mailbox.rot);
  rod(post, 0.07, 1.4, WOOD_DARK, [0, 0.7, 0]);
  box(post, [0.5, 0.36, 0.72], lambert('#d9553f'), [0, 1.5, 0]);
  part(post, new THREE.CylinderGeometry(0.25, 0.25, 0.72, 10, 1, false, 0, Math.PI), lambert('#d9553f'), [0, 1.68, 0], [Math.PI / 2, Math.PI / 2, 0]);
  box(post, [0.04, 0.3, 0.16], lambert('#f5dc4a'), [0.28, 1.72, 0.2]);
  sign(post, 'contacto', [0, 2.35, 0], 1.5);
  group.add(post);

  // Signpost where the trail enters the clearing of project boards.
  const gateX = boards[0].x + 1.2, gateZ = boards[0].z + 3.4;
  const gate = placed(gateX, heightAt(gateX, gateZ) - 0.05, gateZ, Math.atan2(-gateX, -gateZ));
  rod(gate, 0.07, 2.4, WOOD_DARK, [0, 1.2, 0]);
  sign(gate, 'trabajo seleccionado', [0, 2.55, 0], 2.9);
  group.add(gate);

  return {
    group,
    update(t) {
      cards.forEach((c, i) => {
        c.rotation.x = Math.sin(t * 1.6 + i * 1.1) * 0.22 + Math.sin(t * 0.7 + i) * 0.1;
        c.rotation.z = Math.sin(t * 1.1 + i * 2.3) * 0.05;
      });
      pads.forEach((p, i) => { p.position.y = pond.y + 0.03 + Math.sin(t * 1.2 + i) * 0.012; });
    },
  };
}
