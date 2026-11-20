import * as THREE from 'three';
import { makeMaterial, U, SUN_DIR, MOON_DIR, live } from './shared';
import { mulberry32, heightAt } from './terrain';

// ------------------------------------------------------------------ sky ---
export function buildSky() {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 20), makeMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: { uSun: U.uSun, uMoon: { value: MOON_DIR } },
    vertex: /* glsl */ `
      varying vec3 vDir;
      void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragment: /* glsl */ `
      uniform vec3 uSun;
      uniform vec3 uMoon;
      varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir);
        float up = clamp(d.y, -0.2, 1.0);
        vec3 top = mix(mix(vec3(0.36, 0.63, 0.86), vec3(0.47, 0.52, 0.58), uRain), vec3(0.012, 0.022, 0.07), uNight);
        vec3 col = mix(uFogColor, top, smoothstep(-0.02, 0.62, up));
        // soft clouds, drifting
        vec2 uv = d.xz / (abs(d.y) + 0.35);
        float c = noise3(vec3(uv * 1.6 + uTime * 0.012, 3.0)) * 0.6 + noise3(vec3(uv * 3.7 - uTime * 0.02, 9.0)) * 0.4;
        float cover = mix(0.6, 0.34, uRain);
        float cloud = smoothstep(cover, cover + 0.3, c) * smoothstep(0.02, 0.3, d.y);
        vec3 cloudCol = mix(mix(vec3(1.0), vec3(0.62, 0.66, 0.72), uRain), vec3(0.09, 0.12, 0.22), uNight);
        col = mix(col, cloudCol, cloud * mix(0.7, 0.95, uRain));
        // sun, and at night a moon in its place
        float s = max(dot(d, normalize(uSun)), 0.0);
        col += vec3(1.0, 0.93, 0.75) * (pow(s, 600.0) * 2.0 + pow(s, 24.0) * 0.18) * (1.0 - uNight) * (1.0 - uRain);
        float clear = 1.0 - cloud * mix(0.85, 0.35, uNight);
        // stars: round points that twinkle, thinning out only at the very horizon
        vec3 sd = d * 190.0;
        vec3 cell = floor(sd);
        float h = hash31(cell);
        float size = mix(0.16, 0.34, hash31(cell + 7.0));
        float star = step(0.972, h) * smoothstep(size, 0.0, length(fract(sd) - 0.5));
        star *= 0.55 + 0.45 * sin(uTime * (1.5 + h * 3.0) + hash31(cell + 3.0) * 40.0);
        vec3 starCol = mix(vec3(1.0, 0.92, 0.8), vec3(0.8, 0.88, 1.0), hash31(cell + 11.0));
        col += starCol * star * 1.6 * uNight * smoothstep(-0.02, 0.1, d.y) * clear * (1.0 - uRain);
        // moon: a lit disc with soft maria, a halo, and a wash of light around it
        vec3 mDir = normalize(uMoon);
        float m = max(dot(d, mDir), 0.0);
        float disc = smoothstep(0.99880, 0.99895, m);
        vec3 mt = normalize(cross(mDir, vec3(0.0, 1.0, 0.0)));
        vec3 mb = cross(mt, mDir);
        vec2 mp = vec2(dot(d, mt), dot(d, mb)) * 60.0;
        float maria = noise3(vec3(mp * 1.3, 5.0)) * 0.6 + noise3(vec3(mp * 3.1, 9.0)) * 0.4;
        vec3 moonCol = mix(vec3(0.98, 0.96, 0.88), vec3(0.62, 0.65, 0.72), smoothstep(0.42, 0.7, maria));
        moonCol *= 1.0 - 0.18 * smoothstep(0.9993, 0.9988, m); // a little darker towards the rim
        col = mix(col, moonCol, disc * uNight * (1.0 - uRain * 0.7));
        col += vec3(0.62, 0.72, 1.0) * (pow(m, 900.0) * 0.55 * (1.0 - disc * 0.9) + pow(m, 60.0) * 0.16) * uNight * (1.0 - uRain * 0.7);

        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`,
  }));
  mesh.renderOrder = -10;
  mesh.frustumCulled = false;
  return mesh;
}

// --------------------------------------------------------------- lights ---
const DAY_FOG = new THREE.Color('#bcd9ef'), RAIN_FOG = new THREE.Color('#a4b0ba'), NIGHT_FOG = new THREE.Color('#0c1430');
const SUN_DAY = new THREE.Color('#fff2d6'), SUN_NIGHT = new THREE.Color('#7f9cff');
const HEMI_SKY = new THREE.Color('#dcecff'), HEMI_NIGHT = new THREE.Color('#33407a');

export function buildLights(shadows) {
  const group = new THREE.Group();
  const hemi = new THREE.HemisphereLight('#dcecff', '#7a6a48', 1.5);
  const sun = new THREE.DirectionalLight('#fff2d6', 2.3);
  if (shadows) {
    sun.castShadow = true;
    sun.shadow.mapSize.setScalar(shadows);
    const cam = sun.shadow.camera;
    cam.left = cam.bottom = -24;
    cam.right = cam.top = 24;
    cam.near = 1;
    cam.far = 120;
    sun.shadow.bias = -0.0006;
    sun.shadow.normalBias = 0.04;
  }
  group.add(hemi, sun, sun.target);
  const fog = new THREE.Fog('#bcd9ef', 60, 400);
  return {
    group,
    fog,
    update(focus, opening) {
      const night = U.uNight.value, rain = U.uRain.value;
      fog.color.copy(DAY_FOG).lerp(RAIN_FOG, rain).lerp(NIGHT_FOG, night);
      U.uFogColor.value.copy(fog.color);
      fog.near = U.uFogNear.value = opening ? 120 : 34 - rain * 12;
      fog.far = U.uFogFar.value = opening ? 900 : 150 - rain * 45;
      sun.color.copy(SUN_DAY).lerp(SUN_NIGHT, night);
      sun.intensity = (2.3 - rain * 1.1) * (1 - night * 0.86);
      hemi.color.copy(HEMI_SKY).lerp(HEMI_NIGHT, night);
      hemi.intensity = (1.5 - rain * 0.35) * (1 - night * 0.72);
      sun.position.copy(focus).addScaledVector(SUN_DIR, 55);
      sun.target.position.copy(focus);
    },
  };
}

// ----------------------------------------------------------------- rain ---
export function buildRain(count) {
  const rand = mulberry32(8);
  const pos = new Float32Array(count * 6), seed = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    const x = (rand() - 0.5) * 44, y = rand() * 26, z = (rand() - 0.5) * 44, s = rand();
    pos.set([x, y, z, x, y, z], i * 6);
    seed.set([s, 0, s, 1], i * 4);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 2));
  const lines = new THREE.LineSegments(geo, makeMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uCentre: { value: new THREE.Vector3() } },
    vertex: /* glsl */ `
      attribute vec2 aSeed;
      uniform vec3 uCentre;
      varying float vA;
      void main() {
        vec3 p = position;
        float speed = 17.0 + aSeed.x * 9.0;
        p.y = mod(p.y - uTime * speed, 26.0) + aSeed.y * 0.55;
        p.x += aSeed.y * 0.07;
        p.xz = mod(p.xz - uCentre.xz + 22.0, 44.0) - 22.0 + uCentre.xz;
        p.y += uCentre.y - 6.0;
        vA = uRain * (0.25 + aSeed.x * 0.4);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragment: /* glsl */ `
      varying float vA;
      void main() { gl_FragColor = vec4(0.85, 0.9, 0.97, vA); }`,
  }));
  lines.frustumCulled = false;
  return {
    mesh: lines,
    update(camera) {
      lines.visible = U.uRain.value > 0.01;
      lines.material.uniforms.uCentre.value.copy(camera.position);
    },
  };
}

