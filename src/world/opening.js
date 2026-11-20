import * as THREE from 'three';
import gsap from 'gsap';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import typeface from '../assets/wordmark.typeface.json';
import { OPEN_Y, makeMaterial, U } from './shared';
import { mulberry32, vnoise } from './terrain';
import { buildPatchGrass, buildTrees } from './vegetation';
import { buildSeeds, seedGeometry } from './atmosphere';

const Y = OPEN_Y;
const RX = 13.5, RZ = 7.6;
const edge = (a) => 1 + 0.1 * Math.sin(3 * a + 1) + 0.06 * Math.sin(7 * a + 2);

function buildIsland() {
  const group = new THREE.Group();
  const rand = mulberry32(12);
  const SEGS = 44;

  // Top, then the underside narrowing to a point, as one flat-shaded mesh.
  const pos = [0, 0.15, 0], col = [], idx = [];
  const earth = new THREE.Color('#6b5638'), rim = new THREE.Color('#6f8236'), deep = new THREE.Color('#4a3524'), light = new THREE.Color('#8a6a45');
  const c = new THREE.Color();
  c.copy(earth); col.push(c.r, c.g, c.b);
  const TOP = 6, UNDER = 7;
  for (let i = 1; i <= TOP + UNDER; i++) {
    const under = i > TOP;
    const k = under ? (i - TOP) / UNDER : 0;
    const t = under ? 1 - Math.pow(k, 1.25) * 0.97 : i / TOP;
    for (let j = 0; j < SEGS; j++) {
      const a = (j / SEGS) * Math.PI * 2;
      const wob = under ? 1 + (rand() - 0.5) * 0.22 * k : 1;
      const x = Math.cos(a) * RX * edge(a) * t * wob, z = Math.sin(a) * RZ * edge(a) * t * wob;
      const y = under ? -Math.pow(k, 0.85) * 4.7 + (rand() - 0.5) * 0.7 : (vnoise(x * 0.4, z * 0.4) - 0.5) * 0.3 + (i === TOP ? -0.12 : 0.1);
      pos.push(x, y, z);
      if (!under) c.copy(earth).lerp(rim, i === TOP ? 0.9 : 0.25);
      else c.copy(k < 0.2 ? rim : light).lerp(deep, Math.min(1, k * 0.9 + rand() * 0.35));
      col.push(c.r, c.g, c.b);
    }
  }
  for (let j = 0; j < SEGS; j++) idx.push(0, 1 + ((j + 1) % SEGS), 1 + j);
  for (let i = 1; i < TOP + UNDER; i++) {
    const a = 1 + (i - 1) * SEGS, b = 1 + i * SEGS;
    for (let j = 0; j < SEGS; j++) {
      const k = (j + 1) % SEGS;
      idx.push(a + j, a + k, b + j, a + k, b + k, b + j);
    }
  }
  const tip = pos.length / 3;
  pos.push(1, -5.6, 0.4);
  col.push(deep.r, deep.g, deep.b);
  const last = 1 + (TOP + UNDER - 1) * SEGS;
  for (let j = 0; j < SEGS; j++) idx.push(last + j, last + ((j + 1) % SEGS), tip);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx);
  const flat = geo.toNonIndexed();
  flat.computeVertexNormals();
  group.add(new THREE.Mesh(flat, new THREE.MeshLambertMaterial({ vertexColors: true })));

  // Roots hanging under the island.
  const rootMat = new THREE.MeshLambertMaterial({ color: '#8f6b45' });
  for (let i = 0; i < 17; i++) {
    const a = rand() * Math.PI * 2, r = 0.25 + rand() * 0.6;
    const x = Math.cos(a) * RX * r, z = Math.sin(a) * RZ * r;
    const y0 = -4.5 * (1 - r) - 1.0, len = 1.6 + rand() * 2.6;
    const pts = [0, 0.33, 0.66, 1].map((k) => new THREE.Vector3(x + (rand() - 0.5) * 0.7 * k, y0 - len * k, z + (rand() - 0.5) * 0.7 * k));
    group.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, 0.055, 5), rootMat));
    const end = pts[3], mid = pts[2];
    for (let f = 0; f < 2; f++) {
      const fork = [mid.clone(), mid.clone().lerp(end, 0.5).add(new THREE.Vector3((rand() - 0.5) * 0.9, 0, (rand() - 0.5) * 0.9)), end.clone().add(new THREE.Vector3((rand() - 0.5) * 1.3, -0.3 * rand(), (rand() - 0.5) * 1.3))];
      group.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(fork), 6, 0.03, 4), rootMat));
    }
  }
  return group;
}

