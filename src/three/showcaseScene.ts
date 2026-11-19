import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { ProductModelId } from '../data/products';
import {
  applyProductFinish,
  buildProductModel,
  disposeObject3D,
} from './productModels';
import { createStudioTextures, type StudioTextures } from './textures';

function detectSoftwareWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

/** Size (in scene units) every product is normalized to so each one fills the frame alike. */
const TARGET_SIZE = 1.5;

/** Soft radial falloff used by the accent halo so it has no hard edge. */
function createHaloTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.45, 'rgba(255,255,255,0.35)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Per-product presentation tweaks applied after the generic bounding-box normalization. */
const PRESENTATION: Record<
  ProductModelId,
  { tiltX: number; baseRotY: number; yOffset: number }
> = {
  'monolith-lamp': { tiltX: 0.08, baseRotY: -0.55, yOffset: 0 },
  'chronograph-watch': { tiltX: 0.32, baseRotY: -0.35, yOffset: 0.02 },
  'acoustic-speaker': { tiltX: 0.12, baseRotY: -0.4, yOffset: 0 },
  'ceramic-vessel': { tiltX: 0.1, baseRotY: -0.3, yOffset: 0 },
};

const _box = new THREE.Box3();
const _size = new THREE.Vector3();
const _center = new THREE.Vector3();

interface Slot {
  wrapper: THREE.Group;
  model: THREE.Group;
}

/**
 * Showcase scene: one product at a time, floating in a studio void on the left half
 * of a pinned panel. Products cross-dissolve (slide + scale) when the active panel
 * changes, idle-rotate while the section is on screen, and follow the pointer subtly.
 */
export class ShowcaseScene {
  private container: HTMLElement;
  private isSoftwareGl: boolean;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private textures: StudioTextures;
  private envRT: THREE.WebGLRenderTarget;

  private keyLight: THREE.DirectionalLight;
  private rimLight: THREE.DirectionalLight;
  private accentLight: THREE.PointLight;
  private halo: THREE.Mesh;

  private slots = new Map<ProductModelId, Slot>();
  private activeId: ProductModelId;
  private outgoingId: ProductModelId | null = null;
  private transition = 1; // 0 -> 1 while switching products
  private idleAngle = 0;
  private running = false;

  private pointerX = 0;
  private pointerY = 0;
  private smoothPointerX = 0;
  private smoothPointerY = 0;

  private frameId = 0;
  private lastTime = performance.now();
  private disposed = false;
  private resizeObserver: ResizeObserver;
  private onContextLostCallback?: (lost: boolean) => void;

