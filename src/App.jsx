import { lazy, Suspense, useEffect, useState } from 'react';
import { store, useStore, defaultQuality } from './store';
import { buildGround } from './world/scenery';
import { obstacles } from './world/layout';
import { live, FONT, U } from './world/shared';
import { heightAt } from './world/terrain';
import { createPhysics } from './lib/physics';
import Hud from './ui/Hud';
import Loader from './ui/Loader';
import Panels from './ui/Panels';
import Flat from './ui/Flat';

// A handle for poking at the meadow from the console while developing.
if (import.meta.env.DEV) window.__pradera = { live, store, U };

const Experience = lazy(() => import('./world/Experience'));

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

const step = (progress, phrase) => new Promise((resolve) => {
  store.set({ progress, phrase });
  requestAnimationFrame(() => setTimeout(resolve, 60));
});

async function prepare() {
  await step(0.08, 'preparando el terreno…');
  // The signs are drawn on canvases, so the typeface has to be there first.
  await Promise.race([
    Promise.all([document.fonts.load(`900 40px ${FONT}`), document.fonts.load(`600 40px ${FONT}`)]),
    new Promise((r) => setTimeout(r, 2500)),
  ]);
  await step(0.3, 'sembrando el pasto…');
  const ground = buildGround();
  await step(0.5, 'alisando el camino…');
  let physics = null;
  try {
    const p = live.player;
    physics = await createPhysics(ground, obstacles, { x: p.x, y: heightAt(p.x, p.z), z: p.z });
  } catch (error) {
    console.warn('Sin motor de física: el personaje camina sobre el terreno sin chocar.', error);
  }
  await step(0.78, 'encendiendo la fogata…');
  return { ground, physics };
}

export default function App() {
  const phase = useStore((s) => s.phase);
  const [boot, setBoot] = useState(null);

  useEffect(() => {
    if (new URLSearchParams(location.search).has('plano') || !hasWebGL()) {
      store.set({ phase: 'flat' });
      return;
    }
    store.set({ quality: defaultQuality() });
    let alive = true;
    prepare().then((b) => alive && setBoot(b)).catch((error) => {
      console.error(error);
      store.set({ phase: 'flat' });
    });
    return () => { alive = false; };
  }, []);

  if (phase === 'flat') return <Flat />;

  return (
    <>
      {boot && (
        <Suspense fallback={null}>
          <Experience boot={boot} />
        </Suspense>
      )}
      <div id="veil" />
      <Loader />
      <Hud />
      <Panels />
    </>
  );
}
