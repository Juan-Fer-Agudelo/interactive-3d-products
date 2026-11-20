import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { store, useStore } from '../store';
import { opening as openingActions, interact, escape, toggleMenu, setView } from '../actions';
import { bindInput } from '../lib/input';
import { audio } from '../lib/audio';
import { U, live } from './shared';
import { trees } from './layout';
import { buildMeadowGrass, buildTrees, createTrail } from './vegetation';
import { buildCamp, buildLamps, buildPlaces, buildStonesAndRocks } from './scenery';
import { buildBirds, buildLights, buildMotes, buildRain, buildSeeds, buildSky } from './atmosphere';
import { createPlayer } from './player';
import { createOpening } from './opening';

const TIERS = {
  high: { grass: 92000, leaves: 420, shadows: 2048, dpr: 2, rain: 1500 },
  medium: { grass: 56000, leaves: 280, shadows: 1024, dpr: 1.5, rain: 1000 },
  low: { grass: 26000, leaves: 160, shadows: 0, dpr: 1, rain: 600 },
};

function Scene({ quality, boot }) {
  const { scene, camera } = useThree();
  const clock = useRef(0);
  const frames = useRef(0);

  const world = useMemo(() => {
    const tier = TIERS[quality];
    const group = new THREE.Group();
    const lights = buildLights(tier.shadows);
    const sky = buildSky();
    const lamps = buildLamps();
    const camp = buildCamp();
    const places = buildPlaces();
    const rain = buildRain(tier.rain);
    const birds = buildBirds();
    const seeds = buildSeeds(16, live.player, [46, 7, 46], 0.5);
    const player = createPlayer(boot.physics, createTrail());
    group.add(
      lights.group, sky, boot.ground.mesh, buildStonesAndRocks(), buildMeadowGrass(tier.grass),
      buildTrees(trees, tier.leaves), lamps.group, camp.group, places.group, rain.mesh, birds.group,
      seeds.mesh, buildMotes(90), player.group,
    );
    // ?entrar skips the opening, which is handy while working on the meadow.
    const direct = new URLSearchParams(location.search).has('entrar');
    const intro = store.get().phase === 'meadow' || direct ? null : createOpening('JUAN FER', quality);
    if (intro) group.add(intro.group);
    return { group, lights, sky, lamps, camp, places, rain, birds, seeds, player, intro };
  }, [quality, boot]);

  useEffect(() => {
    scene.fog = world.lights.fog;
    return () => {
      world.intro?.dispose();
      world.group.traverse((o) => {
        if (o === boot.ground.mesh) return;
        o.geometry?.dispose();
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { m.map?.dispose(); m.dispose(); });
      });
    };
  }, [world, scene, boot]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    clock.current += dt;
    const t = clock.current;
    U.uTime.value = t;
    const s = store.get();
    frames.current++;

    // The first rendered frames compile every shader; only then does the show start.
    if (world.intro && !world.started && frames.current >= 4) {
      world.started = true;
      store.set({ progress: 1, phrase: 'listo' });
      setTimeout(() => {
        if (!world.intro) return;
        store.set({ phase: 'opening' });
        openingActions.skip = world.intro.play(() => {
          world.group.remove(world.intro.group);
          world.intro.dispose();
          world.intro = null;
          openingActions.skip = null;
          store.set({ phase: 'meadow' });
        });
      }, s.phase === 'loading' ? 500 : 0);
    }

    if (!world.intro && s.phase === 'loading' && frames.current >= 4) store.set({ progress: 1, phrase: 'listo', phase: 'meadow' });

    const inMeadow = s.phase === 'meadow';
    if (inMeadow) world.player.update(dt, t, camera);
    else if (world.intro) world.intro.update(t, camera);
    world.player.group.visible = inMeadow && s.view !== 'first';

    world.lights.update(inMeadow ? live.player : camera.position, !inMeadow);
    world.sky.position.copy(camera.position);
    world.lamps.update(U.uNight.value);
    world.camp.update(t, U.uNight.value);
    world.places.update(t);
    world.rain.update(camera);
    world.birds.update(t);
    world.seeds.update(t, live.player);
    audio.setWeather(U.uRain.value, U.uNight.value);
  });

  return <primitive object={world.group} />;
}

export default function Experience({ boot }) {
  const quality = useStore((s) => s.quality);
  const wrap = useRef(null);

  useEffect(() => {
    const el = wrap.current;
    const wake = () => audio.start();
    window.addEventListener('pointerdown', wake);
    window.addEventListener('keydown', wake);
    const unbind = bindInput(el, {
      interact,
      escape,
      menu: toggleMenu,
      view: () => store.get().phase === 'meadow' && setView(store.get().view === 'third' ? 'first' : 'third'),
    });
    return () => {
      unbind();
      window.removeEventListener('pointerdown', wake);
      window.removeEventListener('keydown', wake);
    };
  }, []);

  return (
    <div ref={wrap} className="stage">
      <Canvas
        key={quality}
        flat
        shadows={quality !== 'low'}
        dpr={[1, TIERS[quality].dpr]}
        camera={{ fov: 46, near: 0.1, far: 2400, position: [0, 305.5, 40] }}
        gl={{ antialias: quality !== 'low', powerPreference: 'high-performance' }}
      >
        <Scene quality={quality} boot={boot} />
      </Canvas>
    </div>
  );
}
