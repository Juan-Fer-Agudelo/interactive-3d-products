import * as THREE from 'three';

// Values every shader and every system reads. Mutated in place each frame.
export const SUN_DIR = new THREE.Vector3(0.5, 0.74, 0.42).normalize();
// Low over the trees, in the direction the camera faces from the camp.
export const MOON_DIR = new THREE.Vector3(-0.33, 0.29, -0.9).normalize();

export const U = {
  uTime: { value: 0 },
  uNight: { value: 0 },
  uRain: { value: 0 },
  uPlayer: { value: new THREE.Vector3(0, -999, 0) },
  uSun: { value: SUN_DIR },
  uTrail: { value: null },
  uFogColor: { value: new THREE.Color('#bcd9ef') },
  uFogNear: { value: 60 },
  uFogFar: { value: 400 },
};

export const live = {
  player: new THREE.Vector3(-1.6, 0, 3.6), // feet
  facing: Math.PI, // direction the character looks
  camYaw: 0.35,
  camPitch: 0.3,
  speed: 0,
  grounded: true,
  teleport: null, // [x, z] request picked up by the player
  entered: 0, // time the meadow was entered, for the camera glide
};

export const OPEN_Y = 300;

export const GLSL_COMMON = /* glsl */ `
uniform float uTime;
uniform float uNight;
uniform float uRain;
uniform vec3 uFogColor;
uniform float uFogNear;
uniform float uFogFar;

float hash31(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float noise3(vec3 x) {
  vec3 i = floor(x), f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash31(i), hash31(i + vec3(1,0,0)), f.x), mix(hash31(i + vec3(0,1,0)), hash31(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash31(i + vec3(0,0,1)), hash31(i + vec3(1,0,1)), f.x), mix(hash31(i + vec3(0,1,1)), hash31(i + vec3(1,1,1)), f.x), f.y), f.z);
}
// Weather and time of day, applied to every hand-written material the same way.
vec3 grade(vec3 c) {
  float g = dot(c, vec3(0.3, 0.6, 0.1));
  c = mix(c, mix(c, vec3(g), 0.35) * vec3(0.72, 0.77, 0.84), uRain);
  c = mix(c, c * vec3(0.2, 0.27, 0.5) + vec3(0.0, 0.004, 0.02), uNight);
  return c;
}
vec3 withFog(vec3 c, float dist) {
  return mix(c, uFogColor, smoothstep(uFogNear, uFogFar, dist));
}
`;

export function makeMaterial({ vertex, fragment, uniforms = {}, ...rest }) {
  return new THREE.ShaderMaterial({
    uniforms: { ...U, ...uniforms },
    vertexShader: GLSL_COMMON + vertex,
    fragmentShader: GLSL_COMMON + fragment,
    ...rest,
  });
}

// Text drawn on a canvas, used for every sign and board in the meadow.
export const FONT = '"Nunito Variable", Nunito, system-ui, sans-serif';
export function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
export function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 9) {
  const words = text.split(' ');
  let line = '';
  let lines = 0;
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines++;
      if (lines === maxLines) {
        ctx.fillText(line.replace(/[ ,.;]+$/, '') + '…', x, y);
        return y + lineHeight;
      }
      ctx.fillText(line, x, y);
      y += lineHeight;
      line = w;
    } else line = test;
  }
  ctx.fillText(line, x, y);
  return y + lineHeight;
}