// --------------------------------------------------- dandelion seeds ------
// One seed: a thin stem, the seed itself, and a half dome of fine filaments.
export function seedGeometry() {
  const pos = [], idx = [];
  const quad = (a, b, w, up = [0, 0, 1]) => {
    const n = pos.length / 3;
    pos.push(a[0] - up[0] * w, a[1] - up[1] * w, a[2] - up[2] * w, a[0] + up[0] * w, a[1] + up[1] * w, a[2] + up[2] * w,
      b[0] - up[0] * w, b[1] - up[1] * w, b[2] - up[2] * w, b[0] + up[0] * w, b[1] + up[1] * w, b[2] + up[2] * w);
    idx.push(n, n + 1, n + 2, n + 1, n + 3, n + 2);
  };
  quad([0, -1, 0], [0, 0, 0], 0.018);
  quad([0, -1, 0], [0, 0, 0], 0.018, [1, 0, 0]);
  quad([0, -1.16, 0], [0, -0.98, 0], 0.035);
  quad([0, -1.16, 0], [0, -0.98, 0], 0.035, [1, 0, 0]);
  const FIL = 26;
  for (let i = 0; i < FIL; i++) {
    const a = (i / FIL) * Math.PI * 2 * 2.618, tilt = 0.18 + (i / FIL) * 1.25;
    const d = [Math.sin(tilt) * Math.cos(a), Math.cos(tilt), Math.sin(tilt) * Math.sin(a)];
    const side = [-Math.sin(a), 0, Math.cos(a)];
    quad([0, 0, 0], [d[0] * 0.62, d[1] * 0.62, d[2] * 0.62], 0.022, side);
    quad([d[0] * 0.5, d[1] * 0.5, d[2] * 0.5], [d[0] * 0.66, d[1] * 0.66, d[2] * 0.66], 0.05, side);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  return geo;
}

export function buildSeeds(count, centre, spread, drift = 1) {
  const rand = mulberry32(count * 7 + 1);
  const mat = new THREE.MeshBasicMaterial({ color: '#f7f2e6', side: THREE.DoubleSide, transparent: true, opacity: 0.92, fog: false });
  const mesh = new THREE.InstancedMesh(seedGeometry(), mat, count);
  mesh.frustumCulled = false;
  const seeds = Array.from({ length: count }, () => ({
    x: (rand() - 0.5) * spread[0], y: rand() * spread[1], z: (rand() - 0.5) * spread[2],
    s: 0.55 + rand() * 0.6, ph: rand() * 6.28, sp: 0.4 + rand() * 0.8,
  }));
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3();
  return {
    mesh,
    update(t, origin = centre) {
      seeds.forEach((s, i) => {
        const x = ((s.x + t * s.sp * drift + spread[0] * 0.5) % spread[0]) - spread[0] * 0.5;
        const y = s.y + Math.sin(t * 0.5 * s.sp + s.ph) * 0.8;
        const z = s.z + Math.cos(t * 0.3 * s.sp + s.ph) * 0.9;
        q.setFromEuler(e.set(Math.sin(t * 0.8 + s.ph) * 0.35, t * 0.3 * s.sp + s.ph, 0.25 + Math.cos(t * 0.6 + s.ph) * 0.3));
        mesh.setMatrixAt(i, m.compose(v.set(origin.x + x, origin.y + y, origin.z + z), q, sc.setScalar(s.s)));
      });
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
}

// ---------------------------------------------------------------- birds ---
export function buildBirds() {
  const group = new THREE.Group();
  const colors = ['#d94f3d', '#4d86c6', '#e6b93a', '#6b5a48', '#7fae48'];
  const wing = new THREE.BufferGeometry();
  wing.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, -0.14, 0, 0, 0.14, 0.55, 0, 0.02], 3));
  wing.computeVertexNormals();
  const birds = colors.map((color, i) => {
    const mat = new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide });
    const bird = new THREE.Group();
    const body = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.5, 5), mat);
    body.rotation.x = Math.PI / 2;
    const l = new THREE.Mesh(wing, mat), r = new THREE.Mesh(wing, mat);
    r.scale.x = -1;
    bird.add(body, l, r);
    group.add(bird);
    return { bird, l, r, radius: 16 + i * 6, height: 11 + (i % 3) * 3, speed: (0.16 + i * 0.03) * (i % 2 ? 1 : -1), ph: i * 1.7, cx: (i - 2) * 7, cz: (i % 2) * 10 - 5 };
  });
  return {
    group,
    update(t) {
      group.visible = U.uNight.value < 0.6;
      birds.forEach((b) => {
        const a = t * b.speed + b.ph;
        const x = b.cx + Math.cos(a) * b.radius, z = b.cz + Math.sin(a) * b.radius;
        b.bird.position.set(x, Math.max(heightAt(x, z), 0) + b.height + Math.sin(t * 0.7 + b.ph) * 1.2, z);
        b.bird.rotation.y = -a + (b.speed > 0 ? 0 : Math.PI);
        const flap = Math.sin(t * 11 + b.ph) * 0.8;
        b.l.rotation.z = flap;
        b.r.rotation.z = -flap;
      });
    },
  };
}

