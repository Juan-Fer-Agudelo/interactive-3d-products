import * as THREE from 'three';
import gsap from 'gsap';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import type { FinishId, ProductModelId } from '../data/products';
import {
  applyProductFinish,
  buildProductModel,
  disposeObject3D,
  setProductExplodeFactor,
} from './productModels';
import { createStudioTextures, type StudioTextures } from './textures';

export type CameraPreset = 'frontal' | 'detalle' | 'cenital';

const CAMERA_PRESETS: Record<
  CameraPreset,
  { pos: [number, number, number]; target: [number, number, number] }
> = {
  frontal: { pos: [2.25, 1.52, 2.75], target: [0, 0.72, 0] },
  detalle: { pos: [1.18, 1.12, 1.48], target: [0, 0.85, 0] },
  cenital: { pos: [0.05, 3.15, 1.35], target: [0, 0.62, 0] },
};

// Module-scope reusable math helpers (zero GC inside render loop)
const _targetCamPos = new THREE.Vector3();
const _targetLookAt = new THREE.Vector3();

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

export class StudioExhibitionScene {
  private container: HTMLElement;
  private isSoftwareGl: boolean;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private textures: StudioTextures;
  private envRT: THREE.WebGLRenderTarget;

  private productPivot: THREE.Group;
  private currentProductGroup: THREE.Group | null = null;
  private currentModelId: ProductModelId;
  private currentFinishId: FinishId;

  private explodeCurrent = 0;
  private explodeTarget = 0;
  private cameraTransitionActive = false;
  private autoRotateEnabled = true;

  private renderBusy = false;
  private renderDirty = false;
  private frameId = 0;
  private lastTime = performance.now();
  private disposed = false;

  private resizeObserver: ResizeObserver;
  private onContextLostCallback?: (lost: boolean) => void;

