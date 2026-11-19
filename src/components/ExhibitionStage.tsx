import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ChevronDown, ChevronUp, RotateCw, Eye } from 'lucide-react';
import {
  FINISH_OPTIONS,
  PRODUCTS,
  type FinishId,
  type ProductItem,
  type ProductModelId,
} from '../data/products';
import {
  StudioExhibitionScene,
  type CameraPreset,
} from '../three/studioScene';

interface ExhibitionStageProps {
  activeProduct: ProductItem;
  activeFinish: FinishId;
  onSelectProduct: (id: ProductModelId) => void;
  onSelectFinish: (id: FinishId) => void;
  onOpenSpecSheet: (product: ProductItem) => void;
}

const CAMERA_LABELS: Array<{ id: CameraPreset; label: string }> = [
  { id: 'frontal', label: 'Frontal' },
  { id: 'detalle', label: 'Detalle' },
  { id: 'cenital', label: 'Cenital' },
];

export function ExhibitionStage({
  activeProduct,
  activeFinish,
  onSelectProduct,
  onSelectFinish,
  onOpenSpecSheet,
}: ExhibitionStageProps) {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<StudioExhibitionScene | null>(null);
  const heroCopyRef = useRef<HTMLDivElement | null>(null);

  const [explode, setExplode] = useState(0);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('frontal');
  const [autoRotate, setAutoRotate] = useState(true);
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [contextLost, setContextLost] = useState(false);

  // Mount Three.js scene once
  useEffect(() => {
    const mount = canvasMountRef.current;
    if (!mount) return;

    const scene = new StudioExhibitionScene(
      mount,
      activeProduct.id,
      activeFinish,
      (lost) => setContextLost(lost),
    );
    sceneRef.current = scene;

    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
    // Initialize once on mount; subsequent updates flow through dedicated effects
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // GSAP Hero entrance choreography (compositor-only opacity + y)
  useEffect(() => {
    const container = heroCopyRef.current;
    if (!container) return;
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      gsap.from('.hero-stagger', {
        y: 18,
        opacity: 0,
        duration: 0.65,
        stagger: 0.08,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
      });
    }, container);

    return () => ctx.revert();
  }, []);

  // Sync product changes into Three.js scene
  useEffect(() => {
    sceneRef.current?.setProduct(activeProduct.id);
  }, [activeProduct.id]);

  // Sync finish changes into Three.js scene
  useEffect(() => {
    sceneRef.current?.setFinish(activeFinish);
  }, [activeFinish]);

  // Keyboard shortcut 'H' to toggle HUD dock
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.key.toLowerCase() === 'h' &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        setDockCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleExplodeChange = (value: number) => {
    setExplode(value);
    sceneRef.current?.setExplode(value);
  };

  const handlePresetClick = (preset: CameraPreset) => {
    setCameraPreset(preset);
    sceneRef.current?.setCameraPreset(preset);
  };

  const handleToggleAutoRotate = () => {
    const next = !autoRotate;
    setAutoRotate(next);
    sceneRef.current?.setAutoRotate(next);
  };

  return (
    <section
      id="exhibicion"
      className="border-b border-white/10 bg-[#08080A]"
    >
      <div className="max-w-7xl mx-auto px-6 py-10 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          {/* Left Editorial Product Column */}
          <div
            ref={heroCopyRef}
            className="lg:col-span-4 flex flex-col justify-between gap-8"
          >
            <div className="space-y-5">
              <div className="hero-stagger flex items-center gap-2 text-xs text-zinc-400 tracking-wide">
                <span>Colección 2026</span>
                <span aria-hidden="true">·</span>
                <span>{activeProduct.category}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-zinc-300">{activeProduct.code}</span>
              </div>

              <h2
                className="hero-stagger font-display text-3xl sm:text-4xl lg:text-[2.5rem] font-semibold tracking-tight text-white leading-[1.12]"
                style={{ textWrap: 'balance' }}
              >
                {activeProduct.name}
              </h2>

              <p className="hero-stagger text-base text-zinc-300 leading-relaxed">
                {activeProduct.description}
              </p>

              <div className="hero-stagger pt-2 flex items-baseline justify-between border-t border-white/10">
                <div>
                  <span className="block text-xs text-zinc-500">Precio de catálogo</span>
                  <span className="font-mono text-2xl font-medium text-white tabular-nums">
                    ${activeProduct.price.toLocaleString('es-ES')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenSpecSheet(activeProduct)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-zinc-100 bg-[#141418] hover:bg-[#1D1D23] border border-white/15 rounded-md transition-colors duration-150 whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4A853]"
                >
                  <Eye className="w-3.5 h-3.5 text-[#D4A853]" aria-hidden="true" />
                  <span>Ficha técnica</span>
                </button>
              </div>
            </div>

            {/* Product Switcher List */}
            <div className="hero-stagger space-y-2 pt-2">
              <span className="block text-xs text-zinc-500">
                Piezas en exhibición
              </span>
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                {PRODUCTS.map((item, idx) => {
                  const isActive = item.id === activeProduct.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectProduct(item.id)}
                      className={`w-full text-left px-3.5 py-2.5 rounded-md border transition-colors duration-150 flex items-center justify-between gap-3 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4A853] ${
                        isActive
                          ? 'bg-[#16161B] border-[#D4A853]/60 text-white'
                          : 'bg-[#0E0E12] border-white/8 text-zinc-400 hover:text-zinc-100 hover:border-white/20'
                      }`}
                    >
                      <span className="text-sm font-medium truncate">
                        0{idx + 1}. {item.name}
                      </span>
                      <span className="font-mono text-xs text-zinc-500 shrink-0">
                        {item.code}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right 3D Studio Viewport (100% Unobstructed Center + Collapsible Bottom Dock) */}
          <div className="lg:col-span-8 relative rounded-xl border border-white/10 bg-[#0A0A0D] overflow-hidden min-h-[440px] sm:min-h-[520px] lg:min-h-[600px]">
            {/* Isolated WebGL mount */}
            <div
              ref={canvasMountRef}
              className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
              aria-label={`Visor 3D interactivo de ${activeProduct.name}`}
            />

            {/* Graceful Fallback if WebGL Context Lost */}
            {contextLost && (
              <div className="absolute inset-0 z-10 bg-[#0A0A0D] flex flex-col items-center justify-center p-6 text-center">
                <img
                  src={activeProduct.image}
                  alt={activeProduct.name}
                  referrerPolicy="no-referrer"
                  className="max-h-72 object-contain rounded-lg mb-4"
                />
                <p className="text-sm text-zinc-300">
                  Vista previa de estudio activada.
                </p>
              </div>
            )}

            {/* Minimal Top-Left Interaction Hint */}
            <div className="pointer-events-none absolute top-4 left-4 z-10 px-3 py-1.5 rounded-md bg-black/75 border border-white/10 text-xs text-zinc-300">
              Arrastra para rotar 360° · Rueda para acercar
            </div>

            {/* Collapsible Bottom Control Dock (Solid dark rgba, zero backdrop-filter over WebGL) */}
            <div
              className={`absolute left-1/2 -translate-x-1/2 bottom-4 z-20 w-[min(680px,calc(100%-2rem))] transition-transform duration-300 ease-out ${
                dockCollapsed ? 'translate-y-[calc(100%-26px)]' : 'translate-y-0'
              }`}
            >
              {/* Collapse / Expand Tab */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setDockCollapsed((v) => !v)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-t-md bg-[#111115] border border-b-0 border-white/15 text-[11px] font-medium text-zinc-300 hover:text-white cursor-pointer focus-visible:outline-2 focus-visible:outline-[#D4A853]"
                >
                  {dockCollapsed ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Mostrar controles</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Ocultar controles</span>
                    </>
                  )}
                </button>
              </div>

              {/* Unified Horizontal Dock */}
              <div className="rounded-lg bg-[#111115]/95 border border-white/15 px-4 py-3 flex flex-wrap items-center justify-between gap-4 shadow-2xl">
                {/* Finish Swatches */}
                <div className="flex items-center gap-2.5">
                  <span className="text-xs text-zinc-400 whitespace-nowrap">
                    Acabado
                  </span>
                  <div className="flex items-center gap-1.5">
                    {FINISH_OPTIONS.map((finish) => {
                      const selected = finish.id === activeFinish;
                      return (
                        <button
                          key={finish.id}
                          type="button"
                          title={finish.name}
                          aria-label={`Acabado ${finish.name}`}
                          onClick={() => onSelectFinish(finish.id)}
                          className={`w-6 h-6 rounded-full border transition-transform duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4A853] ${
                            selected
                              ? 'border-[#D4A853] scale-110'
                              : 'border-white/25 hover:scale-105'
                          }`}
                          style={{ backgroundColor: finish.swatchHex }}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Exploded View Slider */}
                <div className="flex items-center gap-2.5 min-w-[140px]">
                  <label
                    htmlFor="explode-range"
                    className="text-xs text-zinc-400 whitespace-nowrap"
                  >
                    Despiece
                  </label>
                  <input
                    id="explode-range"
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={explode}
                    onChange={(e) => handleExplodeChange(parseFloat(e.target.value))}
                    className="studio-slider w-24 cursor-pointer"
                  />
                </div>

                {/* Camera Presets + Auto Rotate */}
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center bg-black/60 p-0.5 rounded-md border border-white/10">
                    {CAMERA_LABELS.map((cam) => (
                      <button
                        key={cam.id}
                        type="button"
                        onClick={() => handlePresetClick(cam.id)}
                        className={`px-2.5 py-1 text-xs rounded transition-colors duration-150 whitespace-nowrap cursor-pointer ${
                          cameraPreset === cam.id
                            ? 'bg-zinc-800 text-white'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {cam.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleAutoRotate}
                    title={autoRotate ? 'Pausar rotación' : 'Activar rotación'}
                    aria-label={autoRotate ? 'Pausar rotación' : 'Activar rotación'}
                    className={`p-1.5 rounded-md border transition-colors duration-150 cursor-pointer ${
                      autoRotate
                        ? 'bg-[#D4A853]/15 border-[#D4A853]/50 text-[#D4A853]'
                        : 'bg-black/60 border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
