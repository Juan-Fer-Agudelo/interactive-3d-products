import * as THREE from 'three';

export interface StudioTextures {
  dial: THREE.CanvasTexture;
  speakerMesh: THREE.CanvasTexture;
  brushedRoughness: THREE.CanvasTexture;
  contactShadow: THREE.CanvasTexture;
  dispose: () => void;
}

function createDialTexture(anisotropy: number): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.48;

  // Matte obsidian dial face with subtle radial vignette
  const grad = ctx.createRadialGradient(cx, cy, radius * 0.1, cx, cy, radius);
  grad.addColorStop(0, '#16171c');
  grad.addColorStop(0.75, '#0e0f13');
  grad.addColorStop(1, '#08080b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Outer minute track
  for (let i = 0; i < 60; i++) {
    const angle = (i / 60) * Math.PI * 2 - Math.PI / 2;
    const isMajor = i % 5 === 0;
    const innerR = isMajor ? radius * 0.81 : radius * 0.88;
    const outerR = radius * 0.93;

    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
    ctx.lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
    ctx.strokeStyle = isMajor ? '#d4a853' : 'rgba(244, 244, 245, 0.35)';
    ctx.lineWidth = isMajor ? 7 : 2.5;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  // Dual recessed chronograph subdials (top-right and bottom-left balanced at 3 & 9 or 12 & 6)
  const drawSubdial = (sx: number, sy: number, sr: number, label: string) => {
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fillStyle = '#090a0d';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(212, 168, 83, 0.32)';
    ctx.stroke();

    for (let j = 0; j < 12; j++) {
      const a = (j / 12) * Math.PI * 2 - Math.PI / 2;
      const r1 = j % 3 === 0 ? sr * 0.72 : sr * 0.82;
      const r2 = sr * 0.92;
      ctx.beginPath();
      ctx.moveTo(sx + Math.cos(a) * r1, sy + Math.sin(a) * r1);
      ctx.lineTo(sx + Math.cos(a) * r2, sy + Math.sin(a) * r2);
      ctx.strokeStyle = j % 3 === 0 ? '#e4e4e7' : 'rgba(228, 228, 231, 0.4)';
      ctx.lineWidth = j % 3 === 0 ? 3 : 1.5;
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(212, 168, 83, 0.75)';
    ctx.font = '600 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, sx, sy + sr * 0.45);
  };

  drawSubdial(cx - radius * 0.42, cy, radius * 0.24, '60');
  drawSubdial(cx + radius * 0.42, cy, radius * 0.24, '30');

  // Subtle brand mark
  ctx.fillStyle = '#e4e4e7';
  ctx.font = '600 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('KRONO', cx, cy - radius * 0.34);

  ctx.fillStyle = 'rgba(161, 161, 170, 0.8)';
  ctx.font = '500 16px sans-serif';
  ctx.fillText('CRONÓGRAFO', cx, cy + radius * 0.42);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = anisotropy;
  texture.needsUpdate = true;
  return texture;
}

function createSpeakerMeshTexture(anisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#111215';
  ctx.fillRect(0, 0, size, size);

  const step = 16;
  for (let y = 0; y < size; y += step) {
    for (let x = 0; x < size; x += step) {
      const offset = (y / step) % 2 === 0 ? 0 : step / 2;
      ctx.fillStyle = '#22242a';
      ctx.beginPath();
      ctx.arc((x + offset) % size, y + step / 2, 3.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.arc((x + offset + 1) % size, y + step / 2 + 1, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  texture.anisotropy = anisotropy;
  texture.needsUpdate = true;
  return texture;
}

function createBrushedRoughnessTexture(anisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#909090';
  ctx.fillRect(0, 0, size, size);

  for (let y = 0; y < size; y++) {
    const shade = 115 + Math.floor(Math.sin(y * 1.7) * 20 + (y % 3) * 8);
    ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
    ctx.fillRect(0, y, size, 1);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.NoColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  texture.anisotropy = anisotropy;
  texture.needsUpdate = true;
  return texture;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const cx = size / 2;
  const cy = size / 2;
  const grad = ctx.createRadialGradient(cx, cy, 8, cx, cy, size * 0.48);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
  grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.35)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

export function createStudioTextures(anisotropy: number): StudioTextures {
  const dial = createDialTexture(anisotropy);
  const speakerMesh = createSpeakerMeshTexture(anisotropy);
  const brushedRoughness = createBrushedRoughnessTexture(anisotropy);
  const contactShadow = createContactShadowTexture();

  return {
    dial,
    speakerMesh,
    brushedRoughness,
    contactShadow,
    dispose: () => {
      dial.dispose();
      speakerMesh.dispose();
      brushedRoughness.dispose();
      contactShadow.dispose();
    },
  };
}
