import * as THREE from 'three';
import { makeMaterial, U } from './shared';
import { WALK_R, WORLD_R, heightAt, bareAt, mulberry32 } from './terrain';
import { PALETTES } from './layout';

// ---------------------------------------------------------------- grass ---
// One wide, pointed blade, instanced. It leans with the wind, parts around
// the character, and stays flattened for a while where it was walked on.
const BLADE = new Float32Array([
  -0.5, 0, 0, 0.5, 0, 0, -0.4, 0.42, 0, 0.4, 0.42, 0, -0.22, 0.78, 0, 0.22, 0.78, 0, 0, 1, 0,
]);
const BLADE_INDEX = [0, 1, 2, 1, 3, 2, 2, 3, 4, 3, 5, 4, 4, 5, 6];

const grassMaterial = () => makeMaterial({
  side: THREE.DoubleSide,
  uniforms: {
    uBase: { value: new THREE.Color('#2c7a34') },
    uTip: { value: new THREE.Color('#86cf4c') },
  },
  vertex: /* glsl */ `
    attribute vec3 aOffset;
    attribute vec4 aParams; // height, rotation, width, tint
    uniform vec3 uPlayer;
    uniform sampler2D uTrail;
    varying float vH;
    varying float vTint;
    varying float vDist;
    void main() {
      float h = position.y;
      vH = h;
      vTint = aParams.w;
      float c = cos(aParams.y), s = sin(aParams.y);
      vec3 p = vec3(position.x * aParams.z, h * aParams.x, h * h * 0.22 * aParams.x);
      p = vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
      vec3 wp = aOffset + p;

      float wind = sin(uTime * 1.7 + aOffset.x * 0.33 + aOffset.z * 0.27) * 0.55 + sin(uTime * 0.83 + aOffset.z * 0.61) * 0.45;
      float sway = (0.11 + uRain * 0.13) * h * h * aParams.x;
      wp.x += wind * sway;
      wp.z += wind * sway * 0.6;

      vec2 d = aOffset.xz - uPlayer.xz;
      float dist = length(d);
      float push = smoothstep(1.5, 0.25, dist) * step(abs(uPlayer.y - aOffset.y), 2.5);
      float walked = texture2D(uTrail, aOffset.xz / 128.0 + 0.5).r;
      vec2 dir = dist > 0.001 ? d / dist : vec2(1.0, 0.0);
      wp.xz += dir * push * 0.65 * h * aParams.x;
      wp.y -= max(walked * 0.7, push * 0.8) * p.y * 0.85;

      vec4 mv = modelViewMatrix * vec4(wp, 1.0);
      vDist = -mv.z;
      gl_Position = projectionMatrix * mv;
    }`,
  fragment: /* glsl */ `
    uniform vec3 uBase;
    uniform vec3 uTip;
    varying float vH;
    varying float vTint;
    varying float vDist;
    void main() {
      vec3 col = mix(uBase, uTip, smoothstep(0.0, 1.0, vH));
      col *= 0.82 + vTint * 0.34;
      gl_FragColor = vec4(withFog(grade(col), vDist), 1.0);
      #include <colorspace_fragment>
    }`,
});

function grassMesh(offsets, params) {
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(BLADE, 3));
  geo.setIndex(BLADE_INDEX);
  geo.setAttribute('aOffset', new THREE.InstancedBufferAttribute(offsets, 3));
  geo.setAttribute('aParams', new THREE.InstancedBufferAttribute(params, 4));
  geo.instanceCount = offsets.length / 3;
  const mesh = new THREE.Mesh(geo, grassMaterial());
  mesh.frustumCulled = false;
  return mesh;
}

export function buildMeadowGrass(count) {
  const rand = mulberry32(99);
  const offsets = new Float32Array(count * 3);
  const params = new Float32Array(count * 4);
  let n = 0, guard = 0;
  while (n < count && guard++ < count * 4) {
    const a = rand() * Math.PI * 2;
    const r = Math.sqrt(rand()) * (WORLD_R - 2.5);
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (rand() < bareAt(x, z)) continue;
    offsets.set([x, heightAt(x, z) - 0.04, z], n * 3);
    const far = r > WALK_R ? 1.25 : 1;
    params.set([(0.75 + rand() * 0.75) * far, rand() * 6.283, 0.24 + rand() * 0.16, rand()], n * 4);
    n++;
  }
  return grassMesh(offsets.subarray(0, n * 3), params.subarray(0, n * 4));
}