  constructor(
    container: HTMLElement,
    initialModel: ProductModelId,
    initialFinish: FinishId,
    onContextLost?: (lost: boolean) => void,
  ) {
    this.container = container;
    this.currentModelId = initialModel;
    this.currentFinishId = initialFinish;
    this.onContextLostCallback = onContextLost;
    this.isSoftwareGl = detectSoftwareWebGL();

    const width = Math.max(container.clientWidth, 320);
    const height = Math.max(container.clientHeight, 320);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2),
    );
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const canvas = this.renderer.domElement;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.appendChild(canvas);

    canvas.addEventListener('webglcontextlost', this.handleContextLost);
    canvas.addEventListener('webglcontextrestored', this.handleContextRestored);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x08080a);
    this.scene.fog = new THREE.FogExp2(0x08080a, 0.085);

    // Mandatory Studio Environment Map via RoomEnvironment on every device
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const roomEnv = new RoomEnvironment();
    this.envRT = pmrem.fromScene(roomEnv, 0.04);
    this.scene.environment = this.envRT.texture;
    roomEnv.dispose();
    pmrem.dispose();

    this.camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 40);
    this.camera.position.set(...CAMERA_PRESETS.frontal.pos);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.target.set(...CAMERA_PRESETS.frontal.target);
    this.controls.enableDamping = !this.isSoftwareGl;
    this.controls.dampingFactor = 0.06;
    this.controls.enablePan = false;
    this.controls.minDistance = 1.35;
    this.controls.maxDistance = 5.2;
    this.controls.minPolarAngle = 0.25;
    this.controls.maxPolarAngle = Math.PI * 0.49;
    this.controls.autoRotate = !this.isSoftwareGl && this.autoRotateEnabled;
    this.controls.autoRotateSpeed = 0.75;

    this.controls.addEventListener('start', () => {
      this.cameraTransitionActive = false;
    });
    this.controls.addEventListener('change', () => {
      this.requestRender();
    });

    const maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy();
    this.textures = createStudioTextures(maxAnisotropy);

    this.setupLighting();
    this.setupPedestal();

    this.productPivot = new THREE.Group();
    this.scene.add(this.productPivot);

    this.mountProduct(initialModel, initialFinish, false);

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(container);

    this.requestRender();
  }

  private setupLighting(): void {
    // 1. Warm Directional Key Light with tight shadow frustum
    const keyLight = new THREE.DirectionalLight(0xfff1dc, 2.2);
    keyLight.position.set(3.2, 4.6, 2.8);
    keyLight.castShadow = !this.isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 12;
    keyLight.shadow.camera.left = -2.2;
    keyLight.shadow.camera.right = 2.2;
    keyLight.shadow.camera.top = 2.2;
    keyLight.shadow.camera.bottom = -2.2;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    this.scene.add(keyLight);

    // 2. Cool Hemisphere Fill Light
    const hemi = new THREE.HemisphereLight(0xb8c7e0, 0x16161a, 0.7);
    this.scene.add(hemi);

    // 3. Rim Backlight for sharp obsidian silhouette separation
    const rimLight = new THREE.DirectionalLight(0xe2e8f0, 1.45);
    rimLight.position.set(-2.8, 2.6, -3.2);
    this.scene.add(rimLight);

    // 4. Studio softbox panels (skip on software WebGL)
    if (!this.isSoftwareGl) {
      RectAreaLightUniformsLib.init();
      const leftSoftbox = new THREE.RectAreaLight(0xfff6ea, 3.2, 2.4, 3.0);
      leftSoftbox.position.set(-3.4, 2.0, 1.8);
      leftSoftbox.lookAt(0, 0.8, 0);
      this.scene.add(leftSoftbox);

      const topSoftbox = new THREE.RectAreaLight(0xeef2ff, 2.0, 2.8, 2.2);
      topSoftbox.position.set(0, 4.2, -0.5);
      topSoftbox.lookAt(0, 0.6, 0);
      this.scene.add(topSoftbox);
    }
  }

  private setupPedestal(): void {
    // Chamfered obsidian display plinth below y = 0
    const plinthProfile = [
      new THREE.Vector2(0, -0.6),
      new THREE.Vector2(1.45, -0.6),
      new THREE.Vector2(1.45, -0.04),
      new THREE.Vector2(1.41, 0),
      new THREE.Vector2(0, 0),
    ];
    const plinthGeo = new THREE.LatheGeometry(plinthProfile, 72);
    const plinthMat = new THREE.MeshStandardMaterial({
      color: 0x0f1014,
      roughness: 0.72,
      metalness: 0.2,
    });
    const plinth = new THREE.Mesh(plinthGeo, plinthMat);
    plinth.receiveShadow = true;
    this.scene.add(plinth);

    // Subtle brass hairline inlay ring on plinth perimeter
    const inlayGeo = new THREE.TorusGeometry(1.38, 0.004, 12, 72);
    inlayGeo.rotateX(Math.PI / 2);
    const inlayMat = new THREE.MeshStandardMaterial({
      color: 0xd4a853,
      roughness: 0.28,
      metalness: 0.9,
    });
    const inlay = new THREE.Mesh(inlayGeo, inlayMat);
    inlay.position.y = 0.002;
    this.scene.add(inlay);

    // Soft radial contact shadow plane at y = 0.003
    const shadowGeo = new THREE.PlaneGeometry(2.2, 2.2);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: this.textures.contactShadow,
      transparent: true,
      depthWrite: false,
      opacity: 0.55,
    });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.position.y = 0.003;
    this.scene.add(shadowPlane);

    // Distant studio floor plane
    const floorGeo = new THREE.CircleGeometry(14, 64);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x08080a,
      roughness: 0.92,
      metalness: 0.05,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.6;
    floor.receiveShadow = true;
    this.scene.add(floor);
  }

  private mountProduct(
    modelId: ProductModelId,
    finishId: FinishId,
    animateWithGsap: boolean,
  ): void {
    const nextGroup = buildProductModel(modelId, this.textures, this.isSoftwareGl);
    applyProductFinish(nextGroup, finishId);
    setProductExplodeFactor(nextGroup, this.explodeCurrent);

    if (this.currentProductGroup) {
      const oldGroup = this.currentProductGroup;
      this.productPivot.remove(oldGroup);
      disposeObject3D(oldGroup);
    }

    this.currentProductGroup = nextGroup;
    this.productPivot.add(nextGroup);

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (animateWithGsap && !prefersReducedMotion && !this.isSoftwareGl) {
      nextGroup.scale.setScalar(0.88);
      nextGroup.rotation.y = -0.35;
      gsap.to(nextGroup.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.55,
        ease: 'power3.out',
        onUpdate: () => this.requestRender(),
      });
      gsap.to(nextGroup.rotation, {
        y: 0,
        duration: 0.65,
        ease: 'power3.out',
        onUpdate: () => this.requestRender(),
      });
    } else {
      this.requestRender();
    }
  }

  public setProduct(modelId: ProductModelId): void {
    if (modelId === this.currentModelId) return;
    this.currentModelId = modelId;
    this.mountProduct(modelId, this.currentFinishId, true);
  }

  public setFinish(finishId: FinishId): void {
    this.currentFinishId = finishId;
    if (this.currentProductGroup) {
      applyProductFinish(this.currentProductGroup, finishId);
      this.requestRender();
    }
  }

  public setExplode(factor: number): void {
    this.explodeTarget = THREE.MathUtils.clamp(factor, 0, 1);
    this.requestRender();
  }

  public setCameraPreset(preset: CameraPreset): void {
    const cfg = CAMERA_PRESETS[preset];
    _targetCamPos.set(...cfg.pos);
    _targetLookAt.set(...cfg.target);
    this.cameraTransitionActive = true;
    this.requestRender();
  }

  public setAutoRotate(enabled: boolean): void {
    this.autoRotateEnabled = enabled;
    this.controls.autoRotate = !this.isSoftwareGl && enabled;
    this.requestRender();
  }

  private handleResize(): void {
    if (this.disposed) return;
    const width = Math.max(this.container.clientWidth, 320);
    const height = Math.max(this.container.clientHeight, 320);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.requestRender();
  }

  private handleContextLost = (e: Event): void => {
    e.preventDefault();
    this.onContextLostCallback?.(true);
  };

  private handleContextRestored = (): void => {
    this.onContextLostCallback?.(false);
    this.requestRender();
  };

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (!gl || typeof gl.fenceSync !== 'function') {
      this.frameId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  public requestRender(): void {
    if (this.disposed) return;
    if (this.renderBusy) {
      this.renderDirty = true;
      return;
    }
    this.renderBusy = true;
    this.frameId = requestAnimationFrame((now) => {
      if (this.disposed) return;
      this.renderDirty = false;
      const dt = Math.min((now - this.lastTime) / 1000, 0.1);
      this.lastTime = now;

      let needsMoreFrames = false;

      // Smooth exponential damping for exploded-view separation
      if (Math.abs(this.explodeCurrent - this.explodeTarget) > 0.002) {
        this.explodeCurrent = this.isSoftwareGl
          ? this.explodeTarget
          : THREE.MathUtils.damp(this.explodeCurrent, this.explodeTarget, 8, dt);
        if (this.currentProductGroup) {
          setProductExplodeFactor(this.currentProductGroup, this.explodeCurrent);
        }
        if (Math.abs(this.explodeCurrent - this.explodeTarget) > 0.002) {
          needsMoreFrames = true;
        }
      }

      // Smooth camera preset glide
      if (this.cameraTransitionActive) {
        if (this.isSoftwareGl) {
          this.camera.position.copy(_targetCamPos);
          this.controls.target.copy(_targetLookAt);
          this.cameraTransitionActive = false;
        } else {
          const lambda = 6.5;
          this.camera.position.x = THREE.MathUtils.damp(
            this.camera.position.x,
            _targetCamPos.x,
            lambda,
            dt,
          );
          this.camera.position.y = THREE.MathUtils.damp(
            this.camera.position.y,
            _targetCamPos.y,
            lambda,
            dt,
          );
          this.camera.position.z = THREE.MathUtils.damp(
            this.camera.position.z,
            _targetCamPos.z,
            lambda,
            dt,
          );
          this.controls.target.x = THREE.MathUtils.damp(
            this.controls.target.x,
            _targetLookAt.x,
            lambda,
            dt,
          );
          this.controls.target.y = THREE.MathUtils.damp(
            this.controls.target.y,
            _targetLookAt.y,
            lambda,
            dt,
          );
          this.controls.target.z = THREE.MathUtils.damp(
            this.controls.target.z,
            _targetLookAt.z,
            lambda,
            dt,
          );

          const dist =
            this.camera.position.distanceTo(_targetCamPos) +
            this.controls.target.distanceTo(_targetLookAt);
          if (dist < 0.015) {
            this.camera.position.copy(_targetCamPos);
            this.controls.target.copy(_targetLookAt);
            this.cameraTransitionActive = false;
          } else {
            needsMoreFrames = true;
          }
        }
      }

      const controlsChanged = this.controls.update();
      if (controlsChanged || this.controls.autoRotate) {
        needsMoreFrames = true;
      }

      this.renderer.render(this.scene, this.camera);

      const done = () => {
        this.renderBusy = false;
        if (this.disposed) return;
        if (this.renderDirty || needsMoreFrames) {
          this.requestRender();
        }
      };

      if (this.isSoftwareGl) {
        this.afterDraw(done);
      } else {
        done();
      }
    });
  }

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    this.resizeObserver.disconnect();

    const canvas = this.renderer.domElement;
    canvas.removeEventListener('webglcontextlost', this.handleContextLost);
    canvas.removeEventListener('webglcontextrestored', this.handleContextRestored);

    this.controls.dispose();
    if (this.currentProductGroup) {
      disposeObject3D(this.currentProductGroup);
    }
    disposeObject3D(this.scene);
    this.textures.dispose();
    this.envRT.dispose();
    this.renderer.dispose();
    if (canvas.parentElement === this.container) {
      this.container.removeChild(canvas);
    }
  }
}
