import * as THREE from 'three';
import { store } from '../store';
import { input, held, running } from '../lib/input';
import { audio } from '../lib/audio';
import { live, U } from './shared';
import { PLACES, SAFE_R, heightAt } from './terrain';
import { interactables } from './layout';

// ------------------------------------------------------------ character ---
function buildCharacter() {
  const root = new THREE.Group();
  const mat = (color) => new THREE.MeshLambertMaterial({ color });
  const skin = mat('#e2a77e'), hoodie = mat('#2f9c8f'), jeans = mat('#3b4a70'), hair = mat('#1d1a1c'), shoe = mat('#f1ece2');
  const add = (parent, geo, material, x, y, z) => {
    const m = new THREE.Mesh(geo, material);
    m.position.set(x, y, z);
    m.castShadow = true;
    parent.add(m);
    return m;
  };
  const body = new THREE.Group();
  root.add(body);

  add(body, new THREE.CylinderGeometry(0.27, 0.33, 0.52, 12), hoodie, 0, 0.7, 0);
  add(body, new THREE.SphereGeometry(0.27, 12, 8), hoodie, 0, 0.96, 0);
  add(body, new THREE.CylinderGeometry(0.34, 0.34, 0.07, 12), mat('#237a70'), 0, 0.46, 0);
  add(body, new THREE.TorusGeometry(0.2, 0.07, 6, 12), mat('#237a70'), 0, 1.05, -0.02).rotation.x = Math.PI / 2 - 0.3;

  const head = new THREE.Group();
  head.position.y = 1.42;
  body.add(head);
  add(head, new THREE.SphereGeometry(0.4, 18, 14), skin, 0, 0, 0);
  // Hair: a cap of overlapping lumps.
  add(head, new THREE.SphereGeometry(0.43, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.52), hair, 0, 0.04, -0.03);
  [[0, 0.33, 0.2, 0.2], [-0.22, 0.3, 0.14, 0.17], [0.22, 0.3, 0.14, 0.17], [0, 0.42, -0.02, 0.22], [-0.3, 0.14, -0.1, 0.2], [0.3, 0.14, -0.1, 0.2], [0, 0.12, -0.3, 0.24]]
    .forEach(([x, y, z, r]) => add(head, new THREE.IcosahedronGeometry(r, 1), hair, x, y, z));
  const eye = new THREE.MeshBasicMaterial({ color: '#2a1e1a' });
  add(head, new THREE.SphereGeometry(0.045, 8, 6), eye, -0.14, -0.02, 0.365);
  add(head, new THREE.SphereGeometry(0.045, 8, 6), eye, 0.14, -0.02, 0.365);
  add(head, new THREE.SphereGeometry(0.05, 8, 6), mat('#d18e68'), 0, -0.09, 0.39);
  // Glasses: two round frames, a bridge and the arms back to the ears.
  const frame = mat('#3a2418');
  const lens = new THREE.MeshBasicMaterial({ color: '#cfe8f2', transparent: true, opacity: 0.28, depthWrite: false });
  [-0.15, 0.15].forEach((x) => {
    add(head, new THREE.TorusGeometry(0.105, 0.019, 6, 20), frame, x, -0.02, 0.4);
    add(head, new THREE.CircleGeometry(0.1, 20), lens, x, -0.02, 0.405).castShadow = false;
    add(head, new THREE.BoxGeometry(0.022, 0.022, 0.4), frame, x * 2.85, 0.0, 0.2);
  });
  add(head, new THREE.CylinderGeometry(0.014, 0.014, 0.1, 6), frame, 0, 0.0, 0.405).rotation.z = Math.PI / 2;
  add(head, new THREE.SphereGeometry(0.06, 8, 6), skin, -0.4, -0.02, 0);
  add(head, new THREE.SphereGeometry(0.06, 8, 6), skin, 0.4, -0.02, 0);

  const limb = (x, y, material, len, r, tip) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, 0);
    add(pivot, new THREE.CylinderGeometry(r, r * 0.9, len, 8), material, 0, -len / 2, 0);
    add(pivot, new THREE.SphereGeometry(r * 1.2, 8, 6), tip, 0, -len, tip === shoe ? 0.04 : 0).scale.set(1, tip === shoe ? 0.7 : 1, tip === shoe ? 1.5 : 1);
    body.add(pivot);
    return pivot;
  };
  const armL = limb(-0.34, 0.98, hoodie, 0.4, 0.085, skin), armR = limb(0.34, 0.98, hoodie, 0.4, 0.085, skin);
  const legL = limb(-0.13, 0.46, jeans, 0.38, 0.11, shoe), legR = limb(0.13, 0.46, jeans, 0.38, 0.11, shoe);
  armL.rotation.z = -0.16;
  armR.rotation.z = 0.16;

  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.5, 20), new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.22, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.05;
  root.add(shadow);

  let stride = 0;
  return {
    root,
    animate(dt, speed, grounded, t) {
      stride += speed * dt * 2.3;
      const k = Math.min(1, speed / 4);
      const swing = Math.sin(stride) * 0.85 * k;
      legL.rotation.x = swing;
      legR.rotation.x = -swing;
      armL.rotation.x = grounded ? -swing * 0.8 : -2.4;
      armR.rotation.x = grounded ? swing * 0.8 : -2.4;
      body.position.y = Math.abs(Math.sin(stride)) * 0.07 * k + Math.sin(t * 2) * 0.012 * (1 - k);
      body.rotation.x = k * (speed > 5.5 ? 0.16 : 0.07);
      head.rotation.y = Math.sin(t * 0.5) * 0.12 * (1 - k);
      shadow.visible = grounded;
    },
  };
}