// Fireflies at night, pollen by day: slow bright points near the character.
export function buildMotes(count) {
  const rand = mulberry32(77);
  const pos = new Float32Array(count * 3), ph = new Float32Array(count);
  for (let i = 0; i < count; i++) { pos.set([(rand() - 0.5) * 50, 0.3 + rand() * 3.2, (rand() - 0.5) * 50], i * 3); ph[i] = rand() * 6.28; }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aPhase', new THREE.BufferAttribute(ph, 1));
  const points = new THREE.Points(geo, makeMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uCentre: { value: live.player } },
    vertex: /* glsl */ `
      attribute float aPhase;
      uniform vec3 uCentre;
      varying float vA;
      void main() {
        vec3 p = position;
        p.xz = mod(p.xz - uCentre.xz + 25.0, 50.0) - 25.0 + uCentre.xz;
        p.y += uCentre.y + sin(uTime * 0.6 + aPhase) * 0.5;
        p.x += sin(uTime * 0.4 + aPhase * 2.0) * 0.6;
        vA = (0.5 + 0.5 * sin(uTime * 2.2 + aPhase * 5.0)) * mix(0.22, 1.0, uNight) * (1.0 - uRain);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = mix(26.0, 60.0, uNight) / -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragment: /* glsl */ `
      varying float vA;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        vec3 col = mix(vec3(1.0, 1.0, 0.9), vec3(0.85, 1.0, 0.45), uNight);
        gl_FragColor = vec4(col, smoothstep(0.5, 0.1, d) * vA);
      }`,
  }));
  points.frustumCulled = false;
  return points;
}