export function buildPatchGrass(points) {
  const rand = mulberry32(5);
  const offsets = new Float32Array(points.length * 3);
  const params = new Float32Array(points.length * 4);
  points.forEach((p, i) => {
    offsets.set(p, i * 3);
    params.set([0.6 + rand() * 0.75, rand() * 6.283, 0.2 + rand() * 0.14, rand()], i * 4);
  });
  return grassMesh(offsets, params);
}

// ---------------------------------------------------------------- trees ---
// Trunks and branches are two instanced meshes; every leaf of every tree is
// one instanced card shaded by which way its cluster faces the sun.
const LEAF = new Float32Array([0, -0.1, 0, -0.36, 0.45, 0, 0.36, 0.45, 0, 0, 1.2, 0]);

const leafMaterial = () => makeMaterial({
  side: THREE.DoubleSide,
  vertex: /* glsl */ `
    attribute vec3 aPos;
    attribute vec3 aNrm;
    attribute vec3 aCol;
    attribute vec3 aRnd; // rotation, phase, size
    uniform vec3 uSun;
    varying vec3 vCol;
    varying float vDist;
    void main() {
      vec3 n = normalize(aNrm);
      vec3 t = normalize(cross(n, vec3(0.31, 1.0, 0.17)));
      vec3 b = cross(n, t);
      float a = aRnd.x * 6.283;
      vec2 q = vec2(cos(a) * position.x - sin(a) * position.y, sin(a) * position.x + cos(a) * position.y);
      vec3 wp = aPos + (t * q.x + b * q.y + n * position.y * 0.25) * aRnd.z;
      float ph = aRnd.y * 6.283;
      wp += vec3(sin(uTime * 1.5 + ph), cos(uTime * 1.2 + ph * 1.7) * 0.6, sin(uTime * 1.1 + ph * 0.6)) * 0.055 * (1.0 + uRain * 1.4);

      float l = dot(n, uSun) * 0.5 + 0.5 + (aRnd.y - 0.5) * 0.3;
      vec3 shade = aCol * vec3(0.45, 0.38, 0.48);
      vCol = mix(shade, aCol, smoothstep(0.32, 0.72, l));
      vCol = mix(vCol, aCol * 1.1 + 0.06, smoothstep(0.82, 1.0, l));

      vec4 mv = modelViewMatrix * vec4(wp, 1.0);
      vDist = -mv.z;
      gl_Position = projectionMatrix * mv;
    }`,
  fragment: /* glsl */ `
    varying vec3 vCol;
    varying float vDist;
    void main() {
      gl_FragColor = vec4(withFog(grade(vCol), vDist), 1.0);
      #include <colorspace_fragment>
    }`,
});

function trunkGeometry() {
  const g = new THREE.CylinderGeometry(0.5, 1, 1, 7, 6);
  g.translate(0, 0.5, 0);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    p.setX(i, p.getX(i) + Math.sin(y * 2.6) * 0.55);
    p.setZ(i, p.getZ(i) + y * y * 0.4);
  }
  g.computeVertexNormals();
  return g;
}