// --------------------------------------------------------------- player ---
const WALK = 4.3, RUN = 7.8, GRAVITY = 21, JUMP = 7.4;
const lerpAngle = (a, b, k) => a + (((((b - a) % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * k;

export function createPlayer(physics, trail) {
  const character = buildCharacter();
  const target = new THREE.Vector3(), wanted = new THREE.Vector3(), look = new THREE.Vector3();
  let vy = 0, stepped = 0, stuck = 0, lastX = 0, lastZ = 0, entered = false;
  const p = live.player;
  p.y = heightAt(p.x, p.z);

  function place(x, z) {
    p.set(x, heightAt(x, z), z);
    vy = 0;
    physics?.place(p.x, p.y, p.z);
  }

  function nearest() {
    let best = null, bestD = Infinity;
    for (const it of interactables) {
      const d = Math.hypot(p.x - it.x, p.z - it.z);
      if (d < it.r && d < bestD) { best = it; bestD = d; }
    }
    const s = store.get();
    const id = best?.id ?? null;
    if ((s.near?.id ?? null) !== id || (id === 'fire' && s.near.night !== s.night)) {
      store.set({ near: best ? { id, night: s.night, label: id === 'fire' && s.night ? 'Volver al día' : best.label } : null });
    }
  }

  return {
    group: character.root,
    update(dt, t, camera) {
      const s = store.get();
      const busy = s.panel || s.menu;

      // Looking around.
      live.camYaw -= input.look.dx * 0.0046;
      const first = s.view === 'first';
      live.camPitch = THREE.MathUtils.clamp(live.camPitch + input.look.dy * 0.0036, first ? -0.7 : 0.08, first ? 1.0 : 1.2);
      input.look.dx = input.look.dy = 0;

      // What the player wants.
      let ix = (held('right') ? 1 : 0) - (held('left') ? 1 : 0) + input.stick.x;
      let iz = (held('forward') ? 1 : 0) - (held('back') ? 1 : 0) - input.stick.y;
      if (busy) ix = iz = 0;
      let mx = 0, mz = 0, speed = 0;
      if (ix || iz) {
        if (s.following) store.set({ following: null });
        const len = Math.max(1, Math.hypot(ix, iz));
        ix /= len;
        iz /= len;
        const sin = Math.sin(live.camYaw), cos = Math.cos(live.camYaw);
        mx = -sin * iz + cos * ix;
        mz = -cos * iz - sin * ix;
        speed = (running() ? RUN : WALK) * Math.min(1, Math.hypot(ix, iz));
      } else if (s.following) {
        // Walking a trail on its own, towards the place picked in the menu.
        const place_ = PLACES.find((pl) => pl.id === s.following);
        const dx = place_.stand[0] - p.x, dz = place_.stand[1] - p.z, d = Math.hypot(dx, dz);
        stuck = Math.hypot(p.x - lastX, p.z - lastZ) < dt * 1.2 ? stuck + dt : 0;
        if (d < 1.1) store.set({ following: null });
        else if (stuck > 1.1 || d > 70) { place(place_.stand[0], place_.stand[1]); stuck = 0; store.set({ following: null }); }
        else { mx = dx / d; mz = dz / d; speed = RUN; live.camYaw = lerpAngle(live.camYaw, Math.atan2(-mx, -mz), 1 - Math.exp(-dt * 1.4)); }
      }
      lastX = p.x;
      lastZ = p.z;

      // Moving, through the physics when it is there.
      if (live.grounded && input.jump && !busy) vy = JUMP;
      input.jump = false;
      vy = live.grounded && vy < 0 ? -1.5 : vy - GRAVITY * dt;
      const dir = Math.hypot(mx, mz) || 1;
      const dx = (mx / dir) * speed * dt, dz = (mz / dir) * speed * dt;
      if (physics) {
        const r = physics.move(dx, vy * dt, dz, dt);
        p.set(r.x, r.y, r.z);
        live.grounded = r.grounded;
      } else {
        p.x += dx;
        p.z += dz;
        const ground = heightAt(p.x, p.z);
        p.y = Math.max(ground, p.y + vy * dt);
        live.grounded = p.y <= ground + 0.02;
      }
      // Safe perimeter. The fence colliders already stop the character; this
      // catches a rare escape and also covers the version without physics.
      const edge = Math.hypot(p.x, p.z);
      if (edge > SAFE_R - 0.7) {
        const k = (SAFE_R - 0.8) / edge;
        if (!physics) { p.x *= k; p.z *= k; p.y = Math.max(p.y, heightAt(p.x, p.z)); }
        else if (edge > SAFE_R + 0.5) place(p.x * k, p.z * k);
      }
      if (p.y < heightAt(p.x, p.z) - 4) place(PLACES[0].stand[0], PLACES[0].stand[1]);
      if (live.teleport) { place(live.teleport[0], live.teleport[1]); live.teleport = null; }

      if (speed > 0.1) live.facing = lerpAngle(live.facing, Math.atan2(mx, mz), 1 - Math.exp(-dt * 12));
      live.speed = speed;
      character.root.position.copy(p);
      character.root.rotation.y = live.facing;
      character.root.visible = !first;
      character.animate(dt, speed, live.grounded, t);

      U.uPlayer.value.copy(p);
      trail.update(dt, p.x, p.z, speed > 0.1 && live.grounded);
      if (speed > 0.1 && live.grounded) {
        stepped += speed * dt;
        if (stepped > (speed > 5 ? 2.3 : 1.7)) { stepped = 0; audio.step(); }
      }
      nearest();

      // Camera.
      const sin = Math.sin(live.camYaw), cos = Math.cos(live.camYaw), cp = Math.cos(live.camPitch), sp = Math.sin(live.camPitch);
      if (!entered) {
        entered = true;
        live.entered = t;
        camera.position.set(p.x + sin * 30, p.y + 34, p.z + cos * 30);
        look.set(p.x, p.y + 1.4, p.z);
      }
      if (first) {
        camera.position.set(p.x - sin * 0.12, p.y + 1.5, p.z - cos * 0.12);
        camera.lookAt(camera.position.x - sin * cp, camera.position.y - sp, camera.position.z - cos * cp);
      } else {
        target.set(p.x, p.y + 1.45, p.z);
        const dist = 7.4;
        wanted.set(target.x + sin * cp * dist, target.y + sp * dist, target.z + cos * cp * dist);
        wanted.y = Math.max(wanted.y, heightAt(wanted.x, wanted.z) + 0.6);
        const glide = Math.min(1, (t - live.entered) / 4.5);
        camera.position.lerp(wanted, 1 - Math.exp(-dt * (0.9 + glide * glide * 8)));
        // Dragging the camera low tilts the view up to the sky instead of
        // pushing the camera into the grass.
        const lift = THREE.MathUtils.clamp((0.2 - live.camPitch) * 24, 0, 2);
        look.lerp(wanted.set(target.x, target.y + lift, target.z), 1 - Math.exp(-dt * 12));
        camera.lookAt(look);
      }
    },
  };
}