function buildWordmark(text) {
  const font = new FontLoader().parse(typeface);
  const geo = new TextGeometry(text, { font, size: 2.9, depth: 1.25, curveSegments: 6, bevelEnabled: true, bevelThickness: 0.17, bevelSize: 0.13, bevelSegments: 4 });
  geo.computeBoundingBox();
  const b = geo.boundingBox;
  geo.translate(-(b.max.x + b.min.x) / 2, -b.min.y, -(b.max.z + b.min.z) / 2);
  const height = b.max.y - b.min.y;
  return new THREE.Mesh(geo, makeMaterial({
    uniforms: { uHeight: { value: height } },
    vertex: /* glsl */ `
      varying vec3 vN; varying vec3 vP; varying float vDist;
      void main() { vN = normal; vP = position; vec4 mv = modelViewMatrix * vec4(position, 1.0); vDist = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragment: /* glsl */ `
      uniform vec3 uSun; uniform float uHeight;
      varying vec3 vN; varying vec3 vP; varying float vDist;
      void main() {
        vec3 n = normalize(vN);
        float h = vP.y / uHeight;
        float patches = noise3(vP * 1.15) * 0.75 + noise3(vP * 3.4) * 0.25;
        float moss = smoothstep(0.42, 0.6, n.y * 0.45 + patches * 0.8 + smoothstep(0.55, 1.0, h) * 0.28 + (1.0 - smoothstep(0.0, 0.3, h)) * 0.3 - 0.12);
        vec3 stone = mix(vec3(0.90, 0.83, 0.66), vec3(0.78, 0.70, 0.52), noise3(vP * vec3(0.4, 6.0, 0.4)));
        vec3 green = mix(vec3(0.42, 0.62, 0.2), vec3(0.6, 0.78, 0.3), noise3(vP * 5.0));
        vec3 col = mix(stone, green, moss);
        float l = clamp(dot(n, normalize(uSun)), 0.0, 1.0);
        col *= 0.5 + 0.5 * l + n.z * 0.14;
        gl_FragColor = vec4(withFog(grade(col), vDist), 1.0);
        #include <colorspace_fragment>
      }`,
  }));
}

function buildCloudSea() {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000), makeMaterial({
    vertex: /* glsl */ `
      varying vec3 vW; varying float vDist;
      void main() { vW = (modelMatrix * vec4(position, 1.0)).xyz; vec4 mv = viewMatrix * vec4(vW, 1.0); vDist = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragment: /* glsl */ `
      varying vec3 vW; varying float vDist;
      void main() {
        vec2 p = vW.xz * 0.012 + vec2(uTime * 0.01, 0.0);
        float n = noise3(vec3(p, 1.0)) * 0.55 + noise3(vec3(p * 2.3, 4.0)) * 0.3 + noise3(vec3(p * 5.1 - uTime * 0.02, 7.0)) * 0.15;
        vec3 col = mix(vec3(0.74, 0.83, 0.93), vec3(1.0), smoothstep(0.3, 0.72, n));
        col = mix(col, uFogColor, smoothstep(140.0, 900.0, vDist));
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`,
  }));
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = Y - 15;
  return mesh;
}

export function createOpening(wordmarkText, quality) {
  const group = new THREE.Group();
  const island = buildIsland();
  island.position.y = Y;
  const word = buildWordmark(wordmarkText);
  word.position.set(1.6, Y + 0.12, 2.6);

  const rand = mulberry32(3);
  const blades = [];
  const bladeCount = quality === 'low' ? 1500 : 2800;
  while (blades.length < bladeCount) {
    const a = rand() * Math.PI * 2, r = Math.sqrt(rand()) * 0.97;
    const bx = Math.cos(a) * RX * edge(a) * r, bz = Math.sin(a) * RZ * edge(a) * r;
    // Keep the ground just in front of the name low, so the letters read.
    if (Math.abs(bx - 1.6) < 9.5 && bz > 1.9 && bz < 4.6 && rand() < 0.8) continue;
    blades.push([bx, Y + 0.05, bz]);
  }
  const grass = buildPatchGrass(blades);

  const tree = buildTrees([{
    x: -7.4, z: -1.4, y: -0.1, h: 6.4, r: 0.2, rot: 0.6, palette: 0,
    clusters: [{ x: 0, y: 8.3, z: 0, r: 2.0 }, { x: -2.3, y: 6.6, z: 0.5, r: 1.6 }, { x: 2.2, y: 5.7, z: 0.4, r: 1.7 }, { x: 0.4, y: 5.0, z: -1.4, r: 1.4 }, { x: 2.6, y: 7.9, z: -0.7, r: 1.3 }, { x: -1.4, y: 4.6, z: 0.9, r: 1.1 }],
  }], quality === 'low' ? 300 : 620, [0, Y, 0]);

  const seeds = buildSeeds(34, new THREE.Vector3(2, Y + 2.2, 0.5), [34, 9, 12], 0.7);
  const hero = new THREE.Mesh(seedGeometry(), new THREE.MeshBasicMaterial({ color: '#fbf7ee', side: THREE.DoubleSide, fog: false }));
  hero.scale.setScalar(0.85);
  hero.visible = false;

  group.add(island, word, grass, tree, seeds.mesh, hero, buildCloudSea());

  // The shot: a slow look at the island, a push towards the name, and then
  // the camera follows one seed off the edge and down through the clouds.
  const cam = { px: 0, py: Y + 4.6, pz: 33, lx: 0, ly: Y + 1.2, lz: 0 };
  const seed = { x: 3.6, y: Y + 1.3, z: 3 };
  let done = false, timeline, veil;

  function finish(onDone) {
    if (done) return;
    done = true;
    timeline?.kill();
    veil = document.getElementById('veil');
    gsap.to(veil, { opacity: 1, duration: 0.5, ease: 'sine.out', onComplete: () => {
      onDone();
      gsap.to(veil, { opacity: 0, duration: 2.2, delay: 0.25, ease: 'sine.inOut' });
    } });
  }

  return {
    group,
    play(onDone) {
      veil = document.getElementById('veil');
      timeline = gsap.timeline({ onComplete: () => finish(onDone) });
      timeline
        .to(cam, { px: -4, py: Y + 3.4, pz: 25, ly: Y + 1.5, duration: 7, ease: 'sine.inOut' })
        .to(cam, { px: 3.6, py: Y + 2.5, pz: 13.5, lx: 3.4, ly: Y + 2, lz: 1, duration: 4.4, ease: 'power2.inOut' })
        .call(() => { hero.visible = true; })
        .to(seed, { x: 5.2, y: Y + 3.3, z: 6.4, duration: 2.2, ease: 'sine.inOut' })
        .to(cam, { lx: 5.2, ly: Y + 3.1, lz: 6.4, duration: 2.2, ease: 'sine.inOut' }, '<')
        .to(seed, { x: 9.5, y: Y - 8, z: 9.5, duration: 4, ease: 'power1.in' })
        .to(cam, { px: 8, py: Y - 4.5, pz: 16.5, lx: 9.5, ly: Y - 8.4, lz: 9.5, duration: 4, ease: 'power1.in' }, '<')
        .to(seed, { x: 11, y: Y - 24, z: 11, duration: 2.4, ease: 'none' })
        .to(cam, { px: 10, py: Y - 17, pz: 17.5, lx: 11, ly: Y - 25, lz: 11, duration: 2.4, ease: 'none' }, '<')
        .to(veil, { opacity: 1, duration: 1.5, ease: 'sine.in' }, '-=1.7');
      return () => finish(onDone);
    },
    update(t, camera) {
      seeds.update(t);
      hero.position.set(seed.x + Math.sin(t * 1.3) * 0.12, seed.y, seed.z);
      hero.rotation.set(Math.sin(t * 0.9) * 0.25, t * 0.5, 0.2 + Math.cos(t * 0.7) * 0.2);
      camera.position.set(cam.px + Math.sin(t * 0.25) * 0.4, cam.py + Math.sin(t * 0.4) * 0.15, cam.pz);
      camera.lookAt(cam.lx, cam.ly, cam.lz);
      U.uPlayer.value.set(0, -999, 0);
    },
    dispose() {
      timeline?.kill();
      group.traverse((o) => { o.geometry?.dispose(); o.material?.dispose?.(); });
    },
  };
}