export function buildTrees(trees, leavesPerCluster, origin = [0, 0, 0]) {
  const group = new THREE.Group();
  const rand = mulberry32(31);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), v = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const color = new THREE.Color();

  const trunks = new THREE.InstancedMesh(trunkGeometry(), new THREE.MeshLambertMaterial(), trees.length);
  const branchCount = trees.reduce((n, t) => n + t.clusters.length, 0);
  const branchGeo = new THREE.CylinderGeometry(0.45, 1, 1, 5);
  branchGeo.translate(0, 0.5, 0);
  const branches = new THREE.InstancedMesh(branchGeo, new THREE.MeshLambertMaterial(), branchCount);
  trunks.castShadow = branches.castShadow = true;

  const total = branchCount * leavesPerCluster;
  const aPos = new Float32Array(total * 3), aNrm = new Float32Array(total * 3);
  const aCol = new Float32Array(total * 3), aRnd = new Float32Array(total * 3);
  let leaf = 0, branch = 0;

  trees.forEach((t, ti) => {
    const pal = PALETTES[t.palette];
    const bx = t.x + origin[0], by = t.y + origin[1], bz = t.z + origin[2];
    q.setFromAxisAngle(up, t.rot);
    m.compose(v.set(bx, by, bz), q, s.set(t.r, t.h, t.r));
    trunks.setMatrixAt(ti, m);
    trunks.setColorAt(ti, color.set(pal.trunk));

    // Top of the bent trunk, in world space, so the crown sits on it.
    const top = new THREE.Vector3(Math.sin(2.6) * 0.55 * t.r, t.h, 0.4 * t.r).applyQuaternion(q).add(v);
    const crown = new THREE.Vector3();
    t.clusters.forEach((c) => crown.add(new THREE.Vector3(c.x, c.y - t.h, c.z)));
    crown.multiplyScalar(1 / t.clusters.length).add(top);

    t.clusters.forEach((c) => {
      const centre = new THREE.Vector3(top.x + c.x, by + c.y, top.z + c.z);
      const from = new THREE.Vector3().lerpVectors(v, top, 0.62 + rand() * 0.25);
      const dir = new THREE.Vector3().subVectors(centre, from);
      const len = dir.length();
      q.setFromUnitVectors(up, dir.normalize());
      m.compose(from, q, s.set(t.r * 0.45, len, t.r * 0.45));
      branches.setMatrixAt(branch, m);
      branches.setColorAt(branch++, color.set(pal.birch ? '#cfc8b6' : pal.trunk));
      q.setFromAxisAngle(up, t.rot);
      v.set(bx, by, bz);

      for (let i = 0; i < leavesPerCluster; i++) {
        const u = rand() * 2 - 1, a = rand() * Math.PI * 2, k = Math.sqrt(1 - u * u);
        const d = new THREE.Vector3(k * Math.cos(a), u, k * Math.sin(a));
        const rr = c.r * (0.62 + rand() * 0.42);
        const px = centre.x + d.x * rr, py = centre.y + d.y * rr * 0.82, pz = centre.z + d.z * rr;
        const out = new THREE.Vector3(px - crown.x, py - crown.y, pz - crown.z).normalize();
        d.multiplyScalar(0.55).addScaledVector(out, 0.6).normalize();
        aPos.set([px, py, pz], leaf * 3);
        aNrm.set([d.x, d.y, d.z], leaf * 3);
        color.set(pal.leaf[Math.floor(rand() * pal.leaf.length)]);
        aCol.set([color.r, color.g, color.b], leaf * 3);
        aRnd.set([rand(), rand(), 0.2 + rand() * 0.14], leaf * 3);
        leaf++;
      }
    });
  });

  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(LEAF, 3));
  geo.setIndex([0, 2, 1, 1, 2, 3]);
  geo.setAttribute('aPos', new THREE.InstancedBufferAttribute(aPos, 3));
  geo.setAttribute('aNrm', new THREE.InstancedBufferAttribute(aNrm, 3));
  geo.setAttribute('aCol', new THREE.InstancedBufferAttribute(aCol, 3));
  geo.setAttribute('aRnd', new THREE.InstancedBufferAttribute(aRnd, 3));
  geo.instanceCount = total;
  const leaves = new THREE.Mesh(geo, leafMaterial());
  leaves.frustumCulled = false;
  trunks.frustumCulled = branches.frustumCulled = false;

  group.add(trunks, branches, leaves);
  return group;
}

// --------------------------------------------------- trail of flat grass ---
// A small texture over the whole meadow. The character stamps it as it walks
// and the stamps fade slowly, so the grass remembers where you have been.
export function createTrail() {
  const SIZE = 256;
  const data = new Uint8Array(SIZE * SIZE);
  const tex = new THREE.DataTexture(data, SIZE, SIZE, THREE.RedFormat);
  tex.magFilter = tex.minFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  U.uTrail.value = tex;
  let fade = 0;
  return {
    update(dt, x, z, moving) {
      fade += dt;
      let dirty = false;
      if (fade > 0.22) {
        fade = 0;
        for (let i = 0; i < data.length; i++) if (data[i]) { data[i] = Math.max(0, data[i] - 2); dirty = true; }
      }
      if (moving) {
        const cx = (x / 128 + 0.5) * SIZE, cz = (z / 128 + 0.5) * SIZE;
        for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) {
          const px = Math.round(cx) + i, pz = Math.round(cz) + j;
          if (px < 0 || pz < 0 || px >= SIZE || pz >= SIZE) continue;
          const d = Math.hypot(px - cx, pz - cz);
          const val = Math.round(255 * Math.max(0, 1 - d / 2.6));
          const k = pz * SIZE + px;
          if (val > data[k]) { data[k] = val; dirty = true; }
        }
      }
      if (dirty) tex.needsUpdate = true;
    },
  };
}
