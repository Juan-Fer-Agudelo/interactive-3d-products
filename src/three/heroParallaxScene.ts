import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import {
  applyProductFinish,
  buildProductModel,
  disposeObject3D,
  setProductExplodeFactor,
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

export class HeroParallaxScene {
  private container: HTMLElement;
  private isSoftwareGl: boolean;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private textures: StudioTextures;
  private envRT: THREE.WebGLRenderTarget;

  private heroGroup: THREE.Group;
  private keyLight!: THREE.DirectionalLight;
  private rimLight!: THREE.DirectionalLight;

  private scrollProgress = 0;
  private pointerX = 0;
  private pointerY = 0;
  private smoothPointerX = 0;
  private smoothPointerY = 0;

  private renderBusy = false;
  private renderDirty = false;
  private frameId = 0;
  private lastTime = performance.now();
  private disposed = false;

  private resizeObserver: ResizeObserver;
  private onContextLostCallback?: (lost: boolean) => void;

  constructor(
    container: HTMLElement,
    onContextLost?: (lost: boolean) => void,
  ) {
    this.container = container;
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
    this.renderer.toneMappingExposure = 1.15;
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
    this.scene.fog = new THREE.FogExp2(0x08080a, 0.06);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const roomEnv = new RoomEnvironment();
    this.envRT = pmrem.fromScene(roomEnv, 0.04);
    this.scene.environment = this.envRT.texture;
    roomEnv.dispose();
    pmrem.dispose();

    this.camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 40);
    this.camera.position.set(0, 0.05, 3.35);

    const maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy();
    this.textures = createStudioTextures(maxAnisotropy);

    this.setupLighting();

    // Build floating flagship Chronograph S-04 for dramatic scroll-scrubbed explosion
    this.heroGroup = buildProductModel(
      'chronograph-watch',
      this.textures,
      this.isSoftwareGl,
      { floating: true },
    );
    applyProductFinish(this.heroGroup, 'obsidiana');
    this.heroGroup.scale.setScalar(1.18);
    this.scene.add(this.heroGroup);

    // Subtle floating architectural orbit ring around the watch
    const ringGeo = new THREE.TorusGeometry(1.38, 0.004, 12, 96);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xd4a853,
      roughness: 0.3,
      metalness: 0.9,
      transparent: true,
      opacity: 0.38,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI * 0.42;
    ringMesh.rotation.y = 0.25;
    ringMesh.userData.isAmbientRing = true;
    this.scene.add(ringMesh);

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(container);

    this.applyScrollTransform(0);
    this.requestRender();
  }

  private setupLighting(): void {
    this.keyLight = new THREE.DirectionalLight(0xfff1dc, 2.35);
    this.keyLight.position.set(2.8, 3.6, 3.2);
    this.scene.add(this.keyLight);

    const hemi = new THREE.HemisphereLight(0xb8c7e0, 0x16161a, 0.72);
    this.scene.add(hemi);

    this.rimLight = new THREE.DirectionalLight(0xd4a853, 1.55);
    this.rimLight.position.set(-3.0, 1.8, -2.8);
    this.scene.add(this.rimLight);

    if (!this.isSoftwareGl) {
      RectAreaLightUniformsLib.init();
      const softbox = new THREE.RectAreaLight(0xfff6ea, 3.0, 2.5, 3.0);
      softbox.position.set(-3.2, 1.6, 2.2);
      softbox.lookAt(0, 0, 0);
      this.scene.add(softbox);
    }
  }

  public setScrollProgress(progress: number): void {
    this.scrollProgress = THREE.MathUtils.clamp(progress, 0, 1);
    this.requestRender();
  }

  public setPointerOffset(nx: number, ny: number): void {
    this.pointerX = THREE.MathUtils.clamp(nx, -1, 1);
    this.pointerY = THREE.MathUtils.clamp(ny, -1, 1);
    this.requestRender();
  }

  private applyScrollTransform(p: number): void {
    // 3-Beat Scroll Parallax Choreography:
    // 0.0 -> 0.45: Watch rotates from subtle side angle to front-3/4 macro & zooms in
    // 0.45 -> 1.0: Watch tilts into profile & smoothly explodes along Z depth axis

    const rotY = -0.52 + p * Math.PI * 1.15 + this.smoothPointerX * 0.16;
    const rotX = 0.16 - Math.sin(p * Math.PI) * 0.28 + this.smoothPointerY * 0.1;
    const rotZ = Math.sin(p * Math.PI * 1.2) * 0.14;

    this.heroGroup.rotation.set(rotX, rotY, rotZ);

    // Subtle vertical & horizontal parallax drift across the 3 beats
    const shiftX = Math.sin(p * Math.PI) * 0.24;
    const shiftY = (0.5 - p) * 0.18;
    this.heroGroup.position.set(shiftX, shiftY, 0);

    // Progressive explosion ramping between 38% and 95% scroll
    const explodeFactor = THREE.MathUtils.smoothstep(p, 0.38, 0.94) * 0.92;
    setProductExplodeFactor(this.heroGroup, explodeFactor);

    // Camera parallax dolly (closer in Beat 2, wider in Beat 3 for exploded parts)
    const dollyZ =
      3.35 - Math.sin(p * Math.PI) * 0.65 + THREE.MathUtils.smoothstep(p, 0.6, 1.0) * 0.4;
    this.camera.position.set(
      this.smoothPointerX * 0.12,
      0.05 - this.smoothPointerY * 0.08,
      dollyZ,
    );
    this.camera.lookAt(shiftX * 0.35, shiftY * 0.35, 0);

    // Sweep studio key & rim light subtly with scroll
    this.keyLight.position.x = 2.8 - p * 4.2;
    this.rimLight.position.z = -2.8 + p * 2.2;

    // Rotate ambient architectural ring
    this.scene.traverse((obj) => {
      if (obj.userData.isAmbientRing) {
        obj.rotation.z = p * Math.PI * 0.75;
        obj.rotation.y = 0.25 + p * 0.6;
      }
    });
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

      let needsMore = false;
      if (!this.isSoftwareGl) {
        const dx = Math.abs(this.smoothPointerX - this.pointerX);
        const dy = Math.abs(this.smoothPointerY - this.pointerY);
        if (dx > 0.002 || dy > 0.002) {
          this.smoothPointerX = THREE.MathUtils.damp(
            this.smoothPointerX,
            this.pointerX,
            7,
            dt,
          );
          this.smoothPointerY = THREE.MathUtils.damp(
            this.smoothPointerY,
            this.pointerY,
            7,
            dt,
          );
          needsMore = true;
        }
      } else {
        this.smoothPointerX = this.pointerX;
        this.smoothPointerY = this.pointerY;
      }

      this.applyScrollTransform(this.scrollProgress);
      this.renderer.render(this.scene, this.camera);

      const done = () => {
        this.renderBusy = false;
        if (this.disposed) return;
        if (this.renderDirty || needsMore) {
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

    disposeObject3D(this.scene);
    this.textures.dispose();
    this.envRT.dispose();
    this.renderer.dispose();
    if (canvas.parentElement === this.container) {
      this.container.removeChild(canvas);
    }
  }
}