  constructor(
    container: HTMLElement,
    initialModel: ProductModelId,
    onContextLost?: (lost: boolean) => void,
  ) {
    this.container = container;
    this.activeId = initialModel;
    this.onContextLostCallback = onContextLost;
    this.isSoftwareGl = detectSoftwareWebGL();

    const width = Math.max(container.clientWidth, 320);
    const height = Math.max(container.clientHeight, 320);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2),
    );
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = false;

    const canvas = this.renderer.domElement;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.appendChild(canvas);

    canvas.addEventListener('webglcontextlost', this.handleContextLost);
    canvas.addEventListener('webglcontextrestored', this.handleContextRestored);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x08080a, 0.05);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const roomEnv = new RoomEnvironment();
    this.envRT = pmrem.fromScene(roomEnv, 0.04);
    this.scene.environment = this.envRT.texture;
    roomEnv.dispose();
    pmrem.dispose();

    this.camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 40);
    this.camera.position.set(0, 0.1, 3.6);
    this.camera.lookAt(0, 0, 0);

    const maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy();
    this.textures = createStudioTextures(maxAnisotropy);

    // Lighting: warm key, cool fill, accent rim that is re-tinted per product
    this.keyLight = new THREE.DirectionalLight(0xfff1dc, 2.2);
    this.keyLight.position.set(2.6, 3.2, 3.0);
    this.scene.add(this.keyLight);

    const hemi = new THREE.HemisphereLight(0xb8c7e0, 0x16161a, 0.7);
    this.scene.add(hemi);

    this.rimLight = new THREE.DirectionalLight(0xd4a853, 1.4);
    this.rimLight.position.set(-3.0, 1.6, -2.6);
    this.scene.add(this.rimLight);

    this.accentLight = new THREE.PointLight(0xd4a853, 6, 6, 2);
    this.accentLight.position.set(-1.6, -0.6, 1.4);
    this.scene.add(this.accentLight);

    // Soft accent halo disc behind the product (tinted per product)
    const haloGeo = new THREE.PlaneGeometry(4.2, 4.2);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xd4a853,
      map: createHaloTexture(),
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
    });
    this.halo = new THREE.Mesh(haloGeo, haloMat);
    this.halo.position.z = -1.2;
    this.scene.add(this.halo);

    // Thin orbit ring for continuity with the hero
    const ringGeo = new THREE.TorusGeometry(1.32, 0.0035, 10, 96);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xd4a853,
      roughness: 0.3,
      metalness: 0.9,
      transparent: true,
      opacity: 0.3,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI * 0.46;
    ring.userData.isRing = true;
    this.scene.add(ring);

    this.ensureSlot(initialModel);
    this.layoutSlots();

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(container);

    this.renderOnce();
  }

  /** Build (once) and cache the normalized model for a product. */
  private ensureSlot(id: ProductModelId): Slot {
    const existing = this.slots.get(id);
    if (existing) return existing;

    const model = buildProductModel(id, this.textures, this.isSoftwareGl, {
      floating: id === 'chronograph-watch',
    });
    applyProductFinish(model, 'obsidiana');
    model.traverse((obj) => {
      obj.castShadow = false;
      obj.receiveShadow = false;
    });

    // Normalize: center on origin and scale to a shared target size.
    // Done on a holder group so the builder's own transforms stay untouched.
    _box.setFromObject(model);
    _box.getSize(_size);
    _box.getCenter(_center);
    const maxDim = Math.max(_size.x, _size.y, _size.z) || 1;
    const scale = TARGET_SIZE / maxDim;
    const holder = new THREE.Group();
    holder.scale.setScalar(scale);
    holder.position.copy(_center).multiplyScalar(-scale);
    holder.add(model);

    const wrapper = new THREE.Group();
    wrapper.add(holder);
    wrapper.visible = false;
    this.scene.add(wrapper);

    const slot = { wrapper, model };
    this.slots.set(id, slot);
    return slot;
  }

  public setProduct(id: ProductModelId): void {
    if (id === this.activeId) return;
    this.ensureSlot(id);
    this.outgoingId = this.activeId;
    this.activeId = id;
    this.transition = 0;
    this.renderOnce();
  }

  public setAccentColor(hex: string): void {
    const color = new THREE.Color(hex);
    this.rimLight.color.copy(color);
    this.accentLight.color.copy(color);
    (this.halo.material as THREE.MeshBasicMaterial).color.copy(color);
    this.renderOnce();
  }

  public setPointerOffset(nx: number, ny: number): void {
    this.pointerX = THREE.MathUtils.clamp(nx, -1, 1);
    this.pointerY = THREE.MathUtils.clamp(ny, -1, 1);
    this.renderOnce();
  }

  /** Start / stop the continuous idle loop (only while the section is on screen). */
  public setRunning(running: boolean): void {
    if (running === this.running) return;
    this.running = running;
    if (running) {
      this.lastTime = performance.now();
      this.loop();
    } else {
      cancelAnimationFrame(this.frameId);
      this.frameId = 0;
    }
  }

  private layoutSlots(): void {
    const t = THREE.MathUtils.smoothstep(this.transition, 0, 1);
    const active = this.slots.get(this.activeId);
    const outgoing = this.outgoingId ? this.slots.get(this.outgoingId) : undefined;

    this.slots.forEach((slot, id) => {
      const isActive = id === this.activeId;
      const isOutgoing = id === this.outgoingId && t < 1;
      slot.wrapper.visible = isActive || isOutgoing;
    });

    if (active) {
      const cfg = PRESENTATION[this.activeId];
      const enter = 1 - t;
      active.wrapper.position.set(0, cfg.yOffset - enter * 0.9, 0);
      active.wrapper.scale.setScalar(0.82 + t * 0.18);
      active.wrapper.rotation.set(
        cfg.tiltX + this.smoothPointerY * 0.12,
        cfg.baseRotY + this.idleAngle + this.smoothPointerX * 0.22 - enter * 0.9,
        0,
      );
      this.setGroupOpacity(active.model, t);
    }

    if (outgoing && this.outgoingId) {
      const cfg = PRESENTATION[this.outgoingId];
      outgoing.wrapper.position.set(0, cfg.yOffset + t * 0.9, 0);
      outgoing.wrapper.scale.setScalar(1 - t * 0.18);
      outgoing.wrapper.rotation.set(
        cfg.tiltX,
        cfg.baseRotY + this.idleAngle + t * 0.9,
        0,
      );
      this.setGroupOpacity(outgoing.model, 1 - t);
    }

    if (t >= 1 && this.outgoingId) {
      const done = this.slots.get(this.outgoingId);
      if (done) {
        done.wrapper.visible = false;
        this.setGroupOpacity(done.model, 1);
      }
      this.outgoingId = null;
    }

    this.scene.traverse((obj) => {
      if (obj.userData.isRing) {
        obj.rotation.z = this.idleAngle * 0.6;
      }
    });

    this.camera.position.set(this.smoothPointerX * 0.1, 0.1 - this.smoothPointerY * 0.08, 3.6);
    this.camera.lookAt(0, 0, 0);
  }

  private setGroupOpacity(group: THREE.Group, opacity: number): void {
    const clamped = THREE.MathUtils.clamp(opacity, 0, 1);
    group.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((m) => {
        const mat = m as THREE.Material & { opacity: number };
        if (mat.userData.baseOpacity === undefined) {
          mat.userData.baseOpacity = mat.opacity;
          mat.userData.baseTransparent = mat.transparent;
        }
        const base = mat.userData.baseOpacity as number;
        mat.opacity = base * clamped;
        mat.transparent = clamped < 1 ? true : Boolean(mat.userData.baseTransparent);
      });
    });
  }

  private step(dt: number): void {
    if (!this.isSoftwareGl) {
      this.smoothPointerX = THREE.MathUtils.damp(this.smoothPointerX, this.pointerX, 6, dt);
      this.smoothPointerY = THREE.MathUtils.damp(this.smoothPointerY, this.pointerY, 6, dt);
    } else {
      this.smoothPointerX = this.pointerX;
      this.smoothPointerY = this.pointerY;
    }
    this.idleAngle += dt * (this.isSoftwareGl ? 0.08 : 0.22);
    if (this.transition < 1) {
      this.transition = Math.min(1, this.transition + dt / 0.75);
    }
    this.layoutSlots();
  }

  private loop = (): void => {
    if (this.disposed || !this.running) return;
    this.frameId = requestAnimationFrame((now) => {
      if (this.disposed || !this.running) return;
      const dt = Math.min((now - this.lastTime) / 1000, 0.1);
      this.lastTime = now;
      this.step(dt);
      this.renderer.render(this.scene, this.camera);
      this.loop();
    });
  };

  /** Single on-demand frame used while the idle loop is paused. */
  private renderOnce(): void {
    if (this.disposed || this.running) return;
    cancelAnimationFrame(this.frameId);
    this.frameId = requestAnimationFrame(() => {
      if (this.disposed || this.running) return;
      this.step(0.016);
      this.renderer.render(this.scene, this.camera);
      if (this.transition < 1) this.renderOnce();
    });
  }

  private handleResize(): void {
    if (this.disposed) return;
    const width = Math.max(this.container.clientWidth, 320);
    const height = Math.max(this.container.clientHeight, 320);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.renderOnce();
  }

  private handleContextLost = (e: Event): void => {
    e.preventDefault();
    this.onContextLostCallback?.(true);
  };

  private handleContextRestored = (): void => {
    this.onContextLostCallback?.(false);
    this.renderOnce();
  };

  public dispose(): void {
    this.disposed = true;
    this.running = false;
    cancelAnimationFrame(this.frameId);
    this.resizeObserver.disconnect();

    const canvas = this.renderer.domElement;
    canvas.removeEventListener('webglcontextlost', this.handleContextLost);
    canvas.removeEventListener('webglcontextrestored', this.handleContextRestored);

    disposeObject3D(this.scene);
    this.textures.dispose();
    this.envRT.dispose();
    this.renderer.dispose();
    if (canvas.parentElement === this.container) {
      this.container.removeChild(canvas);
    }
  }
}
