// What the buttons, the keys and the scene itself can ask for.
import gsap from 'gsap';
import { store } from './store';
import { audio } from './lib/audio';
import { U } from './world/shared';

export const opening = { skip: null }; // set by the opening while it plays

export function interact() {
  const s = store.get();
  if (s.phase !== 'meadow' || s.panel || s.menu || !s.near) return;
  audio.pop();
  const id = s.near.id;
  if (id === 'fire') return setNight(!s.night);
  if (id.startsWith('project:')) return store.set({ panel: { type: 'project', id: Number(id.split(':')[1]) } });
  store.set({ panel: { type: id } });
}

export function escape() {
  const s = store.get();
  if (s.phase === 'opening') return opening.skip?.();
  if (s.panel || s.menu || s.help || s.credits) return store.set({ panel: null, menu: false, help: false, credits: false });
  if (s.following) store.set({ following: null });
}

export function toggleMenu() {
  const s = store.get();
  if (s.phase !== 'meadow') return;
  audio.pop();
  store.set({ menu: !s.menu, panel: null, help: false, credits: false });
}

export function openPanel(panel) {
  audio.pop();
  store.set({ panel, menu: false, help: false, credits: false });
}

export function goTo(placeId) {
  audio.pop();
  store.set({ following: placeId, menu: false, panel: null });
}

export function setRain(rain) {
  audio.pop();
  store.set({ rain });
  gsap.to(U.uRain, { value: rain ? 1 : 0, duration: 2.2, ease: 'sine.inOut' });
}

export function setNight(night) {
  if (night) audio.chime();
  store.set({ night });
  gsap.to(U.uNight, { value: night ? 1 : 0, duration: 3.2, ease: 'sine.inOut' });
}

export function setView(view) {
  audio.pop();
  store.set({ view });
}

export function setSound(sound) {
  store.set({ sound });
  audio.setOn(sound);
  if (sound) audio.pop();
}

export function cycleQuality() {
  const order = ['high', 'medium', 'low'];
  const quality = order[(order.indexOf(store.get().quality) + 1) % order.length];
  try { localStorage.setItem('pradera-calidad', quality); } catch { /* not saved, still applied */ }
  audio.pop();
  store.set({ quality });
}
