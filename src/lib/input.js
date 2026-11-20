// Keyboard, mouse and touch, reduced to what the character needs each frame.
export const input = {
  keys: new Set(),
  stick: { x: 0, y: 0, active: false },
  look: { dx: 0, dy: 0 },
  jump: false,
  dragged: 0, // pixels moved during the current press, to tell a click from a drag
};

const MOVE = { forward: ['w', 'arrowup'], back: ['s', 'arrowdown'], left: ['a', 'arrowleft'], right: ['d', 'arrowright'] };
export const held = (name) => MOVE[name].some((k) => input.keys.has(k));
export const running = () => input.keys.has('shift') || Math.hypot(input.stick.x, input.stick.y) > 0.86;

export function bindInput(target, handlers) {
  const typing = (e) => /input|textarea|select/i.test(e.target?.tagName ?? '');
  const onKeyDown = (e) => {
    if (typing(e) || e.metaKey || e.ctrlKey) return;
    const k = e.key.toLowerCase();
    if (k === ' ') { input.jump = true; e.preventDefault(); }
    if (k.startsWith('arrow')) e.preventDefault();
    if (!e.repeat) {
      if (k === 'e' || k === 'enter') handlers.interact();
      if (k === 'g') handlers.menu();
      if (k === 'escape') handlers.escape();
      if (k === 'c') handlers.view();
    }
    input.keys.add(k);
  };
  const onKeyUp = (e) => input.keys.delete(e.key.toLowerCase());
  const onBlur = () => { input.keys.clear(); input.stick.x = input.stick.y = 0; };

  // Pointers: on touch screens the left half is a stick and the right half looks around.
  const pointers = new Map();
  const onDown = (e) => {
    const touch = e.pointerType === 'touch';
    const role = touch && e.clientX < window.innerWidth / 2 ? 'stick' : 'look';
    pointers.set(e.pointerId, { role, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY });
    input.dragged = 0;
    if (role === 'stick') input.stick.active = true;
    target.setPointerCapture?.(e.pointerId);
  };
  const onMove = (e) => {
    const p = pointers.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX;
    p.y = e.clientY;
    input.dragged += Math.abs(dx) + Math.abs(dy);
    if (p.role === 'look') {
      input.look.dx += dx;
      input.look.dy += dy;
    } else {
      const sx = (p.x - p.x0) / 60, sy = (p.y - p.y0) / 60;
      const len = Math.hypot(sx, sy) || 1;
      const k = Math.min(1, len) / len;
      input.stick.x = sx * k;
      input.stick.y = sy * k;
    }
  };
  const onUp = (e) => {
    const p = pointers.get(e.pointerId);
    if (!p) return;
    pointers.delete(e.pointerId);
    if (p.role === 'stick') { input.stick.x = input.stick.y = 0; input.stick.active = false; }
    else if (input.dragged < 8) handlers.interact();
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  target.addEventListener('pointerdown', onDown);
  target.addEventListener('pointermove', onMove);
  target.addEventListener('pointerup', onUp);
  target.addEventListener('pointercancel', onUp);
  return () => {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('blur', onBlur);
    target.removeEventListener('pointerdown', onDown);
    target.removeEventListener('pointermove', onMove);
    target.removeEventListener('pointerup', onUp);
    target.removeEventListener('pointercancel', onUp);
  };
}
